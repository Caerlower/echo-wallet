import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ChevronDown, Loader2 } from 'lucide-react';

export default function WalletConnect({ onConnect }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);

  // Check if MetaMask is available on mount
  useEffect(() => {
    const checkMetaMask = () => {
      const available = typeof window !== 'undefined' && 
                       typeof window.ethereum !== 'undefined' && 
                       window.ethereum.isMetaMask;
      setIsMetaMaskAvailable(available);
    };

    checkMetaMask();
    
    // Listen for MetaMask installation
    if (typeof window !== 'undefined') {
      window.addEventListener('ethereum#initialized', checkMetaMask);
      return () => window.removeEventListener('ethereum#initialized', checkMetaMask);
    }
  }, []);

  const connectWallet = async (walletType) => {
    setIsConnecting(true);
    setError(null);

    try {
      let address = null;

      if (walletType === 'metamask') {
        address = await connectMetaMask();
      } else if (walletType === 'walletconnect') {
        address = await connectWalletConnect();
      } else if (walletType === 'coinbase') {
        address = await connectCoinbaseWallet();
      }

      if (address) {
        onConnect(address);
        setShowModal(false);
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      
      // Handle specific MetaMask errors
      let errorMessage = err.message || 'Failed to connect wallet';
      
      if (err.message?.includes('Receiving end does not exist')) {
        errorMessage = 'MetaMask is not available. Please install MetaMask and refresh the page.';
      } else if (err.code === 4001) {
        errorMessage = 'Connection rejected by user.';
      } else if (err.code === -32002) {
        errorMessage = 'Please check MetaMask - connection request is pending.';
      } else if (err.message?.includes('User rejected')) {
        errorMessage = 'Connection was rejected. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectMetaMask = async () => {
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }

    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask and try again.');
    }

    if (!window.ethereum.isMetaMask) {
      throw new Error('Please use MetaMask wallet.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const address = accounts[0];

      // Check if we're on the right network (Base)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x2105') { // Base mainnet chain ID
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }]
          });
        } catch (switchError) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x2105',
                chainName: 'Base',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org']
              }]
            });
          } else {
            throw switchError;
          }
        }
      }

      return address;
    } catch (error) {
      console.error('MetaMask connection error:', error);
      throw error;
    }
  };

  const connectWalletConnect = async () => {
    // This would require WalletConnect v2 setup
    // For now, we'll show a placeholder
    throw new Error('WalletConnect integration coming soon!');
  };

  const connectCoinbaseWallet = async () => {
    // This would require Coinbase Wallet SDK setup
    // For now, we'll show a placeholder
    throw new Error('Coinbase Wallet integration coming soon!');
  };

  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: isMetaMaskAvailable ? 'Connect with MetaMask' : 'MetaMask not detected',
      icon: '🦊',
      available: isMetaMaskAvailable
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect with any wallet',
      icon: '🔗',
      available: false
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect with Coinbase Wallet',
      icon: '🪙',
      available: false
    }
  ];

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Connect Wallet</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => connectWallet(wallet.id)}
                  disabled={!wallet.available || isConnecting}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 flex items-center space-x-3 ${
                    wallet.available
                      ? 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white'
                      : 'border-gray-600/30 bg-gray-800/30 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{wallet.name}</p>
                    <p className="text-sm opacity-70">{wallet.description}</p>
                  </div>
                  {isConnecting && wallet.available && (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
                </button>
              ))}
            </div>

            {!isMetaMaskAvailable && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-300">
                  MetaMask is not detected. Please install MetaMask extension and refresh the page.
                </p>
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm underline mt-2 inline-block"
                >
                  Download MetaMask
                </a>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                By connecting your wallet, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
} 