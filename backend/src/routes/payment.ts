import { Router } from "express";
import { BlockchainClient } from "../blockchain";
import { ethers } from "ethers";

const router = Router();
const blockchain = new BlockchainClient();

router.get("/balance/:address", async (req, res) => {
    try {
        const { address } = req.params;
        const balance = await blockchain.getBalance(address);
        return res.json({ address, balance: ethers.formatEther(balance) });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
