const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

class WebhookMonitoringService {
  constructor() {
    this.monitoredWallets = new Map(); // walletAddress -> { chatId, alerts, webhookId }
    this.bot = null;
    this.webhookEndpoint = null;
    this.isInitialized = false;
    
    // Initialize Telegram bot
    if (process.env.TELEGRAM_TOKEN) {
      this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });
      console.log('✅ Telegram bot initialized for webhook notifications');
    } else {
      console.log('❌ TELEGRAM_TOKEN not set - notifications will not work');
    }
  }

  // Initialize webhook endpoint
  async initializeWebhook() {
    if (this.isInitialized) return;
    
    // For development, we'll use ngrok or similar to expose local endpoint
    // In production, this would be your server's public URL
    this.webhookEndpoint = process.env.WEBHOOK_ENDPOINT || 'http://localhost:3001/api/webhook/nodit';
    
    console.log(`🔗 Webhook endpoint: ${this.webhookEndpoint}`);
    this.isInitialized = true;
  }

  // Add wallet to webhook monitoring
  async addWalletToMonitoring(walletAddress, chatId, alerts = []) {
    await this.initializeWebhook();
    
    const normalizedAddress = walletAddress.toLowerCase();
    
    try {
      // Create webhook for this wallet using Nodit API
      const webhookData = {
        network: 'ethereum', // or get from config
        eventType: 'transaction',
        endpoint: this.webhookEndpoint,
        conditions: {
          address: normalizedAddress,
          // Add more conditions as needed
        },
        isInstant: true // Get instant notifications
      };

      const response = await axios.post(
        'https://api.nodit.io/webhooks',
        webhookData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.NODIT_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const webhookId = response.data.id;
      
      this.monitoredWallets.set(normalizedAddress, {
        chatId,
        alerts: alerts,
        webhookId: webhookId
      });

      console.log(`📊 Added wallet ${normalizedAddress} to webhook monitoring (webhookId: ${webhookId})`);
      
      return { success: true, webhookId };

    } catch (error) {
      console.error('Error creating webhook:', error.response?.data || error.message);
      throw new Error('Failed to create webhook for wallet monitoring');
    }
  }

  // Remove wallet from webhook monitoring
  async removeWalletFromMonitoring(walletAddress) {
    const normalizedAddress = walletAddress.toLowerCase();
    const wallet = this.monitoredWallets.get(normalizedAddress);
    
    if (wallet && wallet.webhookId) {
      try {
        // Delete webhook from Nodit
        await axios.delete(
          `https://api.nodit.io/webhooks/${wallet.webhookId}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.NODIT_API_KEY}`
            }
          }
        );

        this.monitoredWallets.delete(normalizedAddress);
        console.log(`📊 Removed wallet ${normalizedAddress} from webhook monitoring`);
        
        return { success: true };
      } catch (error) {
        console.error('Error deleting webhook:', error.response?.data || error.message);
        throw new Error('Failed to delete webhook');
      }
    }
  }

  // Handle incoming webhook from Nodit
  async handleWebhook(webhookData) {
    console.log('🔔 Received webhook from Nodit:', JSON.stringify(webhookData, null, 2));
    
    try {
      const { transaction, eventType } = webhookData;
      
      if (eventType === 'transaction' && transaction) {
        const { from, to, value, tokenSymbol, hash } = transaction;
        
        // Find which monitored wallet this transaction affects
        const affectedWallets = [];
        
        for (const [address, wallet] of this.monitoredWallets.entries()) {
          if (address === from?.toLowerCase() || address === to?.toLowerCase()) {
            affectedWallets.push({ address, wallet });
          }
        }
        
        // Process each affected wallet
        for (const { address, wallet } of affectedWallets) {
          await this.processTransaction(address, wallet, transaction);
        }
      }
      
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  // Process transaction and check alerts
  async processTransaction(address, wallet, transaction) {
    const { from, to, value, tokenSymbol, hash, direction } = transaction;
    
    console.log(`🔍 Processing transaction for ${address}: ${direction} ${value} ${tokenSymbol}`);
    
    // Check if transaction matches any alerts
    for (const alert of wallet.alerts) {
      if (await this.checkAlert(alert, transaction)) {
        await this.sendAlertNotification(address, wallet, alert, transaction);
      }
    }
  }

  // Check if transaction matches alert criteria
  async checkAlert(alert, transaction) {
    const { type, token, amount } = alert;
    const { direction, value, tokenSymbol } = transaction;
    
    // Check token match
    if (token && tokenSymbol && token.toUpperCase() !== tokenSymbol.toUpperCase()) {
      return false;
    }
    
    // Check amount threshold
    if (amount && parseFloat(value) < parseFloat(amount)) {
      return false;
    }
    
    // Check transaction type
    switch (type) {
      case 'incoming_funds':
        return direction === 'IN';
      case 'outgoing_funds':
        return direction === 'OUT';
      default:
        return true;
    }
  }

  // Send alert notification via Telegram
  async sendAlertNotification(address, wallet, alert, transaction) {
    if (!this.bot) {
      console.log('❌ Telegram bot not initialized - cannot send notification');
      return;
    }
    
    const { direction, value, tokenSymbol, hash } = transaction;
    const { type, amount } = alert;
    
    const message = `🚨 Alert Triggered!

💰 Transaction Detected
• Type: ${type}
• Direction: ${direction}
• Amount: ${value} ${tokenSymbol}
• Threshold: ${amount} ${tokenSymbol}
• Wallet: ${address}
• Hash: ${hash}

⏰ Time: ${new Date().toISOString()}`;

    try {
      await this.bot.sendMessage(wallet.chatId, message);
      console.log(`✅ Alert notification sent to ${wallet.chatId}`);
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
    }
  }

  // Get monitoring status
  getWalletStatus(walletAddress) {
    const normalizedAddress = walletAddress.toLowerCase();
    const wallet = this.monitoredWallets.get(normalizedAddress);
    
    if (wallet) {
      return {
        address: walletAddress,
        chatId: wallet.chatId,
        alerts: wallet.alerts,
        isMonitored: true,
        webhookId: wallet.webhookId
      };
    }
    
    return {
      address: walletAddress,
      isMonitored: false
    };
  }

  // Get all monitored wallets
  getAllMonitoredWallets() {
    const wallets = [];
    for (const [address, wallet] of this.monitoredWallets.entries()) {
      wallets.push({
        address,
        chatId: wallet.chatId,
        alerts: wallet.alerts,
        webhookId: wallet.webhookId
      });
    }
    return wallets;
  }

  // Send test notification
  async sendTestNotification(chatId, message = '🧪 Test notification from EchoWallet webhook monitoring!') {
    if (!this.bot) {
      throw new Error('Telegram bot not initialized');
    }
    
    await this.bot.sendMessage(chatId, message);
    console.log(`✅ Test notification sent to ${chatId}`);
  }
}

// Export singleton instance
module.exports = new WebhookMonitoringService(); 