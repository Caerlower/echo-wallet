const express = require('express');
const router = express.Router();
const webhookMonitoring = require('../services/webhook-monitoring');

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

// Start webhook monitoring for a wallet
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

    // Add wallet to webhook monitoring
    const result = await webhookMonitoring.addWalletToMonitoring(address, chatId, alerts);

    res.json({
      success: true,
      message: 'Webhook monitoring started successfully',
      data: {
        address,
        chatId,
        alerts: alerts.length,
        isMonitored: true,
        webhookId: result.webhookId
      }
    });

  } catch (error) {
    console.error('Error starting webhook monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start webhook monitoring'
    });
  }
});

// Stop webhook monitoring for a wallet
router.post('/stop/:address', validateWalletAddress, async (req, res) => {
  try {
    const { address } = req.params;
    
    await webhookMonitoring.removeWalletFromMonitoring(address);

    res.json({
      success: true,
      message: 'Webhook monitoring stopped successfully',
      data: {
        address,
        isMonitored: false
      }
    });

  } catch (error) {
    console.error('Error stopping webhook monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop webhook monitoring'
    });
  }
});

// Get webhook monitoring status for a wallet
router.get('/status/:address', validateWalletAddress, async (req, res) => {
  try {
    const { address } = req.params;
    
    const status = webhookMonitoring.getWalletStatus(address);

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error getting webhook monitoring status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook monitoring status'
    });
  }
});

// Get all webhook monitored wallets
router.get('/wallets', async (req, res) => {
  try {
    const wallets = webhookMonitoring.getAllMonitoredWallets();

    res.json({
      success: true,
      data: wallets
    });

  } catch (error) {
    console.error('Error getting webhook monitored wallets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook monitored wallets'
    });
  }
});

// Send test notification
router.post('/test-notification', async (req, res) => {
  try {
    const { chatId, message } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Telegram chat ID is required'
      });
    }

    await webhookMonitoring.sendTestNotification(chatId, message);

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

module.exports = router; 