import { network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  // Hardhat v3: connect() está deprecado, usa create()
  const connection = await (network as any).create();
  const { ethers } = connection;
  const net = await ethers.provider.getNetwork();
  console.log(`Deploying to chainId ${net.chainId} ...`);

  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No signer disponible. Verifica PRIVATE_KEY en .env");
  console.log(`Deployer: ${await deployer.getAddress()}`);
  console.log(`Balance: ${await ethers.provider.getBalance(deployer)}`);

  const contract = await ethers.deployContract("DocumentNotary");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`DocumentNotary deployed to: ${address}`);

  // Lee ABI directo de artifacts (más estable que hre.artifacts en v3)
  const artifactPath = path.resolve("artifacts/contracts/DocumentNotary.sol/DocumentNotary.json");
  const json = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const abi = json.abi;

  const outDir = path.resolve("../backend/src");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "contract.json"),
    JSON.stringify({ address, abi }, null, 2)
  );
  console.log(`Contract data written to ${outDir}/contract.json`);

  console.log(`Verifica en Etherscan: npx hardhat verify --network sepolia ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
