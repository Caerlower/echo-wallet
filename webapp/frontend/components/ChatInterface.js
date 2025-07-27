import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatInterface({ walletAddress, isConnected, onWalletDataUpdate }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Add welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'assistant',
        content: isConnected 
          ? `👋 Welcome! I can help you analyze your wallet **${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}**. Try asking me about your portfolio, recent transactions, or request an AI analysis!`
          : `👋 Hello! I'm EchoWallet, your AI-powered blockchain assistant for the Base chain. Connect your wallet or ask me about any wallet address to get started!`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, [isConnected, walletAddress]);

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim() || isProcessing) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/chat/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          walletAddress,
          context: { isConnected }
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Simulate typing delay
        setTimeout(() => {
          setIsTyping(false);
          
          const assistantMessage = {
            id: Date.now() + 1,
            type: 'assistant',
            content: data.data.response,
            data: data.data.data,
            timestamp: new Date().toISOString()
          };

          setMessages(prev => [...prev, assistantMessage]);

          // Update wallet data if needed
          if (data.data.data && onWalletDataUpdate) {
            onWalletDataUpdate();
          }
        }, 1000);
      } else {
        throw new Error(data.error || 'Failed to process message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>

          {/* Message Content */}
          <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-4 rounded-2xl ${
              isUser 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white'
            }`}>
              <ReactMarkdown
                className="prose prose-invert max-w-none text-white"
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0 text-white leading-relaxed">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-white bg-white/10 px-1 rounded">{children}</strong>,
                  em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-2 my-3 text-white">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 my-3 text-white">{children}</ol>,
                  li: ({ children }) => <li className="text-sm text-gray-200 leading-relaxed">{children}</li>,
                  h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-3 mt-4 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold text-white mb-2 mt-3 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold text-white mb-2 mt-3 first:mt-0">{children}</h3>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-500 pl-4 my-3 italic text-gray-300">{children}</blockquote>,
                  code: ({ children }) => <code className="bg-white/10 px-2 py-1 rounded text-sm font-mono text-purple-300">{children}</code>,
                  pre: ({ children }) => <pre className="bg-white/5 p-3 rounded-lg overflow-x-auto my-3">{children}</pre>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formatTimestamp(message.timestamp)}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">EchoWallet Assistant</h3>
            <p className="text-xs text-gray-400">
              {isConnected ? 'Connected to wallet' : 'Ready to help'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map(renderMessage)}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start mb-4"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span className="text-sm text-gray-300">EchoWallet is thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected 
                ? "Ask about your portfolio, transactions, or request AI analysis..."
                : "Ask about any wallet or connect yours to get started..."
              }
              className="w-full p-3 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              rows={1}
              disabled={isProcessing}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isProcessing}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        {isConnected && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { text: 'Show portfolio', icon: '💰' },
              { text: 'Recent transactions', icon: '📈' },
              { text: 'AI analysis', icon: '🤖' },
              { text: 'Search USDC', icon: '🔍' }
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => sendMessage(action.text)}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-all flex items-center space-x-1"
              >
                <span>{action.icon}</span>
                <span>{action.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 