import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Send, 
  MessageCircle, 
  Bot, 
  ChevronRight, 
  Loader2,
  Sparkles,
  TrendingUp,
  Search,
  BarChart3
} from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
import PortfolioCard from '../components/PortfolioCard';
import TransactionList from '../components/TransactionList';
import SuggestionCard from '../components/SuggestionCard';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('chat'); // chat, portfolio, transactions

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  // Load wallet data when address changes
  useEffect(() => {
    if (address && isConnected) {
      loadWalletData(address);
    } else {
      setPortfolio(null);
      setTransactions([]);
    }
  }, [address, isConnected]);

  const loadSuggestions = async () => {
    try {
      const response = await fetch(`${API_BASE}/chat/suggestions`);
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.data.suggestions);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      // Fallback suggestions if API fails
      setSuggestions([
        {
          id: 'ai_analysis',
          title: '🤖 AI Analysis',
          description: 'Get intelligent insights about any wallet',
          icon: '🤖',
          action: 'ai_analysis'
        },
        {
          id: 'portfolio_demo',
          title: '💰 Portfolio Demo',
          description: 'View sample portfolio data',
          icon: '💰',
          action: 'show_portfolio'
        }
      ]);
    }
  };

  const loadWalletData = async (walletAddress) => {
    setLoading(true);
    try {
      // Load portfolio
      const portfolioResponse = await fetch(`${API_BASE}/nodit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api: 'getTokensOwnedByAccount',
          params: { accountAddress: walletAddress, rpp: 100, page: 1 },
          chain: 'base/mainnet'
        })
      });
      const portfolioData = await portfolioResponse.json();
      if (portfolioData && portfolioData.items) {
        setPortfolio({ assets: portfolioData.items });
      } else {
        setPortfolio(null);
      }

      // Load transactions
      const transactionsResponse = await fetch(`${API_BASE}/nodit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api: 'getTokenTransfersByAccount',
          params: { accountAddress: walletAddress, rpp: 10 },
          chain: 'base/mainnet'
        })
      });
      const transactionsData = await transactionsResponse.json();
      if (Array.isArray(transactionsData)) {
        setTransactions(transactionsData);
      } else if (transactionsData && transactionsData.items) {
        setTransactions(transactionsData.items);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      setPortfolio(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    switch (suggestion.action) {
      case 'show_portfolio':
        setActiveView('portfolio');
        break;
      case 'show_transactions':
        setActiveView('transactions');
        break;
      case 'ai_analysis':
        setActiveView('chat');
        // This will be handled by the chat interface
        break;
      default:
        setActiveView('chat');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">EchoWallet</h1>
                <p className="text-xs text-gray-400">AI-Powered Blockchain Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectButton showBalance={false} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Suggestions */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Quick Actions
              </h2>
              
              <div className="space-y-3">
                <AnimatePresence>
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <SuggestionCard
                        suggestion={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        // You can add logic to disable if not connected using isConnected
                        disabled={!isConnected && suggestion.action !== 'ai_analysis'}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {activeView === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
                >
                  <ChatInterface 
                    walletAddress={address}
                    isConnected={isConnected}
                  />
                </motion.div>
              )}

              {activeView === 'portfolio' && (
                <motion.div
                  key="portfolio"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <PortfolioCard 
                    portfolio={portfolio}
                    loading={loading}
                    walletAddress={address}
                  />
                </motion.div>
              )}

              {activeView === 'transactions' && (
                <motion.div
                  key="transactions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <TransactionList 
                    transactions={transactions}
                    loading={loading}
                    walletAddress={address}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
} 