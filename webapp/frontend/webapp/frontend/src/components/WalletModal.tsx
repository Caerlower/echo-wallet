import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, AlertCircle, Loader2 } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  isConnecting,
  error,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass rounded-3xl p-6 w-full max-w-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Connect Wallet</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Wallet Options */}
          <div className="space-y-3 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConnect}
              disabled={isConnecting}
              className="w-full p-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-2xl transition-all duration-200 flex items-center space-x-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🦊</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium">MetaMask</p>
                <p className="text-gray-400 text-sm">Connect using MetaMask wallet</p>
              </div>
              {isConnecting && <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />}
            </motion.button>

            {/* Coming Soon Options */}
            <div className="space-y-2">
              {[
                { name: 'WalletConnect', icon: '🔗', description: 'Connect with any wallet' },
                { name: 'Coinbase Wallet', icon: '🪙', description: 'Connect with Coinbase Wallet' },
              ].map((wallet) => (
                <div
                  key={wallet.name}
                  className="w-full p-4 bg-gray-800/50 border border-gray-700/50 rounded-2xl flex items-center space-x-4 opacity-50"
                >
                  <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
                    <span className="text-gray-400 text-lg">{wallet.icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-gray-400 font-medium">{wallet.name}</p>
                    <p className="text-gray-500 text-sm">Coming soon</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <Wallet className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 font-medium text-sm">Secure Connection</p>
                <p className="text-blue-300/80 text-xs mt-1">
                  Your wallet will be connected securely. We never store your private keys.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WalletModal;