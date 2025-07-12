import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function SuggestionCard({ suggestion, onClick, disabled = false }) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(suggestion);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`w-full p-4 rounded-xl border transition-all duration-200 text-left ${
        disabled
          ? 'border-gray-600/30 bg-gray-800/30 text-gray-500 cursor-not-allowed'
          : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white cursor-pointer'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{suggestion.icon}</span>
          <div>
            <p className={`font-medium ${disabled ? 'text-gray-500' : 'text-white'}`}>
              {suggestion.title}
            </p>
            <p className={`text-sm ${disabled ? 'text-gray-600' : 'text-gray-300'}`}>
              {suggestion.description}
            </p>
          </div>
        </div>
        {!disabled && (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </motion.button>
  );
} 