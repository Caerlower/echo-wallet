import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, ExternalLink, Loader2, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TransactionList({ transactions, walletAddress, ensName, loading }) {
  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <span className="text-white">Loading transactions...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Transactions Found</h3>
          <p className="text-gray-400">This wallet has no recent transaction activity</p>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const getTransactionIcon = (direction, type) => {
    if (direction === 'IN') {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
  };

  const getTransactionColor = (direction) => {
    return direction === 'IN' ? 'text-green-400' : 'text-red-400';
  };

  const openTransaction = (hash) => {
    window.open(`https://basescan.org/tx/${hash}`, '_blank');
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Transaction History</h2>
        <p className="text-gray-400">
          {ensName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
        </p>
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total Transactions</p>
          <p className="text-xl font-semibold text-white">{transactions.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Incoming</p>
          <p className="text-xl font-semibold text-green-400">
            {transactions.filter(tx => tx.direction === 'IN').length}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Outgoing</p>
          <p className="text-xl font-semibold text-red-400">
            {transactions.filter(tx => tx.direction === 'OUT').length}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {transactions.map((transaction, index) => (
          <motion.div
            key={transaction.hash}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => openTransaction(transaction.hash)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg">
                  {getTransactionIcon(transaction.direction, transaction.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className={`font-semibold ${getTransactionColor(transaction.direction)}`}>
                      {transaction.direction === 'IN' ? 'Received' : 'Sent'}
                    </p>
                    <span className="text-white font-medium">
                      {transaction.value} {transaction.tokenSymbol}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(transaction.timestamp)}</span>
                    <span>•</span>
                    <span>{transaction.type === 'native' ? 'ETH' : 'Token'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Transaction Details */}
            <div className="mt-3 pt-3 border-t border-white/10 text-sm text-gray-400">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500">From:</p>
                  <p className="font-mono text-xs">
                    {transaction.from.slice(0, 6)}...{transaction.from.slice(-4)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">To:</p>
                  <p className="font-mono text-xs">
                    {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View More */}
      {transactions.length >= 10 && (
        <div className="mt-6 text-center">
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors">
            View More Transactions
          </button>
        </div>
      )}
    </div>
  );
} 