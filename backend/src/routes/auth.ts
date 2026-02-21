import { Router } from "express";
import { randomUUID } from "crypto";
import { ethers } from "ethers";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import { BlockchainClient } from "../blockchain";
import { gpsData } from "./gps";

const router = Router();
const blockchain = new BlockchainClient();

const nonces = new Map<string, string>();
const mobileToId = new Map<string, string>();
const normalizeMobile = (m: string) => m.replace(/\D/g, "");
const runningClients = new Map<string, ChildProcess>();
const simulatedTimers = new Map<string, NodeJS.Timeout>();
const registeredVehicles: { vehicleId: string; vehicleAddress: string }[] = [];

router.post("/vehicles/register", async (req, res) => {
  try {
    const { vehicleId, vehicleAddress, mobileNumber } = req.body as {
      vehicleId?: string;
      vehicleAddress?: string;
      mobileNumber?: string;
    };

    let finalVehicleId = vehicleId;

    if (!finalVehicleId) {
        // Generate a random vehicle ID if not provided
        // Format: V2X-<8_CHARS_RANDOM>
        const randomSuffix = randomUUID().split('-')[0].toUpperCase();
        finalVehicleId = `V2X-${randomSuffix}`;
    }

    let finalAddress = vehicleAddress;
    let generatedPrivateKey = null;

    // If no address provided, try to generate one using mobileNumber (or just generate one)
    if (!finalAddress) {
        if (!mobileNumber) {
             return res.status(400).json({ error: "Either vehicleAddress or mobileNumber is required" });
        }
        // Generate a new random wallet for the user
        const wallet = ethers.Wallet.createRandom();
        finalAddress = wallet.address;
        generatedPrivateKey = wallet.privateKey;
    }

    if (!ethers.isAddress(finalAddress)) {
      return res.status(400).json({ error: "Invalid vehicleAddress" });
    }

    let txHash: string | null = null;
    try {
      const result = await blockchain.registerVehicle(finalVehicleId, finalAddress);
      txHash = result.txHash;
    } catch (err: any) {
      if (err?.code === "CALL_EXCEPTION") {
        console.warn("registerVehicle: already registered on-chain, treating as idempotent");
      } else {
        throw err;
      }
    }

    if (!registeredVehicles.find(v => v.vehicleId === finalVehicleId)) {
      registeredVehicles.push({ vehicleId: finalVehicleId, vehicleAddress: finalAddress });
    }

    if (mobileNumber) {
        mobileToId.set(normalizeMobile(mobileNumber), finalVehicleId);
    }

    // Return the generated credentials if applicable
    return res.status(201).json({
      status: "registered",
      txHash,
      vehicleId: finalVehicleId,
      vehicleAddress: finalAddress,
      privateKey: generatedPrivateKey
    });
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

router.get("/vehicles/lookup/:mobile", (req, res) => {
    const { mobile } = req.params;
    const vehicleId = mobileToId.get(normalizeMobile(mobile));
    
    if (!vehicleId) {
        return res.status(404).json({ error: "No vehicle found for this mobile number" });
    }
    
    return res.json({ vehicleId });
});

router.get("/vehicles/registered", (_req, res) => {
  return res.json(registeredVehicles);
});

const startSimulatedClient = (vehicleId: string) => {
  if (simulatedTimers.has(vehicleId)) {
    return { status: "already_running", vehicleId };
  }

  let lat = 12.9716;
  let long = 77.5946;
  let speed = 0;

  const timer = setInterval(() => {
    lat += (Math.random() - 0.5) * 0.001;
    long += (Math.random() - 0.5) * 0.001;
    speed = Math.floor(Math.random() * 60) + 20;
    if (Math.random() > 0.95) speed = 0;

    const data = {
      vehicleId,
      lat,
      long,
      speed,
      timestamp: Date.now()
    };
    gpsData.set(vehicleId, data);
    process.stdout.write(".");
  }, 2000);

  simulatedTimers.set(vehicleId, timer);

  return { status: "started", vehicleId };
};

router.post("/vehicles/:vehicleId/client/start", (req, res) => {
  const { vehicleId } = req.params;

  if (!vehicleId) {
    return res.status(400).json({ error: "vehicleId is required" });
  }

  const result = startSimulatedClient(vehicleId);
  return res.json(result);
});

router.post("/vehicles/:vehicleId/client/start-chain", (req, res) => {
  const { vehicleId } = req.params;
  const { privateKey } = req.body as { privateKey?: string };

  if (!vehicleId) {
    return res.status(400).json({ error: "vehicleId is required" });
  }

  if (!privateKey) {
    return res.status(400).json({ error: "privateKey is required" });
  }

  const key = `${vehicleId}:chain`;

  if (runningClients.has(key)) {
    return res.json({ status: "already_running", vehicleId, mode: "chain" });
  }

  const backendRoot = path.resolve(__dirname, "..", "..");
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  try {
    const child = spawn(npmCmd, ["run", "vehicle:demo"], {
      cwd: backendRoot,
      env: {
        ...process.env,
        VEHICLE_ID: vehicleId,
        VEHICLE_PRIVATE_KEY: privateKey
      }
    });

    runningClients.set(key, child);
    child.on("exit", () => {
      runningClients.delete(key);
    });

    return res.json({ status: "started", vehicleId, mode: "chain" });
  } catch (err: any) {
    console.error("Failed to start chain vehicle client", err);
    return res.status(500).json({ error: err?.message ?? "Failed to start chain vehicle client" });
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
    startSimulatedClient(vehicleId);
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

