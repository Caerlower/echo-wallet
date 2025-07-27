import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 py-2">
      <span className="text-gray-400 text-sm mr-2">EchoWallet is thinking</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary-400 rounded-full typing-dot"></div>
        <div className="w-2 h-2 bg-primary-400 rounded-full typing-dot"></div>
        <div className="w-2 h-2 bg-primary-400 rounded-full typing-dot"></div>
      </div>
    </div>
  );
};

export default TypingIndicator;