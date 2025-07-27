export interface WalletData {
  address: string;
  ensName?: string;
  balance: string;
  isConnected: boolean;
}

export interface Portfolio {
  totalValue: number;
  assets: Asset[];
}

export interface Asset {
  contractAddress: string;
  name: string;
  symbol: string;
  balance: number;
  decimals: number;
  price?: number;
  value?: number;
}

export interface Transaction {
  hash: string;
  direction: 'IN' | 'OUT';
  value: string;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress?: string;
  from: string;
  to: string;
  timestamp: string;
  type: 'native' | 'token';
  blockNumber?: string;
}

export interface WalletInsights {
  address: string;
  portfolio: Portfolio;
  activity: {
    totalTransactions: number;
    nativeTransactions: number;
    tokenTransfers: number;
    netFlowETH: string;
    uniqueTokens: number;
    recentActivity: Transaction[];
  };
}

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
  loading?: boolean;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  isConnected: boolean;
  walletData?: WalletData;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}