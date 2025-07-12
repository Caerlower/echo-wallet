const { Web3 } = require('web3');
require('dotenv').config();

// Use Ethereum mainnet RPC (ENS resolution happens on L1)
const web3 = new Web3(process.env.ETH_RPC_URL || 'https://cloudflare-eth.com');

async function resolveENS(ensName) {
  try {
    // Validate ENS name format
    if (!ensName || typeof ensName !== 'string') {
      throw new Error('Invalid ENS name provided');
    }
    
    // Basic ENS format validation
    if (!ensName.endsWith('.eth') || ensName.length < 4) {
      throw new Error('Invalid ENS name format. Must end with .eth and be at least 4 characters');
    }
    
    // Check if ENS name contains valid characters
    const ensRegex = /^[a-zA-Z0-9-]+\.eth$/;
    if (!ensRegex.test(ensName)) {
      throw new Error('ENS name contains invalid characters');
    }
    
    console.log(`🔍 Resolving ENS: ${ensName}`);
    
    const address = await web3.eth.ens.getAddress(ensName);
    
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      throw new Error(`ENS name "${ensName}" does not resolve to a valid address`);
    }
    
    console.log(`✅ ENS resolved: ${ensName} → ${address}`);
    return address;
    
  } catch (error) {
    console.error(`❌ ENS resolution failed for ${ensName}:`, error.message);
    
    // Provide user-friendly error messages
    if (error.message.includes('does not resolve')) {
      throw new Error(`ENS name "${ensName}" is not registered or has no address set`);
    } else if (error.message.includes('network')) {
      throw new Error('Network error while resolving ENS. Please try again.');
    } else if (error.message.includes('timeout')) {
      throw new Error('ENS resolution timed out. Please try again.');
    } else {
      throw new Error(`ENS resolution failed: ${error.message}`);
    }
  }
}

async function reverseResolveENS(address) {
  try {
    // Validate address format
    if (!web3.utils.isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }
    
    console.log(`🔍 Reverse resolving ENS for: ${address}`);
    
    const ensName = await web3.eth.ens.getName(address);
    
    if (!ensName || ensName === '') {
      return null; // No reverse resolution found
    }
    
    console.log(`✅ Reverse ENS resolved: ${address} → ${ensName}`);
    return ensName;
    
  } catch (error) {
    console.error(`❌ Reverse ENS resolution failed for ${address}:`, error.message);
    return null; // Return null instead of throwing for reverse resolution
  }
}

module.exports = { 
  resolveENS, 
  reverseResolveENS 
}; 