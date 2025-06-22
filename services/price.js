const axios = require('axios');

const CG_API_URL = 'https://api.coingecko.com/api/v3';

// Cache for prices to reduce API calls
const priceCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1200; // 1.2 seconds between requests

// Fallback prices for common tokens (updated periodically)
const fallbackPrices = {
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 2300, // ETH
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 1, // USDC
  '0x4200000000000000000000000000000000000006': 2300, // WETH
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 1, // DAI
  '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22': 2300, // cbETH
  '0x236aa50979dbf4de0c0aa16b3c4c4b3b3b3b3b3b': 1, // USDbC
};

// Rate limiting function
function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    return new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = now;
  return Promise.resolve();
}

// Check if cached price is still valid
function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_DURATION;
}

/**
 * Fetches the price of a token in USD using its contract address on the Base network.
 * @param {string} tokenAddress - The contract address of the token.
 * @returns {Promise<number>} The price of the token in USD.
 */
async function getTokenPrice(tokenAddress) {
  const normalizedAddress = tokenAddress.toLowerCase();
  
  // Check cache first
  const cached = priceCache.get(normalizedAddress);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.price;
  }

  // Use fallback price if available
  if (fallbackPrices[normalizedAddress]) {
    const fallbackPrice = fallbackPrices[normalizedAddress];
    priceCache.set(normalizedAddress, { price: fallbackPrice, timestamp: Date.now() });
    return fallbackPrice;
  }

  // Map native ETH to CoinGecko's ID
  let coinGeckoId = normalizedAddress;
  if (normalizedAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    coinGeckoId = 'ethereum';
  }

  try {
    await waitForRateLimit();
    
    const response = await axios.get(`${CG_API_URL}/simple/token_price/base`, {
      params: {
        contract_addresses: tokenAddress,
        vs_currencies: 'usd',
      },
      timeout: 8000, // Reduced timeout
    });

    const priceData = response.data[normalizedAddress];
    if (priceData && priceData.usd) {
      const price = priceData.usd;
      priceCache.set(normalizedAddress, { price, timestamp: Date.now() });
      return price;
    }
    
    // Fallback for tokens not on 'base' but available globally (like ETH)
    if (coinGeckoId === 'ethereum') {
      await waitForRateLimit();
      const ethResponse = await axios.get(`${CG_API_URL}/simple/price`, {
        params: { ids: 'ethereum', vs_currencies: 'usd' },
        timeout: 8000
      });
      if (ethResponse.data.ethereum && ethResponse.data.ethereum.usd) {
        const price = ethResponse.data.ethereum.usd;
        priceCache.set(normalizedAddress, { price, timestamp: Date.now() });
        return price;
      }
    }

    console.warn(`[CoinGecko] Could not fetch price for ${tokenAddress}`);
    return 0;
  } catch (error) {
    console.warn(`[CoinGecko] Error fetching price for ${tokenAddress}: ${error.message}`);
    
    // Use fallback price on error
    if (fallbackPrices[normalizedAddress]) {
      const fallbackPrice = fallbackPrices[normalizedAddress];
      priceCache.set(normalizedAddress, { price: fallbackPrice, timestamp: Date.now() });
      return fallbackPrice;
    }
    
    return 0;
  }
}

/**
 * Fetches prices for multiple tokens in a single call.
 * @param {string[]} tokenAddresses - An array of token contract addresses.
 * @returns {Promise<{[address: string]: number}>} A map of token addresses to their USD prices.
 */
async function getMultipleTokenPrices(tokenAddresses) {
  const priceMap = {};
  const addressesToFetch = [];

  // First, check cache and fallback prices
  for (const address of tokenAddresses) {
    const normalizedAddress = address.toLowerCase();
    
    // Check cache
    const cached = priceCache.get(normalizedAddress);
    if (cached && isCacheValid(cached.timestamp)) {
      priceMap[address] = cached.price;
      continue;
    }
    
    // Check fallback prices
    if (fallbackPrices[normalizedAddress]) {
      const fallbackPrice = fallbackPrices[normalizedAddress];
      priceCache.set(normalizedAddress, { price: fallbackPrice, timestamp: Date.now() });
      priceMap[address] = fallbackPrice;
      continue;
    }
    
    // Need to fetch from API
    addressesToFetch.push(address);
  }

  // If we have addresses to fetch, do it in batches
  if (addressesToFetch.length > 0) {
    try {
      await waitForRateLimit();
      
      // Limit batch size to avoid API issues
      const batchSize = 20;
      const batches = [];
      for (let i = 0; i < addressesToFetch.length; i += batchSize) {
        batches.push(addressesToFetch.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        try {
          const addressString = batch.join(',');
          const response = await axios.get(`${CG_API_URL}/simple/token_price/base`, {
            params: {
              contract_addresses: addressString,
              vs_currencies: 'usd',
            },
            timeout: 10000, // Increased timeout for batch requests
          });

          for (const address of batch) {
            const normalizedAddress = address.toLowerCase();
            const priceData = response.data[normalizedAddress];
            
            if (priceData && priceData.usd) {
              const price = priceData.usd;
              priceCache.set(normalizedAddress, { price, timestamp: Date.now() });
              priceMap[address] = price;
            } else {
              priceMap[address] = 0;
              console.warn(`[CoinGecko] Price not found for ${address} in batch fetch.`);
            }
          }
          
          // Add delay between batches
          if (batches.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (batchError) {
          console.warn(`[CoinGecko] Batch fetch failed: ${batchError.message}`);
          
          // Use fallback prices for this batch
          for (const address of batch) {
            const normalizedAddress = address.toLowerCase();
            if (fallbackPrices[normalizedAddress]) {
              const fallbackPrice = fallbackPrices[normalizedAddress];
              priceCache.set(normalizedAddress, { price: fallbackPrice, timestamp: Date.now() });
              priceMap[address] = fallbackPrice;
            } else {
              priceMap[address] = 0;
            }
          }
        }
      }
    } catch (error) {
      console.warn('[CoinGecko] Error fetching multiple token prices:', error.message);
      
      // Use fallback prices for any remaining addresses
      for (const address of addressesToFetch) {
        const normalizedAddress = address.toLowerCase();
        if (fallbackPrices[normalizedAddress]) {
          const fallbackPrice = fallbackPrices[normalizedAddress];
          priceCache.set(normalizedAddress, { price: fallbackPrice, timestamp: Date.now() });
          priceMap[address] = fallbackPrice;
        } else {
          priceMap[address] = 0;
        }
      }
    }
  }

  return priceMap;
}

module.exports = {
  getTokenPrice,
  getMultipleTokenPrices,
}; 