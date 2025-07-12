const express = require('express');
const router = express.Router();
const nodit = require('../services/nodit');
const { resolveENS } = require('../services/ens');

// Validate wallet address format
const isValidWallet = (input) => {
  return /^(0x[a-fA-F0-9]{40}|[a-zA-Z0-9]+\.eth)$/.test(input);
};

// Get wallet portfolio
router.get('/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!isValidWallet(address)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format. Use 0x... or name.eth' 
      });
    }

    let resolvedAddress = address;
    
    // Resolve ENS if needed
    if (address.endsWith('.eth')) {
      try {
        resolvedAddress = await resolveENS(address);
      } catch (ensError) {
        return res.status(400).json({ 
          error: `ENS resolution failed: ${ensError.message}` 
        });
      }
    }

    const portfolio = await nodit.getPortfolio(resolvedAddress);
    
    res.json({
      success: true,
      data: {
        address: resolvedAddress,
        ensName: address.endsWith('.eth') ? address : null,
        portfolio
      }
    });

  } catch (error) {
    console.error('[GET /portfolio] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch portfolio data',
      message: error.message 
    });
  }
});

// Get wallet insights (portfolio + transactions)
router.get('/insights/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { days = 30 } = req.query;
    
    if (!isValidWallet(address)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format. Use 0x... or name.eth' 
      });
    }

    let resolvedAddress = address;
    
    // Resolve ENS if needed
    if (address.endsWith('.eth')) {
      try {
        resolvedAddress = await resolveENS(address);
      } catch (ensError) {
        return res.status(400).json({ 
          error: `ENS resolution failed: ${ensError.message}` 
        });
      }
    }

    const insights = await nodit.getWalletInsights(resolvedAddress, parseInt(days));
    
    res.json({
      success: true,
      data: {
        address: resolvedAddress,
        ensName: address.endsWith('.eth') ? address : null,
        insights
      }
    });

  } catch (error) {
    console.error('[GET /insights] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch wallet insights',
      message: error.message 
    });
  }
});

// Get transaction history
router.get('/transactions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { type = 'all', limit = 50 } = req.query;
    
    if (!isValidWallet(address)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format. Use 0x... or name.eth' 
      });
    }

    let resolvedAddress = address;
    
    // Resolve ENS if needed
    if (address.endsWith('.eth')) {
      try {
        resolvedAddress = await resolveENS(address);
      } catch (ensError) {
        return res.status(400).json({ 
          error: `ENS resolution failed: ${ensError.message}` 
        });
      }
    }

    let transactions = [];
    
    if (type === 'all' || type === 'native') {
      const nativeTxs = await nodit.getNativeTransactions(resolvedAddress, parseInt(limit));
      transactions.push(...nativeTxs);
    }
    
    if (type === 'all' || type === 'token') {
      const tokenTxs = await nodit.getTokenTransfers(resolvedAddress, parseInt(limit));
      transactions.push(...tokenTxs);
    }

    // Sort by timestamp (newest first)
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      data: {
        address: resolvedAddress,
        ensName: address.endsWith('.eth') ? address : null,
        transactions: transactions.slice(0, parseInt(limit)),
        total: transactions.length
      }
    });

  } catch (error) {
    console.error('[GET /transactions] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transaction history',
      message: error.message 
    });
  }
});

// Search transactions
router.post('/search/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Search query is required' 
      });
    }
    
    if (!isValidWallet(address)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format. Use 0x... or name.eth' 
      });
    }

    let resolvedAddress = address;
    
    // Resolve ENS if needed
    if (address.endsWith('.eth')) {
      try {
        resolvedAddress = await resolveENS(address);
      } catch (ensError) {
        return res.status(400).json({ 
          error: `ENS resolution failed: ${ensError.message}` 
        });
      }
    }

    const searchResult = await nodit.searchTransactions(resolvedAddress, query);
    
    res.json({
      success: true,
      data: {
        address: resolvedAddress,
        ensName: address.endsWith('.eth') ? address : null,
        searchResult
      }
    });

  } catch (error) {
    console.error('[POST /search] Error:', error);
    res.status(500).json({ 
      error: 'Failed to search transactions',
      message: error.message 
    });
  }
});

// Get wallet balance
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!isValidWallet(address)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format. Use 0x... or name.eth' 
      });
    }

    let resolvedAddress = address;
    
    // Resolve ENS if needed
    if (address.endsWith('.eth')) {
      try {
        resolvedAddress = await resolveENS(address);
      } catch (ensError) {
        return res.status(400).json({ 
          error: `ENS resolution failed: ${ensError.message}` 
        });
      }
    }

    const balance = await nodit.getWalletBalance(resolvedAddress);
    
    res.json({
      success: true,
      data: {
        address: resolvedAddress,
        ensName: address.endsWith('.eth') ? address : null,
        balance: balance.toString(),
        balanceEth: balance
      }
    });

  } catch (error) {
    console.error('[GET /balance] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch wallet balance',
      message: error.message 
    });
  }
});

// Clear cache (admin endpoint)
router.post('/clear-cache', async (req, res) => {
  try {
    nodit.clearCache();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('[POST /clear-cache] Error:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      message: error.message 
    });
  }
});

module.exports = router; 