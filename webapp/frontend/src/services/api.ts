import axios from 'axios';
import { ApiResponse, WalletInsights, Portfolio, Transaction } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const walletApi = {
  // Get wallet portfolio
  getPortfolio: async (address: string): Promise<ApiResponse<{ portfolio: Portfolio }>> => {
    const response = await api.get(`/wallet/portfolio/${address}`);
    return response.data;
  },

  // Get wallet insights
  getInsights: async (address: string, days = 30): Promise<ApiResponse<{ insights: WalletInsights }>> => {
    const response = await api.get(`/wallet/insights/${address}?days=${days}`);
    return response.data;
  },

  // Get transaction history
  getTransactions: async (address: string, type = 'all', limit = 50): Promise<ApiResponse<{ transactions: Transaction[] }>> => {
    const response = await api.get(`/wallet/transactions/${address}?type=${type}&limit=${limit}`);
    return response.data;
  },

  // Search transactions
  searchTransactions: async (address: string, query: string): Promise<ApiResponse<{ searchResult: any }>> => {
    const response = await api.post(`/wallet/search/${address}`, { query });
    return response.data;
  },

  // Get wallet balance
  getBalance: async (address: string): Promise<ApiResponse<{ balance: string; balanceEth: number }>> => {
    const response = await api.get(`/wallet/balance/${address}`);
    return response.data;
  },
};

export const chatApi = {
  // Process chat message
  processMessage: async (message: string, walletAddress?: string, context?: any): Promise<ApiResponse<{ response: string; data?: any }>> => {
    const response = await api.post('/chat/process', {
      message,
      walletAddress,
      context,
    });
    return response.data;
  },

  // Get chat suggestions
  getSuggestions: async (walletAddress?: string): Promise<ApiResponse<{ suggestions: any[] }>> => {
    const response = await api.get(`/chat/suggestions${walletAddress ? `?walletAddress=${walletAddress}` : ''}`);
    return response.data;
  },
};

export const aiApi = {
  // Analyze wallet with AI
  analyzeWallet: async (address: string): Promise<ApiResponse<{ analysis: string; portfolio: any; activity: any }>> => {
    const response = await api.post('/ai/analyze-wallet', { address });
    return response.data;
  },

  // Analyze portfolio with AI
  analyzePortfolio: async (address: string): Promise<ApiResponse<{ analysis: string; portfolio: any }>> => {
    const response = await api.post('/ai/analyze-portfolio', { address });
    return response.data;
  },

  // Explain transaction with AI
  explainTransaction: async (transaction: Transaction): Promise<ApiResponse<{ explanation: string }>> => {
    const response = await api.post('/ai/explain-transaction', { transaction });
    return response.data;
  },

  // Ask general question
  askQuestion: async (question: string, walletContext?: any): Promise<ApiResponse<{ answer: string }>> => {
    const response = await api.post('/ai/ask', { question, walletContext });
    return response.data;
  },

  // Get AI suggestions
  getSuggestions: async (address: string): Promise<ApiResponse<{ suggestions: any[] }>> => {
    const response = await api.get(`/ai/suggestions/${address}`);
    return response.data;
  },

  // Check AI status
  getStatus: async (): Promise<ApiResponse<{ configured: boolean; available: boolean }>> => {
    const response = await api.get('/ai/status');
    return response.data;
  },
};

export default api;