import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  Bot, 
  Search, 
  BarChart3, 
  Send,
  History,
  Sparkles
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: string;
  description: string;
  disabled?: boolean;
}

interface QuickActionsProps {
  onActionClick: (action: string) => void;
  isConnected: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick, isConnected }) => {
  const actions: QuickAction[] = [
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: <Wallet className="w-4 h-4" />,
      action: 'show_portfolio',
      description: 'View your assets',
      disabled: !isConnected,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <History className="w-4 h-4" />,
      action: 'show_transactions',
      description: 'Recent activity',
      disabled: !isConnected,
    },
    {
      id: 'ai_analysis',
      label: 'AI Analysis',
      icon: <Bot className="w-4 h-4" />,
      action: 'ai_analysis',
      description: 'Get insights',
      disabled: !isConnected,
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="w-4 h-4" />,
      action: 'search_transactions',
      description: 'Find transactions',
      disabled: !isConnected,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: action.disabled ? 1 : 1.05 }}
          whileTap={{ scale: action.disabled ? 1 : 0.95 }}
          onClick={() => !action.disabled && onActionClick(action.action)}
          disabled={action.disabled}
          className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
            action.disabled
              ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30'
          }`}
          title={action.description}
        >
          {action.icon}
          <span>{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActions;