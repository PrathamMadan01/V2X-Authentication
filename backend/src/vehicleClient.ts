import "dotenv/config";
import { ethers } from "ethers";
import axios from "axios";
import V2XAuthArtifact from "./abis/V2XAuth.json";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const RPC_URL = process.env.ETH_RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const SIMULATED_MODE = process.env.SIMULATED_MODE === "1";

if (!CONTRACT_ADDRESS && !SIMULATED_MODE) {
    console.error("CONTRACT_ADDRESS missing in env");
    process.exit(1);
}

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
    let wallet: ethers.Wallet | null = null;
    let contract: ethers.Contract | null = null;

    if (!SIMULATED_MODE) {
        if (!vehiclePrivateKey) {
            console.error("VEHICLE_PRIVATE_KEY must be set in env.");
            process.exit(1);
        }

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        wallet = new ethers.Wallet(vehiclePrivateKey, provider);
        contract = new ethers.Contract(CONTRACT_ADDRESS as string, V2XAuthArtifact.abi, wallet);

        console.log(`Vehicle Client Started`);
        console.log(`ID: ${vehicleId}`);
        console.log(`Address: ${wallet.address}`);
    } else {
        console.log(`Vehicle Client Started in SIMULATED_MODE (no blockchain)`);
        console.log(`ID: ${vehicleId}`);
    }

    try {
        if (!SIMULATED_MODE && wallet && contract) {
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
        } else {
            console.log("SIMULATED_MODE enabled: skipping blockchain registration/authentication and payments.");
        }

        const tollBooths = [
            {
                lat: 12.975,
                long: 77.59,
                operator: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
                amountEth: "0.01",
                radiusMeters: 300
            }
        ];

        const chargedTolls = new Set<number>();

        const toRad = (v: number) => (v * Math.PI) / 180;
        const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371000;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) *
                    Math.cos(toRad(lat2)) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

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

            if (!SIMULATED_MODE && contract) {
                for (let i = 0; i < tollBooths.length; i++) {
                    if (chargedTolls.has(i)) continue;
                    const toll = tollBooths[i];
                    const d = distanceMeters(lat, long, toll.lat, toll.long);
                    if (d <= toll.radiusMeters) {
                        try {
                            console.log(`\n[FASTAG] Approaching Toll at ${d.toFixed(1)}m...`);
                            const tollAmount = ethers.parseEther(toll.amountEth);
                            const tx = await contract.payToll(toll.operator, tollAmount);
                            console.log(`[FASTAG] Paid ${toll.amountEth} ETH toll. Tx: ${tx.hash}`);
                            await tx.wait();
                            console.log("[FASTAG] Toll payment confirmed.");
                            chargedTolls.add(i);
                        } catch (e: any) {
                            console.error("\n[FASTAG] Payment Failed:", e.message);
                        }
                    }
                }

                if (Math.random() < 0.01) {
                    console.log("\n!!! CRASH DETECTED !!!");
                    const location = `${lat.toFixed(4)},${long.toFixed(4)}`;
                    const details = "Impact detected front bumper";
                    
                    try {
                        const tx = await contract.reportAccident(
                            ethers.keccak256(ethers.toUtf8Bytes(vehicleId)),
                            location,
                            speed,
                            details
                        );
                        console.log(`[ACCIDENT] Reported on-chain. Tx: ${tx.hash}`);
                        
                        await axios.post(`${BACKEND_URL}/api/gps/report-accident`, {
                            vehicleId, location, speed, details
                        });
                        console.log(`[ACCIDENT] Reported to backend.`);
                    } catch (e: any) {
                        console.error("\n[ACCIDENT] Reporting failed:", e.message);
                    }
                }
            }

        }, 2000); // Every 2 seconds

    } catch (err: any) {
        console.error("\nFatal Error:", err.message);
        if (err.response) console.error(err.response.data);
    }
}

main();
