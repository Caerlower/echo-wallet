require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const nodit = require('../services/nodit');
const { resolveENS } = require('../services/ens');
const perplexity = require('../services/perplexity');

// Import monitoring service
const monitoring = require('../webapp/backend/services/monitoring');

// Validate environment variables
const requiredEnvVars = ['TELEGRAM_TOKEN', 'NODIT_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
  polling: true,
  filepath: false
});

const isValidWallet = (input) =>
  /^(0x[a-fA-F0-9]{40}|[a-zA-Z0-9]+\.eth)$/.test(input);

const escapeMarkdown = (text) => {
  if (text === null || typeof text === 'undefined') {
    return '';
  }
  // Escape all reserved characters.
  return text.toString().replace(/([_*`\[\]()~>#+\-=|{}.!])/g, '\\$1');
};

const formatTransaction = (tx) => {
  const direction = tx.direction === 'IN' ? '📥' : '📤';
  const value = escapeMarkdown(parseFloat(tx.value).toFixed(6));
  const symbol = escapeMarkdown(tx.tokenSymbol);
  const link = `https://basescan.org/tx/${tx.hash}`;
  return `${direction} ${value} ${symbol} • ${escapeMarkdown(tx.timestamp)}\n[🔗 View on BaseScan](${link})`;
};

const generateWalletSummary = (address, ensName, portfolio) => {
  if (!portfolio || portfolio.totalValue === 0) {
    return `*Wallet Overview for* \`${escapeMarkdown(address)}\`\n\n📭 *No Assets Found*\nThis wallet currently holds no tokens with a detectable value on the Base chain.`;
  }

  const topAssets = portfolio.assets.slice(0, 5); // Display top 5 assets

  const addressLine = ensName ? `*${escapeMarkdown(ensName)}*\n\`${escapeMarkdown(address)}\`` : `\`${escapeMarkdown(address)}\``;

  const summary = [
    `*Wallet Overview for*\n${addressLine}\n`,
    `💰 *Total Value: $${portfolio.totalValue.toFixed(2)} USD*\n`,
    '--- *Top Assets* ---\n'
  ];

  for (const asset of topAssets) {
    const assetValue = asset.value.toFixed(2);
    const assetBalance = asset.balance > 0.0001 ? asset.balance.toFixed(4) : asset.balance.toExponential(2);
    const assetName = escapeMarkdown(asset.name);
    const assetSymbol = escapeMarkdown(asset.symbol);
    summary.push(`- *${assetName} (${assetSymbol})*`);
    summary.push(`  Value: *$${assetValue}* | Balance: ${assetBalance}`);
  }

  if (portfolio.assets.length > 5) {
    summary.push(`\n...and ${portfolio.assets.length - 5} other asset(s).`);
  }

  return summary.join('\n');
};

bot.onText(/\/start/, (msg) => {
  const welcomeMessage = `🛡️ *Welcome to EchoWallet!*

I'm your AI-powered wallet assistant for the Base blockchain.

*How to use:*
• Send any Base chain wallet address (0x...)
• Send any ENS name (e.g., vitalik.eth)
• I'll show you recent transactions and insights

*Features:*
✅ Last 10 transactions (native ETH + tokens)
✅ Portfolio with USD values
✅ ENS name resolution
✅ BaseScan links
✅ AI-powered insights

Ready to explore your wallet? Send me an address! 🚀`;

  bot.sendMessage(msg.chat.id, welcomeMessage, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
});

bot.onText(/\/help/, (msg) => {
  const helpMessage = `🔧 *EchoWallet Help*

*Commands:*
/start - Welcome message
/monitor - Start monitoring a wallet
/stop_monitor - Stop monitoring a wallet
/alerts - Manage wallet alerts
/test_notification - Test notification
/help - Show this help
/status - Check bot status

*Supported Input:*
• Ethereum addresses: \`0x1234...\`
• ENS names: \`vitalik.eth\`

*What I can do:*
• Show last 10 transactions (native ETH + tokens)
• Display portfolio with USD values
• Provide BaseScan links for each transaction
• Resolve ENS names to addresses
• AI-powered wallet analysis

*Need help?* Contact the developer or check the GitHub repo.`;

  bot.sendMessage(msg.chat.id, helpMessage, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
});

// Monitor wallet command
bot.onText(/\/monitor (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const walletAddress = match[1].trim();
  
  try {
    // Resolve ENS if needed
    let resolvedAddress = walletAddress;
    if (walletAddress.endsWith('.eth')) {
      const ensResult = await resolveENS(walletAddress);
      if (!ensResult.success) {
        return bot.sendMessage(chatId, `❌ Failed to resolve ENS name: ${walletAddress}`);
      }
      resolvedAddress = ensResult.address;
    }
    
    // Validate address
    if (!isValidWallet(resolvedAddress)) {
      return bot.sendMessage(chatId, '❌ Invalid wallet address format');
    }
    
    // Start monitoring
    monitoring.addWalletToMonitoring(resolvedAddress, chatId);
    
    const message = `✅ *Wallet Monitoring Started!*\n\nWallet: \`${resolvedAddress}\`\n\n🔔 You'll now receive notifications for:\n• New transactions\n• Custom alerts (when set)\n\nUse /alerts to set up custom notifications!`;
    
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
    
  } catch (error) {
    console.error('Error starting monitoring:', error);
    bot.sendMessage(chatId, '❌ Failed to start monitoring. Please try again.');
  }
});

// Stop monitoring command
bot.onText(/\/stop_monitor (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const walletAddress = match[1].trim();
  
  try {
    // Resolve ENS if needed
    let resolvedAddress = walletAddress;
    if (walletAddress.endsWith('.eth')) {
      const ensResult = await resolveENS(walletAddress);
      if (!ensResult.success) {
        return bot.sendMessage(chatId, `❌ Failed to resolve ENS name: ${walletAddress}`);
      }
      resolvedAddress = ensResult.address;
    }
    
    // Validate address
    if (!isValidWallet(resolvedAddress)) {
      return bot.sendMessage(chatId, '❌ Invalid wallet address format');
    }
    
    // Stop monitoring
    monitoring.removeWalletFromMonitoring(resolvedAddress);
    
    const message = `🛑 *Wallet Monitoring Stopped!*\n\nWallet: \`${resolvedAddress}\`\n\nYou'll no longer receive notifications for this wallet.`;
    
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
    
  } catch (error) {
    console.error('Error stopping monitoring:', error);
    bot.sendMessage(chatId, '❌ Failed to stop monitoring. Please try again.');
  }
});

// Alerts command
bot.onText(/\/alerts/, async (msg) => {
  const chatId = msg.chat.id;
  
  const monitoredWallets = monitoring.getAllMonitoredWallets().filter(w => w.chatId === chatId);
  const walletList = monitoredWallets.length > 0 
    ? monitoredWallets.map(w => `• \`${w.address}\` (${w.alerts.length} alerts)`).join('\n')
    : 'None';
    
  const message = `🔔 *Wallet Alerts Management*\n\n*Available Alert Types:*\n• \`incoming_funds\` - Notify when receiving funds\n• \`outgoing_funds\` - Notify when sending funds\n• \`nft_received\` - Notify when receiving NFTs\n• \`custom_amount\` - Notify for any transaction above amount\n\n*How to set alerts:*\n1. Start monitoring a wallet: \`/monitor 0x...\`\n2. Set alerts via the website interface\n3. Or use the API directly\n\n*Current monitored wallets:*\n${walletList}`;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
});

// Test notification command
bot.onText(/\/test_notification/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    await monitoring.sendTestNotification(chatId, '🧪 Test notification from EchoWallet bot! Your monitoring setup is working correctly.');
    bot.sendMessage(chatId, '✅ Test notification sent successfully!');
  } catch (error) {
    console.error('Error sending test notification:', error);
    bot.sendMessage(chatId, '❌ Failed to send test notification. Please check your bot configuration.');
  }
});

bot.onText(/\/status/, (msg) => {
  const statusMessage = `🟢 *EchoWallet Status*

✅ Bot is running
✅ Connected to Base chain
✅ Nodit API configured
✅ ENS resolution active

*Uptime:* ${Math.floor(process.uptime() / 60)} minutes`;

  bot.sendMessage(msg.chat.id, statusMessage, {
    parse_mode: 'Markdown'
  });
});

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const input = msg.text.trim();
  const isEns = input.endsWith('.eth');
  let resolvedAddress = input;
  let loadingMsg;

  try {
    // Check if this is a conversational query
    if (isConversationalQuery(input)) {
      return await handleConversationalQuery(chatId, input);
    }

    // Validate input format for direct address/ENS
    if (!isValidWallet(input)) {
      return bot.sendMessage(chatId,
        '⚠️ *Invalid Format!*\n\nPlease use a valid Ethereum address or ENS name:\n• Address: `0x1234...`\n• ENS: `name.eth`\n\nOr ask me questions like:\n• "Show me last 10 days txn history for 0x..."\n• "What\'s the activity for caerlower.eth?"\n• "Portfolio for vitalik.eth"\n\nTry again or use /help for more info.',
        { parse_mode: 'Markdown' }
      );
    }

    loadingMsg = await bot.sendMessage(chatId, '🔍 Analyzing wallet...', {
      parse_mode: 'Markdown'
    });

    // Set up the loading message updater
    nodit.setLoadingCallback(async (text) => {
      try {
        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: loadingMsg.message_id,
          parse_mode: 'Markdown'
        });
      } catch (e) {
        // Ignore errors from editing a message too fast, etc.
      }
    });

    // Resolve ENS if needed
    if (isEns) {
      await nodit._updateLoadingMessage(`Resolving \`${input}\`...`);
      try {
        resolvedAddress = await resolveENS(input);
      } catch (ensError) {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        return bot.sendMessage(chatId, `❌ *ENS Resolution Failed*\n\n${ensError.message}`, { parse_mode: 'Markdown' });
      }
    }

    // Fetch comprehensive insights
    const insights = await nodit.getWalletInsights(resolvedAddress);

    // Final cleanup of loading message
    await bot.deleteMessage(chatId, loadingMsg.message_id);

    // Generate response
    const response = generateInsightsResponse(resolvedAddress, isEns ? input : null, insights);

    // Prepare buttons for interactivity
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔄 Transaction History', callback_data: `history_${resolvedAddress}` },
          { text: '📊 Detailed Insights', callback_data: `insights_${resolvedAddress}` }
        ],
        [
          { text: '🔍 Search Transactions', callback_data: `search_${resolvedAddress}` },
          { text: '🖼 Show NFTs', callback_data: `nfts_${resolvedAddress}` }
        ]
      ]
    };

    if (perplexity.isConfigured()) {
       if (!keyboard.inline_keyboard[0].some(b => b.text.includes('AI Analysis'))) {
            keyboard.inline_keyboard.unshift([{ text: '🤖 Get AI Analysis', callback_data: `ai_analysis_${resolvedAddress}` }]);
        }
    }

    await bot.sendMessage(chatId, response, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
      disable_web_page_preview: true
    });

  } catch (error) {
    console.error('[Message Handler Error]', error);
    if (loadingMsg) {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
    }
    bot.sendMessage(chatId, '❌ *Oops!* Something went wrong. Please try again.', { parse_mode: 'Markdown' });
  }
});

// Listener for callback queries from inline keyboards
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = msg.chat.id;

    try {
        const parts = data.split('_');
        const address = parts.pop();
        const action = parts.join('_');

        if (!address || !/^(0x[a-fA-F0-9]{40})$/.test(address)) {
            return bot.answerCallbackQuery(callbackQuery.id, { text: 'Error: Invalid address provided.', show_alert: true });
        }

        // Acknowledge the button press
        await bot.answerCallbackQuery(callbackQuery.id);

        switch (action) {
            case 'history':
                await handleHistoryCallback(chatId, address);
                break;
            case 'insights':
                 await handleInsightsCallback(chatId, address);
                break;
            case 'search':
                 await bot.sendMessage(chatId, `To search this wallet's transactions, please send a message like:\n\`/search ${address} <your query>\``, {parse_mode: 'Markdown'});
                break;
            case 'nfts':
                await bot.sendMessage(chatId, '🖼 NFT portfolio view is coming soon!');
                break;
            case 'ai_analysis':
                await handlePerplexityAnalysis(chatId, address);
                break;
            default:
                await bot.sendMessage(chatId, 'Unknown action.');
        }
    } catch (error) {
        console.error('[Callback Query Error]', error);
        bot.sendMessage(chatId, '❌ Sorry, something went wrong while handling your request.');
    }
});

async function handleHistoryCallback(chatId, address) {
    const loadingMsg = await bot.sendMessage(chatId, '📜 Fetching full transaction history...');
    try {
        const insights = await nodit.getWalletInsights(address);
        await bot.deleteMessage(chatId, loadingMsg.message_id);

        if (insights.activity.recentActivity.length === 0) {
            return bot.sendMessage(chatId, 'No transactions found for this address.');
        }

        const historyLines = insights.activity.recentActivity.map(tx => formatTransaction(tx));
        
        const message = `*Full Transaction History for* \`${address}\`\n_(Last 10 transactions)_\n\n` + historyLines.join('\n\n');
        
        // Split message into chunks if it's too long for a single Telegram message
        if (message.length > 4096) {
            const chunks = [];
            let currentChunk = `*Full Transaction History for* \`${address}\`\n_(Last 10 transactions)_\n\n`;
            for (const line of historyLines) {
                if ((currentChunk + line + '\n\n').length > 4096) {
                    chunks.push(currentChunk);
                    currentChunk = "";
                }
                currentChunk += line + '\n\n';
            }
            chunks.push(currentChunk);
            for (const chunk of chunks) {
                await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown', disable_web_page_preview: true });
            }
        } else {
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', disable_web_page_preview: true });
        }

    } catch (error) {
        console.error(`[History Callback Error] ${error.message}`);
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        bot.sendMessage(chatId, `❌ Could not fetch transaction history: ${error.message}`);
    }
}

async function handleInsightsCallback(chatId, address) {
    const loadingMsg = await bot.sendMessage(chatId, '📊 Re-fetching wallet insights...');
    try {
        const insights = await nodit.getWalletInsights(address);
        const response = generateInsightsResponse(address, null, insights);
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await bot.sendMessage(chatId, response, { parse_mode: 'Markdown', disable_web_page_preview: true });

    } catch (error) {
        console.error(`[Insights Callback Error] ${error.message}`);
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        bot.sendMessage(chatId, `❌ Could not fetch insights: ${error.message}`);
    }
}

async function handlePerplexityAnalysis(chatId, address) {
     if (!perplexity.isConfigured()) {
        return bot.sendMessage(chatId, "The Perplexity AI service is not configured. Please set the `PERPLEXITY_API_KEY`.");
    }

    const loadingMsg = await bot.sendMessage(chatId, '🤖 Gathering data for AI analysis...');
    
    try {
        const insights = await nodit.getWalletInsights(address);
        const portfolio = insights.portfolio;
        const activity = insights.activity.recentActivity;

        if (activity.length === 0) {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            return bot.sendMessage(chatId, "Not enough transaction data for a meaningful analysis.");
        }

        await bot.editMessageText('🧠 Analyzing wallet activity with Perplexity AI...', { chat_id: chatId, message_id: loadingMsg.message_id });
        
        const analysis = await perplexity.queryWallet(address, activity, portfolio);

        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await bot.sendMessage(chatId, `*🤖 Perplexity AI Analysis*\n\n${escapeMarkdown(analysis)}`, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error(`[Perplexity Callback Error] ${error.message}`);
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        bot.sendMessage(chatId, `❌ AI Analysis failed: ${error.message}`);
    }
}

// Error handling
bot.on('polling_error', (error) => {
  console.error('[POLLING ERROR]', error);
});

bot.on('webhook_error', (error) => {
  console.error('[WEBHOOK ERROR]', error);
});

console.log('✅ EchoWallet bot started successfully');
console.log('🤖 Bot username:', bot.options.username);
console.log('🔗 Base chain: Connected via Nodit');
console.log('📡 ENS resolution: Active');
console.log('🚀 Ready to process wallet queries!');

// Helper functions for conversational interface
const isConversationalQuery = (input) => {
  const lowerInput = input.toLowerCase();
  const conversationalKeywords = [
    'show me', 'what', 'how', 'when', 'where', 'why', 'tell me', 'get', 'find',
    'transaction', 'txn', 'history', 'activity', 'portfolio', 'balance', 'insights',
    'last', 'recent', 'days', 'weeks', 'months', 'today', 'yesterday'
  ];
  
  return conversationalKeywords.some(keyword => lowerInput.includes(keyword));
};

const extractAddressFromQuery = (input) => {
  // Look for Ethereum addresses
  const addressMatch = input.match(/0x[a-fA-F0-9]{40}/);
  if (addressMatch) return addressMatch[0];
  
  // Look for ENS names
  const ensMatch = input.match(/[a-zA-Z0-9]+\.eth/);
  if (ensMatch) return ensMatch[0];
  
  return null;
};

const isTransactionQuery = (input) => {
  const lowerInput = input.toLowerCase();
  return lowerInput.includes('transaction') || lowerInput.includes('txn') || 
         lowerInput.includes('history') || lowerInput.includes('activity');
};

const isPortfolioQuery = (input) => {
  const lowerInput = input.toLowerCase();
  return lowerInput.includes('portfolio') || lowerInput.includes('balance') || 
         lowerInput.includes('holdings') || lowerInput.includes('assets');
};

const isInsightsQuery = (input) => {
  const lowerInput = input.toLowerCase();
  return lowerInput.includes('insights') || lowerInput.includes('analysis') || 
         lowerInput.includes('summary') || lowerInput.includes('overview');
};

const generateInsightsResponse = (address, ensName, insights) => {
  const addressLine = ensName ? `*${escapeMarkdown(ensName)}*\n\`${escapeMarkdown(address)}\`` : `\`${escapeMarkdown(address)}\``;
  
  const summary = [
    `*Wallet Insights for*\n${addressLine}\n`,
    `💰 *Portfolio Value: $${insights.portfolio.totalValue.toFixed(2)} USD*\n`,
    `📊 *Activity Summary (Last 10 Transactions)*\n`,
    `• Total Transactions: ${insights.activity.totalTransactions}`,
    `• Native ETH: ${insights.activity.nativeTransactions}`,
    `• Token Transfers: ${insights.activity.tokenTransfers}`,
    `• Net Flow: ${insights.activity.netFlowETH} ETH`,
    `• Unique Tokens: ${insights.activity.uniqueTokens}\n`
  ];

  if (insights.portfolio.assets.length > 0) {
    summary.push('*Top Assets:*');
    insights.portfolio.assets.slice(0, 3).forEach(asset => {
      const balance = asset.balance > 0.0001 ? asset.balance.toFixed(4) : asset.balance.toExponential(2);
      summary.push(`• ${escapeMarkdown(asset.symbol)}: ${balance} ($${asset.value.toFixed(2)})`);
    });
  }

  if (insights.activity.recentActivity.length > 0) {
    summary.push('\n*Recent Activity (Top 3):*');
    insights.activity.recentActivity.slice(0, 3).forEach(tx => {
      const direction = tx.direction === 'IN' ? '📥' : '📤';
      summary.push(`• ${direction} ${escapeMarkdown(tx.value)} ${escapeMarkdown(tx.tokenSymbol)} • ${escapeMarkdown(tx.timestamp)}`);
    });
  }

  return summary.join('\n');
};

const formatTransactionSearchResult = (address, searchResult) => {
  if (searchResult.message) {
    return searchResult.message;
  }

  const response = [
    `*Transaction Search Results for* \`${escapeMarkdown(address)}\`\n`,
    `🔍 Query: "${escapeMarkdown(searchResult.query)}"\n`,
    `📊 Found ${searchResult.transactions.length} matching transaction(s):\n`
  ];

  if (searchResult.transactions.length > 0) {
    searchResult.transactions.forEach(tx => {
      const direction = tx.direction === 'IN' ? '📥' : '📤';
      response.push(`• ${direction} ${escapeMarkdown(tx.value)} ${escapeMarkdown(tx.tokenSymbol)} • ${escapeMarkdown(tx.timestamp)}`);
    });
  } else {
    response.push('No matching transactions found.');
  }

  return response.join('\n');
};

bot.onText(/\/search (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const args = match[1].split(' ');
    const address = args.shift();
    const query = args.join(' ');

    if (!address || !/^(0x[a-fA-F0-9]{40})$/.test(address)) {
        return bot.sendMessage(chatId, '❌ *Invalid Format*\nPlease use `/search <address> <query>`', { parse_mode: 'Markdown' });
    }
    
    if (!query) {
        return bot.sendMessage(chatId, 'Please provide a search query after the address. e.g. `/search <address> sent ETH`', { parse_mode: 'Markdown' });
    }
    
    const loadingMsg = await bot.sendMessage(chatId, `🔍 Searching transactions for \`${address}\`...`);
    
    try {
        const searchResult = await nodit.searchTransactions(address, query);
        await bot.deleteMessage(chatId, loadingMsg.message_id);

        const response = formatTransactionSearchResult(address, searchResult);
        
        await bot.sendMessage(chatId, response, { parse_mode: 'Markdown', disable_web_page_preview: true });

    } catch (error) {
        console.error(`[Search Command Error] ${error.message}`);
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        bot.sendMessage(chatId, '❌ An error occurred during the search.');
    }
});

// Conversational query handlers
const handleConversationalQuery = async (chatId, input) => {
  let loadingMsg;
  
  try {
    loadingMsg = await bot.sendMessage(chatId, '🤔 Understanding your request...', {
      parse_mode: 'Markdown'
    });

    // Extract address from query
    const address = extractAddressFromQuery(input);
    if (!address) {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      return bot.sendMessage(chatId, 
        '❌ *Address Not Found*\n\nI couldn\'t find a wallet address in your query. Please include an address like:\n• "Show me last 10 days txn history for 0x1234..."\n• "What\'s the activity for caerlower.eth?"',
        { parse_mode: 'Markdown' }
      );
    }

    // Resolve ENS if needed
    let resolvedAddress = address;
    if (address.endsWith('.eth')) {
      try {
        resolvedAddress = await resolveENS(address);
      } catch (ensError) {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        return bot.sendMessage(chatId, `❌ *ENS Resolution Failed*\n\n${ensError.message}`, { parse_mode: 'Markdown' });
      }
    }

    // Determine query type and handle accordingly
    if (isTransactionQuery(input)) {
      await handleTransactionQuery(chatId, loadingMsg, resolvedAddress, input);
    } else if (isPortfolioQuery(input)) {
      await handlePortfolioQuery(chatId, loadingMsg, resolvedAddress, address);
    } else if (isInsightsQuery(input)) {
      await handleInsightsQuery(chatId, loadingMsg, resolvedAddress, address);
    } else {
      // Default to comprehensive insights
      await handleInsightsQuery(chatId, loadingMsg, resolvedAddress, address);
    }

  } catch (error) {
    console.error('[Conversational Query Error]', error);
    if (loadingMsg) await bot.deleteMessage(chatId, loadingMsg.message_id);
    bot.sendMessage(chatId, '❌ *Query Processing Error*\n\nI couldn\'t understand your request. Please try rephrasing it.', {
      parse_mode: 'Markdown'
    });
  }
};

const handleTransactionQuery = async (chatId, loadingMsg, resolvedAddress, query) => {
  await bot.editMessageText('🔍 Searching transactions...', {
    chat_id: chatId,
    message_id: loadingMsg.message_id,
    parse_mode: 'Markdown'
  });

  const searchResult = await nodit.searchTransactions(resolvedAddress, query);
  
  await bot.deleteMessage(chatId, loadingMsg.message_id);

  const response = formatTransactionSearchResult(resolvedAddress, searchResult);
  
  bot.sendMessage(chatId, response, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
};

const handlePortfolioQuery = async (chatId, loadingMsg, resolvedAddress, originalAddress) => {
  await bot.editMessageText('💰 Fetching portfolio...', {
    chat_id: chatId,
    message_id: loadingMsg.message_id,
    parse_mode: 'Markdown'
  });

  const portfolio = await nodit.getPortfolio(resolvedAddress);
  
  await bot.deleteMessage(chatId, loadingMsg.message_id);

  const response = generateWalletSummary(resolvedAddress, originalAddress.endsWith('.eth') ? originalAddress : null, portfolio);
  
  bot.sendMessage(chatId, response, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
};

const handleInsightsQuery = async (chatId, loadingMsg, resolvedAddress, originalAddress) => {
  await bot.editMessageText('📊 Getting comprehensive insights...', {
    chat_id: chatId,
    message_id: loadingMsg.message_id,
    parse_mode: 'Markdown'
  });

  const insights = await nodit.getWalletInsights(resolvedAddress);
  
  await bot.deleteMessage(chatId, loadingMsg.message_id);

  const response = generateInsightsResponse(resolvedAddress, originalAddress.endsWith('.eth') ? originalAddress : null, insights);
  
  bot.sendMessage(chatId, response, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
};
