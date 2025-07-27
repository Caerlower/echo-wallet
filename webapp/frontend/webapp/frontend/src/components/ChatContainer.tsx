import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../types';
import MessageBubble from './MessageBubble';
import QuickActions from './QuickActions';
import ChatInput from './ChatInput';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onQuickAction: (action: string) => void;
  isTyping: boolean;
  isConnected: boolean;
  disabled?: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSendMessage,
  onQuickAction,
  isTyping,
  isConnected,
  disabled = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-white/10">
        {/* Quick Actions */}
        <QuickActions onActionClick={onQuickAction} isConnected={isConnected} />
        
        {/* Chat Input */}
        <ChatInput
          onSendMessage={onSendMessage}
          disabled={disabled || isTyping}
          placeholder={
            isConnected
              ? "Ask about your portfolio, transactions, or request AI analysis..."
              : "Ask about any wallet or connect yours to get started..."
          }
        />
      </div>
    </div>
  );
};

export default ChatContainer;