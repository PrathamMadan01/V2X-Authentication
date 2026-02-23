import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const V2XAuth = await ethers.getContractFactory("V2XAuth");
  const v2xAuth = await V2XAuth.deploy();

  await v2xAuth.waitForDeployment();

  const address = await v2xAuth.getAddress();
  console.log(`V2XAuth deployed to ${address}`);

  const backendEnvPath = path.resolve(__dirname, "..", "backend", ".env");
  try {
    if (fs.existsSync(backendEnvPath)) {
      let env = fs.readFileSync(backendEnvPath, "utf8");
      if (env.includes("CONTRACT_ADDRESS=")) {
        env = env.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${address}`);
      } else {
        if (!env.endsWith("\n")) env += "\n";
        env += `CONTRACT_ADDRESS=${address}\n`;
      }
      fs.writeFileSync(backendEnvPath, env);
      console.log(`Updated backend .env with CONTRACT_ADDRESS=${address}`);
    } else {
      console.log("backend/.env not found, skipping .env update");
    }
  } catch (e) {
    console.log("Failed to update backend .env", e);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
