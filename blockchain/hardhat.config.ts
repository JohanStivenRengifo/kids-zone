import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const SEPOLIA_RPC_URL = (process.env.SEPOLIA_RPC_URL || "").trim().replace(/^['"]|['"]$/g, "");
const rawPk = (process.env.PRIVATE_KEY || "").trim().replace(/^['"]|['"]$/g, "");
const ETHERSCAN_API_KEY = (process.env.ETHERSCAN_API_KEY || "").trim().replace(/^['"]|['"]$/g, "");

// Normaliza private key: asegura 0x y valida 64 hex. Si no es válida, no se incluye para que `hardhat compile` no falle.
function normalizePk(pk: string): string | null {
  if (!pk) return null;
  let p = pk.trim();
  if (!p.startsWith("0x")) p = "0x" + p;
  return /^0x[0-9a-fA-F]{64}$/.test(p) ? p : null;
}
const PRIVATE_KEY_NORMALIZED = normalizePk(rawPk);
if (rawPk && !PRIVATE_KEY_NORMALIZED) {
  console.warn("⚠️  PRIVATE_KEY en .env no es una clave hex de 64 caracteres (0x + 64 hex). Se ignora para compile. Usa la clave privada exportada de MetaMask.");
}
if (SEPOLIA_RPC_URL && SEPOLIA_RPC_URL.includes("gas.api.infura.io")) {
  console.warn("⚠️  SEPOLIA_RPC_URL apunta a gas.api.infura.io (Gas API), no al RPC. Usa https://sepolia.infura.io/v3/TU_PROJECT_ID desde https://app.infura.io/key/all-endpoints");
}
if (SEPOLIA_RPC_URL && SEPOLIA_RPC_URL.includes("sepolia.api.infura.io")) {
  console.warn("⚠️  SEPOLIA_RPC_URL usa sepolia.api.infura.io (host inválido). El correcto es sepolia.infura.io");
}
if (SEPOLIA_RPC_URL && SEPOLIA_RPC_URL.includes("/v3/0x")) {
  console.warn("⚠️  SEPOLIA_RPC_URL contiene 0x... después de /v3/ — pusiste tu ADDRESS/PRIVATE_KEY en lugar del Infura Project ID (32 hex sin 0x). Ve a https://app.infura.io/key/all-endpoints → copia https://sepolia.infura.io/v3/<ID>");
}

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.28",
  },
  networks: {
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/placeholder",
      accounts: PRIVATE_KEY_NORMALIZED ? [PRIVATE_KEY_NORMALIZED] : [],
    },
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY,
      enabled: true,
    },
  },
});
