import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { WalletData } from '../types';

interface WalletStatusProps {
  walletData: WalletData | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

const WalletStatus: React.FC<WalletStatusProps> = ({
  walletData,
  onConnect,
  onDisconnect,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyAddress = async () => {
    if (walletData?.address) {
      await navigator.clipboard.writeText(walletData.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openInExplorer = () => {
    if (walletData?.address) {
      window.open(`https://basescan.org/address/${walletData.address}`, '_blank');
    }
  };

  if (!walletData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400 mb-6">
          Connect your wallet to start analyzing your Base chain assets and transactions.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onConnect}
          className="btn-primary"
        >
          Connect Wallet
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Wallet Connected</h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-green-400">Active</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Address */}
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Address</p>
              <p className="text-white font-mono text-sm">
                {walletData.ensName || `${walletData.address.slice(0, 8)}...${walletData.address.slice(-6)}`}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={copyAddress}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={openInExplorer}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-sm text-gray-400">ETH Balance</p>
          <p className="text-white font-semibold">
            {parseFloat(walletData.balance || '0').toFixed(4)} ETH
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDisconnect}
            className="flex-1 btn-secondary"
          >
            Disconnect
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default WalletStatus;