const express = require('express');
const router = express.Router();
const monitoring = require('../services/monitoring');
const { resolveENS } = require('../services/ens');

// Middleware to validate wallet address
const validateWalletAddress = (req, res, next) => {
  const { address } = req.params;
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet address format'
    });
  }
  next();
};

// Start monitoring a wallet
router.post('/start/:address', validateWalletAddress, async (req, res) => {
  try {
    const { address } = req.params;
    const { chatId, alerts = [] } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Telegram chat ID is required'
      });
    }

    // Add wallet to monitoring
    monitoring.addWalletToMonitoring(address, chatId, alerts);

    res.json({
      success: true,
      message: 'Wallet monitoring started successfully',
      data: {
        address,
        chatId,
        alerts: alerts.length,
        isMonitored: true
      }
    });

  } catch (error) {
    console.error('Error starting monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start monitoring'
    });
  }
});

// Stop monitoring a wallet
router.post('/stop/:address', validateWalletAddress, async (req, res) => {
  try {
    const { address } = req.params;
    
    monitoring.removeWalletFromMonitoring(address);

    res.json({
      success: true,
      message: 'Wallet monitoring stopped successfully',
      data: {
        address,
        isMonitored: false
      }
    });

  } catch (error) {
    console.error('Error stopping monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop monitoring'
    });
  }
});

// Get monitoring status for a wallet
router.get('/status/:address', validateWalletAddress, async (req, res) => {
  try {
    const { address } = req.params;
    
    const status = monitoring.getWalletStatus(address);

    res.json({
      success: true,
      data: status || { address, isMonitored: false }
    });

  } catch (error) {
    console.error('Error getting monitoring status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monitoring status'
    });
  }
});

// Add alert to a monitored wallet
router.post('/alerts/:address', validateWalletAddress, async (req, res) => {
  try {
    const { address } = req.params;
    const { type, token, amount } = req.body;

    // Validate alert parameters
    if (!type || !token || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Alert type, token, and amount are required'
      });
    }

    const validTypes = ['incoming_funds', 'outgoing_funds', 'nft_received', 'custom_amount'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert type'
      });
    }

    // Check if wallet is being monitored
    const status = monitoring.getWalletStatus(address);
    if (!status || !status.isMonitored) {
      return res.status(400).json({
        success: false,
        error: 'Wallet is not being monitored. Start monitoring first.'
      });
    }

    // Add alert
    monitoring.addAlert(address, { type, token, amount });

    res.json({
      success: true,
      message: 'Alert added successfully',
      data: {
        address,
        alert: { type, token, amount }
      }
    });

  } catch (error) {
    console.error('Error adding alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add alert'
    });
  }
});

// Remove alert from a monitored wallet
router.delete('/alerts/:address/:alertId', validateWalletAddress, async (req, res) => {
  try {
    const { address, alertId } = req.params;

    monitoring.removeAlert(address, alertId);

    res.json({
      success: true,
      message: 'Alert removed successfully',
      data: {
        address,
        alertId
      }
    });

  } catch (error) {
    console.error('Error removing alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove alert'
    });
  }
});

// Get all alerts for a wallet
router.get('/alerts/:address', validateWalletAddress, async (req, res) => {
  try {
    const { address } = req.params;
    
    const status = monitoring.getWalletStatus(address);
    
    if (!status || !status.isMonitored) {
      return res.json({
        success: true,
        data: {
          address,
          alerts: [],
          isMonitored: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        address,
        alerts: status.alerts,
        isMonitored: true
      }
    });

  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts'
    });
  }
});

// Test notification
router.post('/test-notification', async (req, res) => {
  try {
    const { chatId, message } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Telegram chat ID is required'
      });
    }

    await monitoring.sendTestNotification(chatId, message);

    res.json({
      success: true,
      message: 'Test notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
});

// Get all monitored wallets (admin endpoint)
router.get('/all', async (req, res) => {
  try {
    const wallets = monitoring.getAllMonitoredWallets();

    res.json({
      success: true,
      data: {
        wallets,
        total: wallets.length
      }
    });

  } catch (error) {
    console.error('Error getting monitored wallets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monitored wallets'
    });
  }
});

// Get monitoring service status
router.get('/service-status', async (req, res) => {
  try {
    const wallets = monitoring.getAllMonitoredWallets();
    const isRunning = monitoring.isRunning;

    res.json({
      success: true,
      data: {
        isRunning,
        totalMonitoredWallets: wallets.length,
        telegramBotAvailable: !!process.env.TELEGRAM_TOKEN
      }
    });

  } catch (error) {
    console.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status'
    });
  }
});

// Trigger immediate check for a wallet
router.post('/trigger-check/:address', validateWalletAddress, async (req, res) => {
  try {
    const { address } = req.params;
    
    await monitoring.triggerImmediateCheck(address);

    res.json({
      success: true,
      message: 'Immediate check triggered successfully',
      data: {
        address,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error triggering immediate check:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to trigger immediate check'
    });
  }
});

module.exports = router; 