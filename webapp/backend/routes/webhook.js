const express = require('express');
const router = express.Router();
const webhookMonitoring = require('../services/webhook-monitoring');

// Handle incoming webhook from Nodit
router.post('/nodit', async (req, res) => {
  try {
    console.log('🔔 Received webhook from Nodit');
    
    // Process the webhook data
    await webhookMonitoring.handleWebhook(req.body);
    
    // Return success to Nodit
    res.status(200).json({ success: true, message: 'Webhook processed successfully' });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to process webhook' });
  }
});

// Test webhook endpoint
router.post('/test', async (req, res) => {
  try {
    const { chatId, message } = req.body;
    
    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required'
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