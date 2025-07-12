import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Coins, Loader2 } from 'lucide-react';

export default function PortfolioCard({ portfolio, walletAddress, ensName, loading }) {
  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <span className="text-white">Loading portfolio...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <div className="text-center py-12">
          <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Portfolio Data</h3>
          <p className="text-gray-400">Connect your wallet to view your portfolio</p>
        </div>
      </div>
    );
  }

  const totalValue = portfolio.totalValue || 0;
  const assets = portfolio.assets || [];

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Portfolio Overview</h2>
        <p className="text-gray-400">
          {ensName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
        </p>
      </div>

      {/* Total Value */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-white">${totalValue.toFixed(2)}</p>
          </div>
          <DollarSign className="w-8 h-8 text-purple-400" />
        </div>
      </div>

      {/* Assets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Assets ({assets.length})</h3>
        </div>

        {assets.length > 0 ? (
          <div className="space-y-3">
            {assets.slice(0, 10).map((asset, index) => (
              <motion.div
                key={asset.contractAddress}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {asset.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{asset.symbol}</p>
                      <p className="text-sm text-gray-400">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {asset.balance.toFixed(4)} {asset.symbol}
                    </p>
                    <p className="text-sm text-gray-400">
                      ${(asset.value || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {assets.length > 10 && (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">
                  ...and {assets.length - 10} more assets
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Assets Found</h3>
            <p className="text-gray-400">This wallet has no detectable assets on Base chain</p>
          </div>
        )}
      </div>

      {/* Portfolio Stats */}
      {assets.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Assets</p>
              <p className="text-xl font-semibold text-white">{assets.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Largest Asset</p>
              <p className="text-xl font-semibold text-white">
                {assets[0]?.symbol || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 