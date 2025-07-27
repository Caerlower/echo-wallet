const express = require('express');
const router = express.Router();
const nodit = require('../services/nodit');
const perplexity = require('../services/perplexity');
const { resolveENS } = require('../services/ens');

// Helper function to format dates nicely
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

// Validate wallet address format
const isValidWallet = (input) => {
  return /^(0x[a-fA-F0-9]{40}|[a-zA-Z0-9]+\.eth)$/.test(input);
};

// Extract wallet address from text
const extractAddressFromText = (text) => {
  const addressRegex = /0x[a-fA-F0-9]{40}/;
  const ensRegex = /[a-zA-Z0-9-]+\.eth/;
  
  const address = text.match(addressRegex);
  const ens = text.match(ensRegex);
  
  return address ? address[0] : (ens ? ens[0] : null);
};

// Process chat message and generate response
router.post('/process', async (req, res) => {
  try {
    const { message, walletAddress, context } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    const userMessage = message.trim().toLowerCase();
    let response = null;
    let data = null;

    // Check if message contains a wallet address
    const extractedAddress = extractAddressFromText(userMessage);
    const targetAddress = extractedAddress || walletAddress;

    // Handle different types of queries
    if (userMessage.includes('portfolio') || userMessage.includes('balance') || userMessage.includes('assets')) {
      if (!targetAddress) {
        response = "I'd be happy to help you check your portfolio! Please connect your wallet or provide a wallet address (0x... or name.eth).";
      } else {
        try {
          let resolvedAddress = targetAddress;
          
          if (targetAddress.endsWith('.eth')) {
            resolvedAddress = await resolveENS(targetAddress);
          }
          
          const portfolio = await nodit.getPortfolio(resolvedAddress);
          
          if (portfolio.totalValue > 0) {
            const topAssets = portfolio.assets.slice(0, 5);
            const assetList = topAssets.map(asset => {
              const balance = asset.balance < 0.0001 ? asset.balance.toFixed(8) : asset.balance.toFixed(4);
              const value = asset.value && asset.value > 0 ? `$${asset.value.toFixed(2)}` : 'No price data';
              return `- **${balance} ${asset.symbol}** (${value})`;
            }).join('\n');
            
            response = `## 💰 Portfolio Overview\n\n**Total Value:** $${portfolio.totalValue.toFixed(2)}\n**Assets:** ${portfolio.assets.length}\n\n### Top Assets:\n${assetList}`;
            
            if (portfolio.assets.length > 5) {
              response += `\n\n...and ${portfolio.assets.length - 5} other asset(s).`;
            }
          } else {
            response = "## 💰 Portfolio Overview\n\nThis wallet currently has no detectable assets on the Base chain.";
          }
          
          data = { portfolio, address: resolvedAddress };
        } catch (error) {
          response = `Sorry, I couldn't fetch the portfolio data: ${error.message}`;
        }
      }
    }
    
    else if (userMessage.includes('transaction') || userMessage.includes('history') || userMessage.includes('activity')) {
      if (!targetAddress) {
        response = "I'd be happy to show you transaction history! Please connect your wallet or provide a wallet address (0x... or name.eth).";
      } else {
        try {
          let resolvedAddress = targetAddress;
          
          if (targetAddress.endsWith('.eth')) {
            resolvedAddress = await resolveENS(targetAddress);
          }
          
          const insights = await nodit.getWalletInsights(resolvedAddress);
          const transactions = insights.activity.recentActivity;
          
          if (transactions.length > 0) {
            const recentTxs = transactions.slice(0, 5);
            const txList = recentTxs.map(tx => {
              const action = tx.direction === 'IN' ? '**Received**' : '**Sent**';
              const transactionType = tx.type === 'native' ? 'ETH' : 'Token';
              const shortAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
              const otherParty = tx.direction === 'IN' ? shortAddress(tx.from) : shortAddress(tx.to);
              
              return `- ${action} **${tx.value} ${tx.tokenSymbol}** (${transactionType}) from ${otherParty} (${formatDate(tx.timestamp)})`;
            }).join('\n');
            
            // Calculate summary for recent transactions
            const received = recentTxs.filter(tx => tx.direction === 'IN').length;
            const sent = recentTxs.filter(tx => tx.direction === 'OUT').length;
            
            response = `## 📈 Recent Activity\n\n**Total Transactions:** ${insights.activity.totalTransactions}\n**Net ETH Flow:** ${insights.activity.netFlowETH} ETH\n**Recent Summary:** ${received} received, ${sent} sent\n\n### Latest Transactions:\n${txList}`;
          } else {
            response = "## 📈 Recent Activity\n\nNo recent transaction activity found for this wallet.";
          }
          
          data = { insights, address: resolvedAddress };
        } catch (error) {
          response = `Sorry, I couldn't fetch the transaction history: ${error.message}`;
        }
      }
    }
    
    else if (userMessage.includes('analyze') || userMessage.includes('ai') || userMessage.includes('insights')) {
      if (!targetAddress) {
        response = "I'd be happy to provide AI analysis! Please connect your wallet or provide a wallet address (0x... or name.eth).";
      } else if (!perplexity.isConfigured()) {
        response = "AI analysis is currently not available. Please try again later.";
      } else {
        try {
          let resolvedAddress = targetAddress;
          
          if (targetAddress.endsWith('.eth')) {
            resolvedAddress = await resolveENS(targetAddress);
          }
          
          const insights = await nodit.getWalletInsights(resolvedAddress);
          const analysis = await perplexity.queryWallet(resolvedAddress, insights.activity.recentActivity, insights.portfolio);
          
          response = analysis;
          data = { insights, analysis, address: resolvedAddress };
        } catch (error) {
          response = `Sorry, I couldn't complete the AI analysis: ${error.message}`;
        }
      }
    }
    
    else if (userMessage.includes('search') || userMessage.includes('find')) {
      if (!targetAddress) {
        response = "I'd be happy to help you search! Please connect your wallet or provide a wallet address (0x... or name.eth).";
      } else {
        // Extract search query (remove common words)
        const searchQuery = userMessage
          .replace(/search|find|for|in|my|wallet|transactions?/gi, '')
          .replace(/0x[a-fA-F0-9]{40}|[a-zA-Z0-9-]+\.eth/gi, '')
          .trim();
        
        if (!searchQuery) {
          response = "Please specify what you'd like to search for. For example: 'search for USDC transactions' or 'find ETH transfers'.";
        } else {
          try {
            let resolvedAddress = targetAddress;
            
            if (targetAddress.endsWith('.eth')) {
              resolvedAddress = await resolveENS(targetAddress);
            }
            
            const searchResult = await nodit.searchTransactions(resolvedAddress, searchQuery);
            
            if (searchResult.transactions && searchResult.transactions.length > 0) {
              const txList = searchResult.transactions.slice(0, 5).map(tx => {
                const action = tx.direction === 'IN' ? '**Received**' : '**Sent**';
                const transactionType = tx.type === 'native' ? 'ETH Transfer' : 'Token Transfer';
                const shortAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
                const otherParty = tx.direction === 'IN' ? shortAddress(tx.from) : shortAddress(tx.to);
                
                return `- ${action} **${tx.value} ${tx.tokenSymbol}** (${transactionType}) from ${otherParty} (${formatDate(tx.timestamp)})`;
              }).join('\n');
              
              // Calculate summary
              const received = searchResult.transactions.filter(tx => tx.direction === 'IN').length;
              const sent = searchResult.transactions.filter(tx => tx.direction === 'OUT').length;
              const totalValue = searchResult.transactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
              
              response = `## 🔍 Search Results for "${searchQuery}"\n\nFound **${searchResult.transactions.length}** matching transactions:\n**Summary:** ${received} received, ${sent} sent (Total: ${totalValue.toFixed(6)} ${searchQuery.toUpperCase()})\n\n${txList}`;
            } else {
              response = `## 🔍 Search Results for "${searchQuery}"\n\nNo transactions found matching "${searchQuery}".`;
            }
            
            data = { searchResult, address: resolvedAddress };
          } catch (error) {
            response = `Sorry, I couldn't complete the search: ${error.message}`;
          }
        }
      }
    }
    
    else if (userMessage.includes('help') || userMessage.includes('what can you do')) {
      response = `## 🤖 EchoWallet Assistant\n\nI can help you with:\n\n- 💰 **Portfolio Analysis** - Check your assets and values\n- 📈 **Transaction History** - View recent activity\n- 🤖 **AI Insights** - Get intelligent analysis of your wallet\n- 🔍 **Search Transactions** - Find specific transactions\n- 📊 **Wallet Statistics** - View comprehensive wallet data\n\nJust ask me about your wallet or connect it to get started!`;
    }
    
    else if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('hey')) {
      response = `👋 Hello! I'm EchoWallet, your AI-powered blockchain assistant for the Base chain. I can help you analyze wallets, check portfolios, and provide insights about your transactions. What would you like to know?`;
    }
    
    else {
      // General question - try to answer with AI if available
      if (perplexity.isConfigured()) {
        try {
          const walletContext = walletAddress ? { address: walletAddress } : null;
          const answer = await perplexity.answerGeneralQuestion(userMessage, walletContext);
          response = answer;
        } catch (error) {
          response = `I'm not sure how to help with that specific question. Try asking about portfolios, transactions, or wallet analysis. You can also say "help" to see what I can do!`;
        }
      } else {
        response = `I'm not sure how to help with that specific question. Try asking about portfolios, transactions, or wallet analysis. You can also say "help" to see what I can do!`;
      }
    }

    res.json({
      success: true,
      data: {
        response,
        data,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[POST /process] Error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      message: error.message 
    });
  }
});

// Get chat suggestions based on wallet context
router.get('/suggestions', async (req, res) => {
  try {
    const { walletAddress } = req.query;
    
    const suggestions = [
      {
        id: 'portfolio',
        title: '💰 Check Portfolio',
        description: 'View your current assets and values',
        icon: '💰',
        action: 'show_portfolio'
      },
      {
        id: 'transactions',
        title: '📈 Recent Activity',
        description: 'See your latest transactions',
        icon: '📈',
        action: 'show_transactions'
      },
      {
        id: 'ai_analysis',
        title: '🤖 AI Analysis',
        description: 'Get intelligent insights about your wallet',
        icon: '🤖',
        action: 'ai_analysis'
      },
      {
        id: 'search',
        title: '🔍 Search Transactions',
        description: 'Find specific transactions or tokens',
        icon: '🔍',
        action: 'search_transactions'
      }
    ];

    // Add wallet-specific suggestions if address is provided
    if (walletAddress && isValidWallet(walletAddress)) {
      try {
        let resolvedAddress = walletAddress;
        
        if (walletAddress.endsWith('.eth')) {
          resolvedAddress = await resolveENS(walletAddress);
        }
        
        const insights = await nodit.getWalletInsights(resolvedAddress);
        
        if (insights.portfolio.totalValue > 0) {
          suggestions.unshift({
            id: 'portfolio_value',
            title: `$${insights.portfolio.totalValue.toFixed(2)} Portfolio`,
            description: `${insights.portfolio.assets.length} assets`,
            icon: '💎',
            action: 'show_portfolio',
            priority: 'high'
          });
        }
        
        if (insights.activity.totalTransactions > 0) {
          suggestions.unshift({
            id: 'activity_summary',
            title: `${insights.activity.totalTransactions} Transactions`,
            description: `Net flow: ${insights.activity.netFlowETH} ETH`,
            icon: '📊',
            action: 'show_activity',
            priority: 'high'
          });
        }
      } catch (error) {
        console.warn('Could not get wallet-specific suggestions:', error.message);
      }
    }

    res.json({
      success: true,
      data: {
        suggestions: suggestions.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        })
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

module.exports = router; 