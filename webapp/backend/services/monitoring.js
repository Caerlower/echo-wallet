const nodit = require('./nodit');
const TelegramBot = require('node-telegram-bot-api');

class WalletMonitoringService {
  constructor() {
    this.bot = null;
    this.monitoredWallets = new Map(); // walletAddress -> { alerts: [], lastCheck: Date, chatId }
    this.checkInterval = null;
    this.isRunning = false;
    
    // Initialize Telegram bot if token is available
    if (process.env.TELEGRAM_TOKEN) {
      this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
        polling: false // We don't need polling for sending messages
      });
      console.log('✅ Telegram bot initialized for notifications');
    } else {
      console.log('⚠️ TELEGRAM_TOKEN not found - notifications disabled');
    }
  }

  // Add a wallet to monitoring
  addWalletToMonitoring(walletAddress, chatId, alerts = []) {
    const normalizedAddress = walletAddress.toLowerCase();
    
    if (!this.monitoredWallets.has(normalizedAddress)) {
      // Set lastCheck to 30 minutes ago to catch recent transactions
      const thirtyMinutesAgo = new Date(new Date().getTime() - 30 * 60 * 1000);
      this.monitoredWallets.set(normalizedAddress, {
        chatId,
        alerts: alerts,
        lastCheck: thirtyMinutesAgo, // Set to 30 minutes ago to catch recent transactions
        lastTransactions: new Set(), // Track transaction hashes to avoid duplicates
        lastBalance: null,
        initialized: false // Flag to prevent showing old transactions on first run
      });
      console.log(`📊 Added wallet ${normalizedAddress} to monitoring (lastCheck: ${thirtyMinutesAgo.toISOString()})`);
    } else {
      // Update existing wallet
      const existing = this.monitoredWallets.get(normalizedAddress);
      existing.chatId = chatId;
      existing.alerts = alerts;
      // COMPLETELY CLEAR transaction history to allow re-processing recent transactions
      existing.lastTransactions = new Set(); // Create a completely new Set
      existing.initialized = false;
      // Reset lastCheck to 30 minutes ago to catch recent transactions
      const thirtyMinutesAgo = new Date(new Date().getTime() - 30 * 60 * 1000);
      existing.lastCheck = thirtyMinutesAgo;
      console.log(`📊 Updated monitoring for wallet ${normalizedAddress} - COMPLETELY CLEARED transaction history (lastCheck: ${thirtyMinutesAgo.toISOString()})`);
    }

    // Start monitoring if not already running
    if (!this.isRunning) {
      this.startMonitoring();
    }
  }

  // Remove wallet from monitoring
  removeWalletFromMonitoring(walletAddress) {
    const normalizedAddress = walletAddress.toLowerCase();
    if (this.monitoredWallets.delete(normalizedAddress)) {
      console.log(`📊 Removed wallet ${normalizedAddress} from monitoring`);
    }
  }

  // Add custom alert for a wallet
  addAlert(walletAddress, alert) {
    const normalizedAddress = walletAddress.toLowerCase();
    const wallet = this.monitoredWallets.get(normalizedAddress);
    
    if (wallet) {
      wallet.alerts.push({
        id: Date.now().toString(),
        type: alert.type, // 'incoming_funds', 'outgoing_funds', 'nft_received', 'custom_amount'
        token: alert.token, // 'ETH', 'USDC', etc.
        amount: alert.amount, // minimum amount to trigger
        enabled: true,
        createdAt: new Date()
      });
      console.log(`🔔 Added alert for wallet ${normalizedAddress}: ${alert.type} ${alert.amount} ${alert.token}`);
      
      // Trigger immediate check to catch any recent transactions that might match this alert
      setTimeout(async () => {
        console.log(`🔍 Triggering catch-up check for new alert: ${alert.type} ${alert.amount} ${alert.token}`);
        await this.checkWallet(normalizedAddress, wallet);
      }, 1000);
    }
  }

  // Remove alert
  removeAlert(walletAddress, alertId) {
    const normalizedAddress = walletAddress.toLowerCase();
    const wallet = this.monitoredWallets.get(normalizedAddress);
    
    if (wallet) {
      wallet.alerts = wallet.alerts.filter(alert => alert.id !== alertId);
      console.log(`🔔 Removed alert ${alertId} from wallet ${normalizedAddress}`);
    }
  }

  // Start monitoring loop
  startMonitoring() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Starting wallet monitoring service...');
    
    // Check every 15 seconds for better responsiveness - configurable via env
    const checkInterval = parseInt(process.env.MONITORING_INTERVAL) || 5000;
    this.checkInterval = setInterval(async () => {
      await this.checkAllWallets();
    }, checkInterval);
    console.log(`⏰ Monitoring interval set to ${checkInterval / 1000} seconds`);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Stopped wallet monitoring service');
  }

  // Check all monitored wallets
  async checkAllWallets() {
    if (this.monitoredWallets.size === 0) return;

    console.log(`🔍 Checking ${this.monitoredWallets.size} monitored wallets...`);
    
    for (const [address, wallet] of this.monitoredWallets) {
      try {
        await this.checkWallet(address, wallet);
      } catch (error) {
        console.error(`❌ Error checking wallet ${address}:`, error.message);
      }
    }
  }

  // Check individual wallet
  async checkWallet(address, wallet) {
    try {
      // Calculate time since last check (in seconds)
      const now = new Date();
      const timeSinceLastCheck = wallet.lastCheck 
        ? Math.floor((now - wallet.lastCheck) / 1000) 
        : 300; // Default to 5 minutes if no last check
      
      // Only check if enough time has passed (minimum 5 seconds for faster responsiveness)
      if (timeSinceLastCheck < 5) {
        return;
      }

      // On first run, initialize baseline and check recent transactions (last 5 minutes)
      if (!wallet.initialized) {
        console.log(`📊 Initializing monitoring baseline for ${address}`);
        wallet.initialized = true;
        
        // COMPLETELY CLEAR transaction history on first run
        wallet.lastTransactions = new Set();
        console.log(`🧹 COMPLETELY CLEARED lastTransactions Set for ${address}`);
        
        // Set baseline to 30 minutes ago to catch recent transactions
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        wallet.lastCheck = thirtyMinutesAgo;
        
        console.log(`🔍 Checking for transactions since ${thirtyMinutesAgo.toISOString()}`);
        // Don't return here - let it process recent transactions
      }

      // Get transactions since last check (more efficient approach)
      let newTransactions = [];
      
      try {
        // Clear API cache to ensure we get fresh data for monitoring
        nodit.clearCache();
        
        // Get native transactions since last check
        const nativeTxs = await nodit.getNativeTransactions(address, 20);
        console.log(`🔍 Found ${nativeTxs.length} native transactions`);
        
        // Debug: Log all native transactions with timestamps
        nativeTxs.forEach((tx, index) => {
          const txTime = new Date(tx.timestamp);
          const timeDiff = Math.abs(now - txTime) / 1000;
          console.log(`🔍 Native tx ${index + 1}: ${tx.direction} ${tx.value} ${tx.tokenSymbol} - ${txTime.toISOString()} (${Math.floor(timeDiff)}s old)`);
        });
        
        const newNativeTxs = nativeTxs.filter(tx => {
          const txTime = new Date(tx.timestamp);
          const timeDiff = Math.abs(now - txTime) / 1000; // seconds
          
          // Only consider transactions that happened within the last 30 minutes
          const isRecent = timeDiff <= 1800; // 30 minutes
          const isNew = txTime > wallet.lastCheck && !wallet.lastTransactions.has(tx.hash);
          
          if (!isRecent) {
            console.log(`❌ Filtered out old native tx: ${tx.hash} (${Math.floor(timeDiff)}s old)`);
          } else if (!isNew) {
            console.log(`❌ Filtered out seen native tx: ${tx.hash} (already processed)`);
          }
          
          return isRecent && isNew;
        });
        console.log(`✅ Found ${newNativeTxs.length} new recent native transactions`);
        newTransactions.push(...newNativeTxs);

        // Get token transfers since last check
        const tokenTxs = await nodit.getTokenTransfers(address, 20);
        console.log(`🔍 Found ${tokenTxs.length} token transactions`);
        
        // Debug: Log all token transactions with timestamps
        tokenTxs.forEach((tx, index) => {
          const txTime = new Date(tx.timestamp);
          const timeDiff = Math.abs(now - txTime) / 1000;
          console.log(`🔍 Token tx ${index + 1}: ${tx.direction} ${tx.value} ${tx.tokenSymbol} - ${txTime.toISOString()} (${Math.floor(timeDiff)}s old)`);
        });
        
        const newTokenTxs = tokenTxs.filter(tx => {
          const txTime = new Date(tx.timestamp);
          const timeDiff = Math.abs(now - txTime) / 1000; // seconds
          
          // Only consider transactions that happened within the last 30 minutes
          const isRecent = timeDiff <= 1800; // 30 minutes
          const isNew = txTime > wallet.lastCheck && !wallet.lastTransactions.has(tx.hash);
          
          if (!isRecent) {
            console.log(`❌ Filtered out old token tx: ${tx.hash} (${Math.floor(timeDiff)}s old)`);
          } else if (!isNew) {
            console.log(`❌ Filtered out seen token tx: ${tx.hash} (already processed)`);
          }
          
          return isRecent && isNew;
        });
        console.log(`✅ Found ${newTokenTxs.length} new recent token transactions`);
        newTransactions.push(...newTokenTxs);

        // Sort by timestamp (newest first)
        newTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Limit to most recent 10 new transactions
        newTransactions = newTransactions.slice(0, 10);

      } catch (error) {
        console.error(`❌ Error fetching transactions for ${address}:`, error.message);
        // Fallback to insights method if direct methods fail
        const insights = await nodit.getWalletInsights(address, 1);
        const recentTransactions = insights.activity.recentActivity.slice(0, 10);
        newTransactions = recentTransactions.filter(tx => 
          !wallet.lastTransactions.has(tx.hash) && 
          new Date(tx.timestamp) > wallet.lastCheck
        );
      }

      if (newTransactions.length > 0) {
        console.log(`📈 Found ${newTransactions.length} new transactions for ${address}`);
        
        // Debug: Log transaction details
        newTransactions.forEach(tx => {
          console.log(`🔍 Transaction: ${tx.direction} ${tx.value} ${tx.tokenSymbol} (${tx.type}) - ${tx.hash}`);
        });
        
        // Add new transaction hashes to tracking set
        newTransactions.forEach(tx => wallet.lastTransactions.add(tx.hash));
        
        // Keep only last 100 transaction hashes to prevent memory bloat
        if (wallet.lastTransactions.size > 100) {
          const hashes = Array.from(wallet.lastTransactions);
          wallet.lastTransactions = new Set(hashes.slice(-50));
        }

        // Check alerts for each new transaction
        for (const tx of newTransactions) {
          await this.checkAlerts(address, wallet, tx);
        }

        // Send transaction summary
        await this.sendTransactionNotification(address, wallet, newTransactions);
        
        // Update last check time to current time for continuous monitoring
        wallet.lastCheck = now;
        console.log(`⏰ Updated lastCheck to ${now.toISOString()}`);
      } else {
        console.log(`📊 No new transactions found for ${address}`);
        // Update last check time to current time for continuous monitoring
        wallet.lastCheck = now;
        console.log(`⏰ Updated lastCheck to ${now.toISOString()}`);
      }
      
    } catch (error) {
      console.error(`❌ Error checking wallet ${address}:`, error.message);
    }
  }

  // Check if transaction triggers any alerts
  async checkAlerts(address, wallet, transaction) {
    console.log(`🔔 Checking alerts for transaction: ${transaction.direction} ${transaction.value} ${transaction.tokenSymbol}`);
    
    for (const alert of wallet.alerts) {
      if (!alert.enabled) continue;

      console.log(`🔍 Checking alert: ${alert.type} ${alert.token} >= ${alert.amount}`);

      let shouldTrigger = false;
      let alertMessage = '';

      switch (alert.type) {
        case 'incoming_funds':
          if (transaction.direction === 'IN' && 
              transaction.tokenSymbol === alert.token &&
              parseFloat(transaction.value) >= parseFloat(alert.amount)) {
            shouldTrigger = true;
            alertMessage = `💰 **Incoming Funds Alert!**\n\nReceived **${transaction.value} ${transaction.tokenSymbol}**\n\n*Transaction Details:*\n- Amount: ${transaction.value} ${transaction.tokenSymbol}\n- From: \`${transaction.from}\`\n- Hash: \`${transaction.hash}\`\n\n[🔗 View on BaseScan](https://basescan.org/tx/${transaction.hash})`;
            console.log(`✅ Alert triggered: ${transaction.value} ${transaction.tokenSymbol} >= ${alert.amount}`);
          } else {
            console.log(`❌ Alert not triggered: direction=${transaction.direction}, token=${transaction.tokenSymbol}, value=${transaction.value}, alert=${alert.token}>=${alert.amount}`);
          }
          break;

        case 'outgoing_funds':
          if (transaction.direction === 'OUT' && 
              transaction.tokenSymbol === alert.token &&
              parseFloat(transaction.value) >= parseFloat(alert.amount)) {
            shouldTrigger = true;
            alertMessage = `📤 **Outgoing Funds Alert!**\n\nSent **${transaction.value} ${transaction.tokenSymbol}**\n\n*Transaction Details:*\n- Amount: ${transaction.value} ${transaction.tokenSymbol}\n- To: \`${transaction.to}\`\n- Hash: \`${transaction.hash}\`\n\n[🔗 View on BaseScan](https://basescan.org/tx/${transaction.hash})`;
          }
          break;

        case 'nft_received':
          if (transaction.direction === 'IN' && 
              transaction.type === 'nft') {
            shouldTrigger = true;
            alertMessage = `🎨 **NFT Received Alert!**\n\nReceived NFT: **${transaction.tokenName}**\n\n*Transaction Details:*\n- NFT: ${transaction.tokenName}\n- From: \`${transaction.from}\`\n- Hash: \`${transaction.hash}\`\n\n[🔗 View on BaseScan](https://basescan.org/tx/${transaction.hash})`;
          }
          break;

        case 'custom_amount':
          if (transaction.tokenSymbol === alert.token &&
              parseFloat(transaction.value) >= parseFloat(alert.amount)) {
            shouldTrigger = true;
            const direction = transaction.direction === 'IN' ? 'Received' : 'Sent';
            alertMessage = `🔔 **Custom Amount Alert!**\n\n${direction} **${transaction.value} ${transaction.tokenSymbol}**\n\n*Transaction Details:*\n- Amount: ${transaction.value} ${transaction.tokenSymbol}\n- Direction: ${direction}\n- Hash: \`${transaction.hash}\`\n\n[🔗 View on BaseScan](https://basescan.org/tx/${transaction.hash})`;
          }
          break;
      }

      if (shouldTrigger && this.bot) {
        try {
          await this.bot.sendMessage(wallet.chatId, alertMessage, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          });
          console.log(`🔔 Sent alert for wallet ${address}: ${alert.type}`);
        } catch (error) {
          console.error(`❌ Failed to send Telegram alert:`, error.message);
        }
      }
    }
  }

  // Send transaction notification
  async sendTransactionNotification(address, wallet, transactions) {
    if (!this.bot || transactions.length === 0) return;

    const summary = transactions.map(tx => {
      const direction = tx.direction === 'IN' ? '📥' : '📤';
      const value = parseFloat(tx.value).toFixed(6);
      return `${direction} **${value} ${tx.tokenSymbol}** (${tx.type === 'native' ? 'ETH' : 'Token'})`;
    }).join('\n');

    const message = `📊 **New Transactions Detected!**\n\nWallet: \`${address}\`\n\n${summary}\n\n[🔗 View on BaseScan](https://basescan.org/address/${address})`;

    try {
      await this.bot.sendMessage(wallet.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } catch (error) {
      console.error(`❌ Failed to send transaction notification:`, error.message);
    }
  }

  // Get monitoring status for a wallet
  getWalletStatus(walletAddress) {
    const normalizedAddress = walletAddress.toLowerCase();
    const wallet = this.monitoredWallets.get(normalizedAddress);
    
    if (!wallet) return null;

    return {
      address: normalizedAddress,
      chatId: wallet.chatId,
      alerts: wallet.alerts,
      lastCheck: wallet.lastCheck,
      isMonitored: true
    };
  }

  // Get all monitored wallets
  getAllMonitoredWallets() {
    const wallets = [];
    for (const [address, wallet] of this.monitoredWallets) {
      wallets.push({
        address,
        chatId: wallet.chatId,
        alerts: wallet.alerts,
        lastCheck: wallet.lastCheck
      });
    }
    return wallets;
  }

  // Test notification
  async sendTestNotification(chatId, message = '🧪 Test notification from EchoWallet monitoring service!') {
    if (!this.bot) {
      throw new Error('Telegram bot not initialized');
    }

    try {
      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      return true;
    } catch (error) {
      console.error('❌ Failed to send test notification:', error.message);
      throw error;
    }
  }

  // Manual trigger for immediate checking
  async triggerImmediateCheck(walletAddress) {
    const normalizedAddress = walletAddress.toLowerCase();
    const wallet = this.monitoredWallets.get(normalizedAddress);
    
    if (!wallet) {
      throw new Error('Wallet not being monitored');
    }

    console.log(`🚀 Triggering immediate check for ${normalizedAddress}`);
    
    // For manual checks, look back 30 minutes to catch recent transactions
    const thirtyMinutesAgo = new Date(new Date().getTime() - 30 * 60 * 1000);
    const originalLastCheck = wallet.lastCheck;
    wallet.lastCheck = thirtyMinutesAgo;
    
    console.log(`🔍 Manual check: Looking for transactions since ${thirtyMinutesAgo.toISOString()}`);
    
    try {
      await this.checkWallet(normalizedAddress, wallet);
    } finally {
      // Don't restore original lastCheck - let the system update it properly
      // This ensures we don't keep detecting the same old transactions
    }
  }
}

module.exports = new WalletMonitoringService(); 