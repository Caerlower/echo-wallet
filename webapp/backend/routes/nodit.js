const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');

// 5-minute cache
const cache = new NodeCache({ stdTTL: 300 });

// Normalize data (simple version, can be extended)
function normalizeChainData(api, chain, data) {
  if (api === 'getTokensOwnedByAccount') {
    // Normalize tokens to always have symbol, name, balance, etc.
    return {
      items: (data.items || []).map(token => ({
        symbol: token.contract?.symbol || token.symbol || '?',
        name: token.contract?.name || token.name || 'Unknown',
        balance: Number(token.balance) || 0,
        decimals: token.contract?.decimals || token.decimals || 18,
        contractAddress: token.contract?.address || token.contractAddress || '',
        price: Number(token.price) || 0,
        value: Number(token.value) || 0,
      }))
    };
  }
  if (api === 'getTokenTransfersByAccount') {
    // Normalize transfers to always have symbol, value, etc.
    return {
      items: (data.items || []).map(tx => ({
        hash: tx.transactionHash || tx.hash || '',
        direction: tx.from && tx.to ? (tx.from.toLowerCase() === tx.accountAddress?.toLowerCase() ? 'OUT' : 'IN') : '',
        value: Number(tx.value) || 0,
        tokenSymbol: tx.contract?.symbol || tx.tokenSymbol || '?',
        tokenName: tx.contract?.name || tx.tokenName || 'Unknown',
        tokenAddress: tx.contract?.address || tx.tokenAddress || '',
        from: tx.from || '',
        to: tx.to || '',
        timestamp: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : '',
        type: 'token',
        blockNumber: tx.blockNumber || '',
      }))
    };
  }
  return data;
}

// Unified blockchain API handler
router.post('/', async (req, res) => {
  const { api, params, chain } = req.body;
  if (!api || !params || !chain) {
    return res.status(400).json({ error: 'Missing API parameters' });
  }
  try {
    const cacheKey = `${chain}:${api}:${JSON.stringify(params)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    // Only support base/mainnet for now
    if (chain !== 'base/mainnet') {
      return res.status(400).json({ error: 'Only base/mainnet is supported' });
    }
    let url, body, headers = { 'X-API-KEY': process.env.NODIT_API_KEY };
    switch(api) {
      case 'getTokenTransfersByAccount':
        url = 'https://web3.nodit.io/v1/base/mainnet/token/getTokenTransfersByAccount';
        body = { accountAddress: params.accountAddress, rpp: params.rpp || 100 };
        break;
      case 'getTokenPricesByContracts':
        url = 'https://web3.nodit.io/v1/base/mainnet/token/getTokenPricesByContracts';
        body = { contractAddresses: params.contractAddresses };
        break;
      case 'getTokensOwnedByAccount':
        url = 'https://web3.nodit.io/v1/base/mainnet/token/getTokensOwnedByAccount';
        body = { accountAddress: params.accountAddress, rpp: params.rpp || 100, page: params.page || 1 };
        break;
      case 'getTransactionsByAccount':
        url = 'https://web3.nodit.io/v1/base/mainnet/blockchain/getTransactionsByAccount';
        body = { accountAddress: params.accountAddress, rpp: params.rpp || 100 };
        break;
      default:
        return res.status(400).json({ error: 'Unsupported API method for Base' });
    }
    const response = await axios.post(url, body, { headers });
    let result = response.data;
    result = normalizeChainData(api, chain, result);
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Nodit API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Nodit API request failed',
      details: error.response?.data?.error || error.message
    });
  }
});

module.exports = router; 