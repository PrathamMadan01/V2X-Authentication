import { ethers } from "hardhat";

async function main() {
  const V2XAuth = await ethers.getContractFactory("V2XAuth");
  const v2xAuth = await V2XAuth.deploy();

  await v2xAuth.waitForDeployment();

  const address = await v2xAuth.getAddress();
  console.log(`V2XAuth deployed to ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
