import { Router } from "express";
import { randomUUID } from "crypto";
import { ethers } from "ethers";
import { BlockchainClient } from "../blockchain";

const router = Router();
const blockchain = new BlockchainClient();

// In-memory nonce store for demo purposes.
// In production, use a shared datastore (Redis, SQL, etc.).
const nonces = new Map<string, string>();

router.post("/vehicles/register", async (req, res) => {
  try {
    const { vehicleId, vehicleAddress } = req.body as {
      vehicleId?: string;
      vehicleAddress?: string;
    };

    if (!vehicleId || !vehicleAddress) {
      return res.status(400).json({ error: "vehicleId and vehicleAddress are required" });
    }

    if (!ethers.isAddress(vehicleAddress)) {
      return res.status(400).json({ error: "Invalid vehicleAddress" });
    }

    const { txHash } = await blockchain.registerVehicle(vehicleId, vehicleAddress);
    return res.status(201).json({ status: "registered", txHash });
  } catch (err: any) {
    console.error("registerVehicle error", err);
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

router.post("/vehicles/revoke", async (req, res) => {
  try {
    const { vehicleId } = req.body as { vehicleId?: string };
    if (!vehicleId) {
      return res.status(400).json({ error: "vehicleId is required" });
    }

    const { txHash } = await blockchain.revokeVehicle(vehicleId);
    return res.status(200).json({ status: "revoked", txHash });
  } catch (err: any) {
    console.error("revokeVehicle error", err);
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

router.post("/vehicles/nonce", async (req, res) => {
  try {
    const { vehicleId } = req.body as { vehicleId?: string };
    if (!vehicleId) {
      return res.status(400).json({ error: "vehicleId is required" });
    }

    const active = await blockchain.isVehicleActive(vehicleId);
    if (!active) {
      return res.status(403).json({ error: "Vehicle not active or not registered" });
    }

    const nonce = randomUUID();
    nonces.set(vehicleId, nonce);
    return res.status(200).json({ nonce });
  } catch (err: any) {
    console.error("nonce error", err);
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

router.post("/vehicles/authenticate", async (req, res) => {
  try {
    const { vehicleId, nonce, signature } = req.body as {
      vehicleId?: string;
      nonce?: string;
      signature?: string;
    };

    if (!vehicleId || !nonce || !signature) {
      return res.status(400).json({ error: "vehicleId, nonce and signature are required" });
    }

    const expectedNonce = nonces.get(vehicleId);
    if (!expectedNonce || expectedNonce !== nonce) {
      return res.status(401).json({ error: "Invalid or expired nonce" });
    }

    const vehicle = await blockchain.getVehicle(vehicleId);
    if (!vehicle || !vehicle.active) {
      return res.status(403).json({ error: "Vehicle not active or not registered" });
    }

    // Recover address from signature over the nonce.
    const recoveredAddress = ethers.verifyMessage(nonce, signature);
    const isValid = ethers.getAddress(recoveredAddress) === ethers.getAddress(vehicle.vehicleAddress);

    // One-time nonce use.
    nonces.delete(vehicleId);

    if (!isValid) {
      return res.status(401).json({ authenticated: false, reason: "Signature does not match registered vehicle" });
    }

    return res.status(200).json({
      authenticated: true,
      vehicleId,
      vehicleAddress: vehicle.vehicleAddress
    });
  } catch (err: any) {
    console.error("authenticate error", err);
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

router.get("/vehicles/:vehicleId/status", async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await blockchain.getVehicle(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ registered: false });
    }
    return res.status(200).json({
      registered: true,
      active: vehicle.active,
      vehicleAddress: vehicle.vehicleAddress,
      registeredAt: vehicle.registeredAt.toString(),
      revokedAt: vehicle.revokedAt.toString()
    });
  } catch (err: any) {
    console.error("status error", err);
    return res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

export default router;

