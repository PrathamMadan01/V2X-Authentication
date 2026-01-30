import "dotenv/config";
import { ethers } from "ethers";
import axios from "axios";
import V2XAuthArtifact from "./abis/V2XAuth.json";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const RPC_URL = process.env.ETH_RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

if (!CONTRACT_ADDRESS) {
    console.error("CONTRACT_ADDRESS missing in env");
    process.exit(1);
}

// Simulation State
let lat = 12.9716;
let long = 77.5946;
let speed = 0;

function move() {
    lat += (Math.random() - 0.5) * 0.001;
    long += (Math.random() - 0.5) * 0.001;
    speed = Math.floor(Math.random() * 60) + 20; // 20-80 km/h
    if (Math.random() > 0.95) speed = 0; // Traffic stop
}

async function main() {
    const vehicleId = process.env.VEHICLE_ID || "VIN123456789";
    const vehiclePrivateKey = process.env.VEHICLE_PRIVATE_KEY;

    if (!vehiclePrivateKey) {
        console.error("VEHICLE_PRIVATE_KEY must be set in env.");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(vehiclePrivateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS as string, V2XAuthArtifact.abi, wallet);

    console.log(`Vehicle Client Started`);
    console.log(`ID: ${vehicleId}`);
    console.log(`Address: ${wallet.address}`);

    try {
        // 1. Register (Idempotent usually, or handled by backend check)
        // We try to register via backend. Backend pays gas for registration.
        console.log("Attempting registration...");
        try {
            await axios.post(`${BACKEND_URL}/api/vehicles/register`, {
                vehicleId,
                vehicleAddress: wallet.address
            });
            console.log("Registration successful (or already registered).");
        } catch (e: any) {
            console.log("Registration skipped or failed (might be already registered):", e.message);
        }

        // 2. Authenticate
        console.log("Authenticating...");
        const nonceResp = await axios.post(`${BACKEND_URL}/api/vehicles/nonce`, { vehicleId });
        const nonce = nonceResp.data.nonce;
        const signature = await wallet.signMessage(nonce);
        const authResp = await axios.post(`${BACKEND_URL}/api/vehicles/authenticate`, {
            vehicleId, nonce, signature
        });
        if (authResp.data.authenticated) {
            console.log("Authenticated successfully!");
        } else {
            throw new Error("Authentication failed");
        }

        // 3. Deposit for Fastag (if balance low)
        const balance = await contract.balances(wallet.address);
        console.log(`Current Fastag Balance: ${ethers.formatEther(balance)} ETH`);
        
        if (balance < ethers.parseEther("0.1")) {
            console.log("Low balance. Depositing 1 ETH...");
            const tx = await contract.deposit({ value: ethers.parseEther("1.0") });
            await tx.wait();
            console.log("Deposit confirmed.");
        }

        // 4. Start Driving Loop
        console.log("Starting engine... (Press Ctrl+C to stop)");
        
        setInterval(async () => {
            move();
            
            // Send GPS to backend
            try {
                await axios.post(`${BACKEND_URL}/api/gps/update`, {
                    vehicleId,
                    lat,
                    long,
                    speed,
                    timestamp: Date.now()
                });
                process.stdout.write("."); // heartbeat
            } catch (e) {
                process.stdout.write("x");
            }

            // Random Toll Payment (10% chance)
            if (Math.random() < 0.1) {
                try {
                    console.log("\n[FASTAG] Approaching Toll...");
                    // Toll Operator (Address #19 from Hardhat list or random)
                    const tollOperator = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"; 
                    const tollAmount = ethers.parseEther("0.01");
                    
                    const tx = await contract.payToll(tollOperator, tollAmount);
                    console.log(`[FASTAG] Paid 0.01 ETH toll. Tx: ${tx.hash}`);
                    await tx.wait();
                    console.log("[FASTAG] Toll payment confirmed.");
                } catch (e: any) {
                    console.error("\n[FASTAG] Payment Failed:", e.message);
                }
            }

            // Random Accident (1% chance)
            if (Math.random() < 0.01) {
                console.log("\n!!! CRASH DETECTED !!!");
                const location = `${lat.toFixed(4)},${long.toFixed(4)}`;
                const details = "Impact detected front bumper";
                
                try {
                    // Report to Contract
                    const tx = await contract.reportAccident(
                        ethers.keccak256(ethers.toUtf8Bytes(vehicleId)),
                        location,
                        speed,
                        details
                    );
                    console.log(`[ACCIDENT] Reported on-chain. Tx: ${tx.hash}`);
                    
                    // Report to Backend
                    await axios.post(`${BACKEND_URL}/api/gps/report-accident`, {
                        vehicleId, location, speed, details
                    });
                    console.log(`[ACCIDENT] Reported to backend.`);
                } catch (e: any) {
                    console.error("\n[ACCIDENT] Reporting failed:", e.message);
                }
            }

        }, 2000); // Every 2 seconds

    } catch (err: any) {
        console.error("\nFatal Error:", err.message);
        if (err.response) console.error(err.response.data);
    }
}

main();
