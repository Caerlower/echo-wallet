const express = require('express');
const router = express.Router();
const perplexity = require('../services/perplexity');
const nodit = require('../services/nodit');
const { resolveENS } = require('../services/ens');

// Validate wallet address format
const isValidWallet = (input) => {
  return /^(0x[a-fA-F0-9]{40}|[a-zA-Z0-9]+\.eth)$/.test(input);
};

// Analyze wallet with AI
router.post('/analyze-wallet', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address || !isValidWallet(address)) {
      return res.status(400).json({ 
        error: 'Valid wallet address is required (0x... or name.eth)' 
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

    // Get wallet data
    const insights = await nodit.getWalletInsights(resolvedAddress);
    const portfolio = insights.portfolio;
    const transactions = insights.activity.recentActivity;

    // Analyze with AI
    const analysis = await perplexity.queryWallet(resolvedAddress, transactions, portfolio);
    
    res.json({
      success: true,
      data: {
        address: resolvedAddress,
        ensName: address.endsWith('.eth') ? address : null,
        analysis,
        portfolio: {
          totalValue: portfolio.totalValue,
          assetCount: portfolio.assets.length
        },
        activity: {
          totalTransactions: insights.activity.totalTransactions,
          recentTransactions: transactions.length
        }
      }
    });

  } catch (error) {
    console.error('[POST /analyze-wallet] Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze wallet',
      message: error.message 
    });
  }
});

// Analyze portfolio with AI
router.post('/analyze-portfolio', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address || !isValidWallet(address)) {
      return res.status(400).json({ 
        error: 'Valid wallet address is required (0x... or name.eth)' 
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

    // Get portfolio data
    const portfolio = await nodit.getPortfolio(resolvedAddress);

    // Analyze portfolio with AI
    const analysis = await perplexity.analyzePortfolio(portfolio, resolvedAddress);
    
    res.json({
      success: true,
      data: {
        address: resolvedAddress,
        ensName: address.endsWith('.eth') ? address : null,
        analysis,
        portfolio: {
          totalValue: portfolio.totalValue,
          assetCount: portfolio.assets.length,
          assets: portfolio.assets.slice(0, 10) // Top 10 assets
        }
      }
    });

  } catch (error) {
    console.error('[POST /analyze-portfolio] Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze portfolio',
      message: error.message 
    });
  }
});

// Explain transaction with AI
router.post('/explain-transaction', async (req, res) => {
  try {
    const { transaction } = req.body;
    
    if (!transaction || !transaction.hash) {
      return res.status(400).json({ 
        error: 'Valid transaction data is required' 
      });
    }

    // Explain transaction with AI
    const explanation = await perplexity.explainTransaction(transaction);
    
    res.json({
      success: true,
      data: {
        transaction: {
          hash: transaction.hash,
          type: transaction.type,
          direction: transaction.direction,
          value: transaction.value,
          tokenSymbol: transaction.tokenSymbol
        },
        explanation
      }
    });

  } catch (error) {
    console.error('[POST /explain-transaction] Error:', error);
    res.status(500).json({ 
      error: 'Failed to explain transaction',
      message: error.message 
    });
  }
});

// Answer general question
router.post('/ask', async (req, res) => {
  try {
    const { question, walletContext } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ 
        error: 'Question is required' 
      });
    }

    // Answer question with AI
    const answer = await perplexity.answerGeneralQuestion(question, walletContext);
    
    res.json({
      success: true,
      data: {
        question,
        answer,
        walletContext: walletContext ? {
          address: walletContext.address,
          balance: walletContext.balance
        } : null
      }
    });

  } catch (error) {
    console.error('[POST /ask] Error:', error);
    res.status(500).json({ 
      error: 'Failed to answer question',
      message: error.message 
    });
  }
});

// Get AI suggestions for wallet analysis
router.get('/suggestions/:address', async (req, res) => {
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

    // Get basic wallet data for context
    const insights = await nodit.getWalletInsights(resolvedAddress);
    const portfolio = insights.portfolio;
    const activity = insights.activity;

    // Generate contextual suggestions
    const suggestions = [];

    // Portfolio-based suggestions
    if (portfolio.totalValue > 0) {
      suggestions.push({
        type: 'portfolio',
        title: '📊 Portfolio Analysis',
        description: 'Get AI-powered insights about your portfolio composition and optimization opportunities',
        action: 'analyze_portfolio',
        priority: 'high'
      });
    }

    // Transaction-based suggestions
    if (activity.totalTransactions > 0) {
      suggestions.push({
        type: 'transactions',
        title: '🔍 Transaction Analysis',
        description: 'Understand your recent transaction patterns and identify trends',
        action: 'analyze_transactions',
        priority: 'medium'
      });
    }

    // General suggestions
    suggestions.push(
      {
        type: 'general',
        title: '💰 Portfolio Value',
        description: 'Check your current portfolio value and asset breakdown',
        action: 'show_portfolio',
        priority: 'high'
      },
      {
        type: 'general',
        title: '📈 Recent Activity',
        description: 'View your latest transactions and transfers',
        action: 'show_transactions',
        priority: 'medium'
      },
      {
        type: 'general',
        title: '🔎 Search Transactions',
        description: 'Search for specific transactions or tokens',
        action: 'search_transactions',
        priority: 'low'
      }
    );

    // Add AI-specific suggestions if configured
    if (perplexity.isConfigured()) {
      suggestions.push({
        type: 'ai',
        title: '🤖 AI Wallet Analysis',
        description: 'Get comprehensive AI analysis of your wallet activity and patterns',
        action: 'ai_analysis',
        priority: 'high'
      });
    }

    res.json({
      success: true,
      data: {
        address: resolvedAddress,
        ensName: address.endsWith('.eth') ? address : null,
        suggestions: suggestions.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }),
        context: {
          hasPortfolio: portfolio.totalValue > 0,
          hasTransactions: activity.totalTransactions > 0,
          aiEnabled: perplexity.isConfigured()
        }
      }
    });

  } catch (error) {
    console.error('[GET /suggestions] Error:', error);
    res.status(500).json({ 
      error: 'Failed to get suggestions',
      message: error.message 
    });
  }
});

// Check AI service status
router.get('/status', async (req, res) => {
  try {
    const status = {
      configured: perplexity.isConfigured(),
      available: false
    };

    if (status.configured) {
      // Test AI service with a simple query
      try {
        await perplexity.answerGeneralQuestion('Hello');
        status.available = true;
      } catch (error) {
        status.available = false;
        status.error = error.message;
      }
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('[GET /status] Error:', error);
    res.status(500).json({ 
      error: 'Failed to check AI status',
      message: error.message 
    });
  }
});

module.exports = router; 