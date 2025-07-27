require('dotenv').config();
const monitoringService = require('./services/monitoring');

async function debugMonitoring() {
  console.log('🔍 Debugging Monitoring Service...');
  
  // Check if bot is initialized
  console.log('Bot initialized:', monitoringService.bot ? 'YES' : 'NO');
  
  // Add wallet to monitoring with alert
  const address = '0x95606236867C2D3391F3dd2D3004EFAB08e819e4';
  const chatId = '1127286409';
  
  console.log('📊 Adding wallet to monitoring...');
  monitoringService.addWalletToMonitoring(address, chatId, [
    {
      id: '1',
      type: 'incoming_funds',
      token: 'USDC',
      amount: '0.1',
      enabled: true
    }
  ]);
  
  // Check wallet status
  const status = monitoringService.getWalletStatus(address);
  console.log('Wallet status:', JSON.stringify(status, null, 2));
  
  // Test notification
  try {
    console.log('🧪 Sending test notification...');
    await monitoringService.sendTestNotification(chatId, '🧪 Debug test notification!');
    console.log('✅ Test notification sent successfully');
  } catch (error) {
    console.log('❌ Test notification failed:', error.message);
  }
  
  // Trigger immediate check
  console.log('🚀 Triggering immediate check...');
  await monitoringService.triggerImmediateCheck(address);
  
  console.log('✅ Debug completed');
}

debugMonitoring().catch(console.error); 