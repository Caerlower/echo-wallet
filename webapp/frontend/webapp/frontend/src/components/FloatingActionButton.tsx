import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Wallet, Moon, Sun, HelpCircle } from 'lucide-react';

interface FloatingActionButtonProps {
  onOpenWallet: () => void;
  onToggleTheme: () => void;
  onOpenHelp: () => void;
  isDarkMode: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onOpenWallet,
  onToggleTheme,
  onOpenHelp,
  isDarkMode,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const actions = [
    {
      icon: <Wallet className="w-5 h-5" />,
      label: 'Wallet',
      onClick: onOpenWallet,
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />,
      label: 'Theme',
      onClick: onToggleTheme,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: 'Help',
      onClick: onOpenHelp,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-16 right-0 space-y-3"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200`}
                title={action.label}
              >
                {action.icon}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMenu}
        className="w-14 h-14 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
};

export default FloatingActionButton;