import React, { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const MonitoringPanel = ({ walletAddress }) => {
  console.log('🔍 MonitoringPanel API_BASE:', API_BASE);
  console.log('🔍 MonitoringPanel walletAddress:', walletAddress);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [chatId, setChatId] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'incoming_funds',
    token: 'ETH',
    amount: ''
  });

  // Load monitoring status on component mount
  useEffect(() => {
    if (walletAddress) {
      loadMonitoringStatus();
    }
  }, [walletAddress]);

  const loadMonitoringStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/monitoring/status/${walletAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setIsMonitoring(data.data.isMonitored);
        if (data.data.isMonitored) {
          setChatId(data.data.chatId);
          setAlerts(data.data.alerts || []);
        }
      }
    } catch (error) {
      console.error('Error loading monitoring status:', error);
      setMessage('Failed to load monitoring status');
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = async () => {
    if (!chatId.trim()) {
      setMessage('Please enter your Telegram Chat ID');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/monitoring/start/${walletAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId.trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsMonitoring(true);
        setMessage('Monitoring started successfully!');
        await loadMonitoringStatus();
      } else {
        setMessage(data.error || 'Failed to start monitoring');
      }
    } catch (error) {
      console.error('Error starting monitoring:', error);
      setMessage('Failed to start monitoring');
    } finally {
      setLoading(false);
    }
  };

  const stopMonitoring = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/monitoring/stop/${walletAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success) {
        setIsMonitoring(false);
        setChatId('');
        setAlerts([]);
        setMessage('Monitoring stopped successfully!');
      } else {
        setMessage(data.error || 'Failed to stop monitoring');
      }
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      setMessage('Failed to stop monitoring');
    } finally {
      setLoading(false);
    }
  };

  const addAlert = async () => {
    if (!newAlert.amount || parseFloat(newAlert.amount) <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Adding alert:', { API_BASE, walletAddress, newAlert });
      
      const response = await fetch(`${API_BASE}/monitoring/alerts/${walletAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert)
      });

      const data = await response.json();
      console.log('🔍 Alert response:', data);
      
      if (data.success) {
        setNewAlert({ type: 'incoming_funds', token: 'ETH', amount: '' });
        setShowAddAlert(false);
        setMessage('Alert added successfully!');
        await loadMonitoringStatus();
      } else {
        setMessage(data.error || 'Failed to add alert');
      }
    } catch (error) {
      console.error('Error adding alert:', error);
      setMessage('Failed to add alert');
    } finally {
      setLoading(false);
    }
  };

  const removeAlert = async (alertId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/monitoring/alerts/${walletAddress}/${alertId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('Alert removed successfully!');
        await loadMonitoringStatus();
      } else {
        setMessage(data.error || 'Failed to remove alert');
      }
    } catch (error) {
      console.error('Error removing alert:', error);
      setMessage('Failed to remove alert');
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async () => {
    if (!chatId.trim()) {
      setMessage('Please enter your Telegram Chat ID first');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/monitoring/test-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId: chatId.trim(),
          message: '🧪 Test notification from EchoWallet! Your monitoring setup is working correctly.'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('Test notification sent! Check your Telegram.');
      } else {
        setMessage(data.error || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setMessage('Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  const triggerImmediateCheck = async () => {
    try {
      setLoading(true);
      console.log('🔍 Triggering immediate check:', { API_BASE, walletAddress });
      
      const response = await fetch(`${API_BASE}/monitoring/trigger-check/${walletAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      console.log('🔍 Check response:', data);
      
      if (data.success) {
        setMessage('Immediate check triggered! Check your Telegram for notifications.');
      } else {
        setMessage(data.error || 'Failed to trigger immediate check');
      }
    } catch (error) {
      console.error('Error triggering immediate check:', error);
      setMessage('Failed to trigger immediate check');
    } finally {
      setLoading(false);
    }
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'incoming_funds': return 'Incoming Funds';
      case 'outgoing_funds': return 'Outgoing Funds';
      case 'nft_received': return 'NFT Received';
      case 'custom_amount': return 'Custom Amount';
      default: return type;
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">🔔 Wallet Monitoring</h3>
      
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('successfully') 
            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          {message}
        </div>
      )}

      {!isMonitoring ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Telegram Chat ID
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Enter your Telegram Chat ID"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Get your Chat ID by messaging @userinfobot on Telegram
            </p>
          </div>
          
          <button
            onClick={startMonitoring}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Starting...' : 'Start Monitoring'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 font-medium">✅ Monitoring Active</p>
              <p className="text-sm text-gray-400">Chat ID: {chatId}</p>
            </div>
            <button
              onClick={stopMonitoring}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {loading ? 'Stopping...' : 'Stop'}
            </button>
          </div>

          <div className="border-t border-white/20 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-white">Alerts ({alerts.length})</h4>
              <button
                onClick={() => setShowAddAlert(!showAddAlert)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                {showAddAlert ? 'Cancel' : 'Add Alert'}
              </button>
            </div>

            {showAddAlert && (
              <div className="bg-white/5 border border-white/20 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={newAlert.type}
                    onChange={(e) => setNewAlert({...newAlert, type: e.target.value})}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="incoming_funds">Incoming Funds</option>
                    <option value="outgoing_funds">Outgoing Funds</option>
                    <option value="nft_received">NFT Received</option>
                    <option value="custom_amount">Custom Amount</option>
                  </select>
                  
                  <input
                    type="text"
                    value={newAlert.token}
                    onChange={(e) => setNewAlert({...newAlert, token: e.target.value})}
                    placeholder="Token (ETH, USDC, etc.)"
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  
                  <input
                    type="number"
                    value={newAlert.amount}
                    onChange={(e) => setNewAlert({...newAlert, amount: e.target.value})}
                    placeholder="Minimum amount"
                    step="0.000001"
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <button
                  onClick={addAlert}
                  disabled={loading}
                  className="mt-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  {loading ? 'Adding...' : 'Add Alert'}
                </button>
              </div>
            )}

            {alerts.length === 0 ? (
              <p className="text-gray-400 text-sm">No alerts configured</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between bg-white/5 border border-white/20 rounded-lg p-3">
                    <div>
                      <p className="text-white font-medium">{getAlertTypeLabel(alert.type)}</p>
                      <p className="text-sm text-gray-400">
                        {alert.token} ≥ {alert.amount}
                      </p>
                    </div>
                    <button
                      onClick={() => removeAlert(alert.id)}
                      disabled={loading}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/20 pt-4 space-y-3">
            <button
              onClick={testNotification}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Sending...' : 'Send Test Notification'}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Test if your Telegram notifications are working
            </p>
            
            <button
              onClick={triggerImmediateCheck}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Checking...' : 'Check Now'}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Manually check for new transactions immediately
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringPanel; 