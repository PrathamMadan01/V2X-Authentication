import { ethers, Contract, Wallet, JsonRpcProvider } from "ethers";
import V2XAuthArtifact from "./abis/V2XAuth.json";

export class BlockchainClient {
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private contract: Contract;

  constructor() {
    const rpcUrl = process.env.ETH_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error("Missing blockchain config (ETH_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS)");
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, V2XAuthArtifact.abi, this.wallet);
  }

  // Helper to hash vehicle ID consistently
  private hashVehicleId(vehicleId: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(vehicleId));
  }

  async registerVehicle(vehicleId: string, vehicleAddress: string) {
    const hash = this.hashVehicleId(vehicleId);
    console.log(`Registering vehicle ${vehicleId} (hash: ${hash}) to ${vehicleAddress}`);
    const tx = await this.contract.registerVehicle(hash, vehicleAddress);
    await tx.wait();
    return { txHash: tx.hash };
  }

  async revokeVehicle(vehicleId: string) {
    const hash = this.hashVehicleId(vehicleId);
    const tx = await this.contract.revokeVehicle(hash);
    await tx.wait();
    return { txHash: tx.hash };
  }

  async isVehicleActive(vehicleId: string): Promise<boolean> {
    const hash = this.hashVehicleId(vehicleId);
    return await this.contract.isVehicleActive(hash);
  }

  async getVehicle(vehicleId: string) {
    const hash = this.hashVehicleId(vehicleId);
    const v = await this.contract.getVehicle(hash);
    // v is a struct-like array/object
    return {
      vehicleAddress: v.vehicleAddress,
      active: v.active,
      registeredAt: v.registeredAt,
      revokedAt: v.revokedAt
    };
  }

  // --- New Features ---

  // Admin function to check balance of a vehicle (if public)
  async getBalance(address: string): Promise<bigint> {
    return await this.contract.balances(address);
  }
}
