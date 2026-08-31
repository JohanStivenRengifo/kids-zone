const { ethers } = require('ethers');
const path = require('path');
const contractData = require(path.join(__dirname, 'contract.json'));

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

let contract = null;
let wallet = null;
let initialized = false;

function isConfigured() {
  return SEPOLIA_RPC_URL && PRIVATE_KEY && contractData.address !== '0x0000000000000000000000000000000000000000';
}

function getClient() {
  if (!initialized && isConfigured()) {
    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      contract = new ethers.Contract(contractData.address, contractData.abi, wallet);
      initialized = true;
    } catch (e) {
      console.warn('Blockchain client init failed:', e.message);
    }
  }
  return contract;
}

module.exports = {
  async notarize(module, id, hash) {
    const c = getClient();
    if (!c) throw new Error('Blockchain not configured');
    const tx = await c.notarize(module, id, hash);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, wallet: wallet.address };
  },

  async verify(module, id, hash) {
    const c = getClient();
    if (!c) throw new Error('Blockchain not configured');
    return await c.verify(module, id, hash);
  },

  async getRecord(module, id) {
    const c = getClient();
    if (!c) throw new Error('Blockchain not configured');
    const [documentHash, timestamp, walletAddr] = await c.getRecord(module, id);
    return { documentHash, timestamp: Number(timestamp), wallet: walletAddr };
  }
};
