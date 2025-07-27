import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function DebugPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, data) => {
    setResults(prev => [...prev, { message, data, timestamp: new Date().toISOString() }]);
  };

  const testAPI = async () => {
    setLoading(true);
    setResults([]);
    
    const walletAddress = '0x95606236867C2D3391F3dd2D3004EFAB08e819e4';
    
    try {
      addResult('🔍 Testing API_BASE', API_BASE);
      
      // Test 1: Status
      addResult('🧪 Testing status endpoint...', '');
      const statusResponse = await fetch(`${API_BASE}/monitoring/status/${walletAddress}`);
      const statusData = await statusResponse.json();
      addResult('✅ Status Response', statusData);
      
      // Test 2: Add Alert
      addResult('🧪 Testing add alert endpoint...', '');
      const alertResponse = await fetch(`${API_BASE}/monitoring/alerts/${walletAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'incoming_funds',
          token: 'USDC',
          amount: '0.2'
        })
      });
      const alertData = await alertResponse.json();
      addResult('✅ Alert Response', alertData);
      
      // Test 3: Trigger Check
      addResult('🧪 Testing trigger check endpoint...', '');
      const checkResponse = await fetch(`${API_BASE}/monitoring/trigger-check/${walletAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const checkData = await checkResponse.json();
      addResult('✅ Check Response', checkData);
      
      addResult('🎉 All tests completed!', '');
      
    } catch (error) {
      addResult('❌ Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Frontend-Backend Debug</h1>
        
        <div className="mb-6">
          <button
            onClick={testAPI}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium"
          >
            {loading ? 'Testing...' : '🧪 Test API Communication'}
          </button>
        </div>
        
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg">
              <div className="font-medium mb-2">{result.message}</div>
              {result.data && (
                <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
              <div className="text-xs text-gray-400 mt-2">
                {result.timestamp}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 