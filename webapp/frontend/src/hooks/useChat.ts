import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, ChatState } from '../types';
import { chatApi, aiApi } from '../services/api';

export const useChat = (walletAddress?: string) => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    isConnected: !!walletAddress,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  // Add welcome message on mount
  useEffect(() => {
    if (chatState.messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: walletAddress 
          ? `👋 Welcome! I can help you analyze your wallet **${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}**. Try asking me about your portfolio, recent transactions, or request an AI analysis!`
          : `👋 Hello! I'm EchoWallet, your AI-powered blockchain assistant for the Base chain. Connect your wallet or ask me about any wallet address to get started!`,
        timestamp: new Date(),
      };
      
      setChatState(prev => ({
        ...prev,
        messages: [welcomeMessage],
      }));
    }
  }, [walletAddress]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || chatState.isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
    }));

    try {
      // Add typing indicator
      const typingMessage: Message = {
        id: `typing-${Date.now()}`,
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        loading: true,
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, typingMessage],
      }));

      // Process message with backend
      const response = await chatApi.processMessage(content, walletAddress, {
        isConnected: !!walletAddress,
      });

      // Remove typing indicator and add response
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== typingMessage.id),
        isTyping: false,
      }));

      if (response.success && response.data) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          data: response.data.data,
        };

        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
        }));
      } else {
        throw new Error(response.error || 'Failed to process message');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => !m.loading),
        isTyping: false,
      }));

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
      }));
    }
  }, [chatState.isTyping, walletAddress]);

  const sendQuickAction = useCallback(async (action: string, data?: any) => {
    let message = '';
    
    switch (action) {
      case 'show_portfolio':
        message = 'Show my portfolio';
        break;
      case 'show_transactions':
        message = 'Show recent transactions';
        break;
      case 'ai_analysis':
        message = 'Analyze my wallet with AI';
        break;
      case 'search_transactions':
        message = 'Search transactions';
        break;
      default:
        message = action;
    }

    await sendMessage(message);
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      messages: [],
    }));
  }, []);

  return {
    messages: chatState.messages,
    isTyping: chatState.isTyping,
    sendMessage,
    sendQuickAction,
    clearChat,
    messagesEndRef,
  };
};