import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Clock } from 'lucide-react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import TypingIndicator from './TypingIndicator';

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  if (message.loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start space-x-3 mb-6"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="message-bubble message-assistant">
          <TypingIndicator />
        </div>
      </motion.div>
    );
  }

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center mb-6"
      >
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl px-4 py-2 text-sm text-yellow-300">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start space-x-3 mb-6 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
    >
      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
            : 'bg-gradient-to-r from-primary-500 to-primary-600'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </motion.div>

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`message-bubble ${isUser ? 'message-user' : 'message-assistant'}`}
        >
          {isUser ? (
            <p className="text-white">{message.content}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-invert max-w-none"
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 text-white">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-white">{children}</ul>,
                li: ({ children }) => <li className="text-sm text-white">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-black/20 px-2 py-1 rounded text-primary-300 font-mono text-sm">
                    {children}
                  </code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </motion.div>

        {/* Timestamp */}
        <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <Clock className="w-3 h-3" />
          <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;