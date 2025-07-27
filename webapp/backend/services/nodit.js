require('dotenv').config();
const axios = require('axios');
const { Web3 } = require('web3');

class NoditService {
  constructor() {
    this.nodeRpcUrl = process.env.BASE_RPC_URL || 'https://base-mainnet.nodit.io/';
    this.dataApiUrl = 'https://web3.nodit.io/v1/base/mainnet';

    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-KEY': process.env.NODIT_API_KEY
    };
    
    this.web3 = new Web3();
    this.apiCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    
    // Common Base chain tokens
    this.commonTokens = {
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {symbol: 'USDC', decimals: 6, name: 'USD Coin'},
      '0x4200000000000000000000000000000000000006': {symbol: 'WETH', decimals: 18, name: 'Wrapped Ether'},
      '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': {symbol: 'DAI', decimals: 18, name: 'Dai Stablecoin'},
      '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22': {symbol: 'cbETH', decimals: 18, name: 'Coinbase Wrapped Staked ETH'},
      '0x236aa50979dbf4de0c0aa16b3c4c4b3b3b3b3b3b': {symbol: 'USDbC', decimals: 6, name: 'USD Base Coin'}
    };

    this.fallbackPrices = {
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 2300, // ETH
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 1, // USDC
      '0x4200000000000000000000000000000000000006': 2300, // WETH
      '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 1, // DAI
      '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22': 2300, // cbETH
      '0x236aa50979dbf4de0c0aa16b3c4c4b3b3b3b3b3b': 1, // USDbC
      // Add USDT if on Base, or any other major tokens you want
    };
  }

  async _callNodeRpc(method, params) {
    try {
      const response = await axios.post(this.nodeRpcUrl, {
        id: 1, jsonrpc: "2.0", method, params
      }, { headers: this.headers, timeout: 15000 });
      
      if (response.data.error) {
        throw new Error(`RPC error: ${response.data.error.message}`);
      }
      return response.data.result;
    } catch (error) {
      console.error(`[Node RPC ERROR: ${method}]`, error.message);
      throw new Error('Blockchain node service temporarily unavailable.');
    }
  }

  async _callDataApi(endpoint, data) {
    try {
      const cacheKey = `${endpoint}:${JSON.stringify(data)}`;
      
      // Check cache first
      const cached = this.apiCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        console.log(`[Data API CACHE] Using cached response for ${endpoint}`);
        return cached.data;
      }
      
      // Add small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const response = await axios.post(`${this.dataApiUrl}${endpoint}`, data, {
        headers: this.headers, timeout: 15000
      });
      
      // Cache the response
      this.apiCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      
      return response.data;
    } catch (error) {
      console.error(`[Data API ERROR: ${endpoint}]`, error.response?.data?.message || error.message);
      throw new Error('Blockchain data service temporarily unavailable.');
    }
  }

  async getWalletBalance(address) {
    try {
      const balanceWei = await this._callNodeRpc('eth_getBalance', [address, 'latest']);
      return parseFloat(this.web3.utils.fromWei(balanceWei, 'ether'));
    } catch (error) {
      console.error('[getWalletBalance] Error:', error.message);
      return 0;
    }
  }

  async getTokenPricesByContracts(contractAddresses) {
    try {
      if (!Array.isArray(contractAddresses)) {
        contractAddresses = [contractAddresses];
      }
      const response = await this._callDataApi('/token/getTokenPricesByContracts', {
        contractAddresses: contractAddresses
      });
      if (!response || !response.items) {
        return {};
      }
      const prices = {};
      response.items.forEach(token => {
        if (token.contractAddress && token.price) {
          prices[token.contractAddress.toLowerCase()] = parseFloat(token.price);
        }
      });
      return prices;
    } catch (error) {
      // Fallback prices for major tokens
      const prices = {};
      contractAddresses.forEach(address => {
        const normalizedAddress = address.toLowerCase();
        if (this.fallbackPrices[normalizedAddress]) {
          prices[normalizedAddress] = this.fallbackPrices[normalizedAddress];
        }
      });
      return prices;
    }
  }

  async getPortfolio(address) {
    console.log(`[getPortfolio] Fetching portfolio for address: ${address}`);
    try {
      let portfolio = [];
      // 1. Get native ETH balance
      const ethBalance = await this.getWalletBalance(address);
      if (ethBalance > 0) { // Show any ETH balance, even very small amounts
        portfolio.push({
          contractAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          name: 'Ethereum',
          symbol: 'ETH',
          balance: ethBalance,
          decimals: 18
        });
      }
      // 2. Use Nodit Data API for token discovery
      try {
        let allTokens = [];
        let page = 1;
        let hasMore = true;
        
        // Fetch all tokens across multiple pages
        while (hasMore && page <= 5) { // Limit to 5 pages to prevent infinite loops
          const tokensResponse = await Promise.race([
            this._callDataApi('/token/getTokensOwnedByAccount', {
              accountAddress: address,
              rpp: 100,
              page: page
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Nodit API timeout')), 15000))
          ]);
          
          if (tokensResponse && tokensResponse.items && tokensResponse.items.length > 0) {
            allTokens = allTokens.concat(tokensResponse.items);
            hasMore = tokensResponse.items.length === 100; // If we got less than 100, we've reached the end
            page++;
          } else {
            hasMore = false;
          }
        }
        
        // Process all found tokens
        if (allTokens.length > 0) {
          allTokens.forEach(token => {
            const balance = parseFloat(this.web3.utils.fromWei(token.balance, token.contract.decimals));
            if (balance > 0) { // Show any token balance, even very small amounts
              portfolio.push({
                contractAddress: token.contract.address,
                name: token.contract.name || 'Unknown Token',
                symbol: token.contract.symbol || 'TOKEN',
                balance: balance,
                decimals: token.contract.decimals,
                discoveredBy: 'Nodit Data API'
              });
            }
          });
        }
      } catch (noditError) {
        console.error('[getPortfolio] Nodit API error:', noditError.message);
        // Continue with what we have (ETH balance)
      }
      // 3. Get prices for all tokens
      if (portfolio.length > 0) {
        const tokenAddresses = portfolio.map(token => token.contractAddress);
        const prices = await this.getTokenPricesByContracts(tokenAddresses);
        // Calculate USD values
        portfolio.forEach(token => {
          const price = prices[token.contractAddress.toLowerCase()] || 0;
          token.price = price;
          token.value = token.balance * price;
        });
        // Keep all tokens, even those without price data (show value as 0)
        portfolio.forEach(token => {
          if (!token.price || token.price === 0) {
            token.price = 0;
            token.value = 0;
          }
        });
        // Sort by USD value (highest first)
        portfolio.sort((a, b) => (b.value || 0) - (a.value || 0));
        // Calculate total portfolio value
        const totalValue = portfolio.reduce((sum, token) => sum + (token.value || 0), 0);
        return {
          totalValue,
          assets: portfolio,
          tokenCount: portfolio.length
        };
      }
      return {
        totalValue: 0,
        assets: [],
        tokenCount: 0
      };
    } catch (error) {
      return {
        totalValue: 0,
        assets: [],
        tokenCount: 0
      };
    }
  }

  async getTokenTransfers(address, limit = 50) {
    try {
      const response = await this._callDataApi('/token/getTokenTransfersByAccount', {
        accountAddress: address,
        rpp: limit
      });
      if (!response || !response.items) {
        return [];
      }
      // Only show transfers for tokens with a fallback price (major tokens)
      return response.items
        .filter(tx => this.fallbackPrices[tx.contract.address.toLowerCase()])
        .filter(tx => tx.from.toLowerCase() === address.toLowerCase() || tx.to.toLowerCase() === address.toLowerCase())
        .map(transfer => ({
          hash: transfer.transactionHash,
          direction: transfer.from.toLowerCase() === address.toLowerCase() ? 'OUT' : 'IN',
          value: (parseFloat(transfer.value) / Math.pow(10, transfer.contract.decimals || 18)).toFixed(6),
          tokenSymbol: transfer.contract.symbol || 'TOKEN',
          tokenName: transfer.contract.name || 'Unknown Token',
          tokenAddress: transfer.contract.address,
          from: transfer.from,
          to: transfer.to,
          timestamp: new Date(transfer.timestamp * 1000).toISOString(),
          type: 'token',
          blockNumber: transfer.blockNumber
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      return [];
    }
  }

  async getNativeTransactions(address, limit = 50) {
    try {
      console.log(`[getNativeTransactions] Fetching native transactions for: ${address}`);
      
      const response = await this._callDataApi('/blockchain/getTransactionsByAccount', {
        accountAddress: address,
        rpp: limit
      });

      if (!response || !response.items) {
        console.log('[getNativeTransactions] No native transactions found via Nodit Data API');
        return [];
      }

      console.log(`[getNativeTransactions] Nodit found ${response.items.length} native transactions`);
      
      const transactions = response.items
        .filter(tx => tx.value && parseFloat(tx.value) > 0.0001 && (tx.from.toLowerCase() === address.toLowerCase() || tx.to.toLowerCase() === address.toLowerCase()))
        .map(tx => ({
          hash: tx.transactionHash,
          direction: tx.from.toLowerCase() === address.toLowerCase() ? 'OUT' : 'IN',
          value: parseFloat(this.web3.utils.fromWei(tx.value, 'ether')).toFixed(6),
          tokenSymbol: 'ETH',
          tokenName: 'Ethereum',
          from: tx.from,
          to: tx.to,
          timestamp: new Date(tx.timestamp * 1000).toISOString(),
          type: 'native',
          blockNumber: tx.blockNumber
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return transactions;
      
    } catch (error) {
      console.error('[getNativeTransactions] Error:', error.message);
      return [];
    }
  }

  async getWalletInsights(address, days = 30) {
    try {
      console.log(`[getWalletInsights] Getting comprehensive insights for ${address}`);
      
      // Fetch all data in parallel
      const [transactions, tokenTransfers, portfolio] = await Promise.allSettled([
        this.getNativeTransactions(address, 100),
        this.getTokenTransfers(address, 100),
        this.getPortfolio(address)
      ]);

      const allTransactions = transactions.status === 'fulfilled' ? transactions.value : [];
      const allTokenTransfers = tokenTransfers.status === 'fulfilled' ? tokenTransfers.value : [];
      const walletPortfolio = portfolio.status === 'fulfilled' ? portfolio.value : { totalValue: 0, assets: [] };

      const allActivity = [...allTransactions, ...allTokenTransfers]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Calculate insights
      const nativeETHActivity = allActivity.filter(tx => tx.type === 'native');
      
      const totalIncomingETH = nativeETHActivity
        .filter(tx => tx.direction === 'IN')
        .reduce((sum, tx) => sum + parseFloat(tx.value || 0), 0);
      
      const totalOutgoingETH = nativeETHActivity
        .filter(tx => tx.direction === 'OUT')
        .reduce((sum, tx) => sum + parseFloat(tx.value || 0), 0);

      const uniqueTokens = [...new Set(allTokenTransfers.map(tx => tx.tokenSymbol))];

      return {
        address,
        portfolio: walletPortfolio,
        activity: {
          totalTransactions: allActivity.length,
          nativeTransactions: allTransactions.length,
          tokenTransfers: allTokenTransfers.length,
          netFlowETH: (totalIncomingETH - totalOutgoingETH).toFixed(6),
          uniqueTokens: uniqueTokens.length,
          recentActivity: allActivity.slice(0, 20),
          totalIncomingETH: totalIncomingETH.toFixed(6),
          totalOutgoingETH: totalOutgoingETH.toFixed(6)
        }
      };
    } catch (error) {
      console.error(`[getWalletInsights] Error: ${error.message}`);
      return {
        address,
        portfolio: { totalValue: 0, assets: [] },
        activity: {
          totalTransactions: 0,
          nativeTransactions: 0,
          tokenTransfers: 0,
          netFlowETH: '0.000000',
          uniqueTokens: 0,
          recentActivity: [],
          totalIncomingETH: '0.000000',
          totalOutgoingETH: '0.000000'
        }
      };
    }
  }

  async searchTransactions(address, query) {
    try {
      console.log(`[searchTransactions] Searching transactions for ${address} with query: ${query}`);
      
      const insights = await this.getWalletInsights(address, 30);
      const allActivity = insights.activity.recentActivity;
      
      if (allActivity.length === 0) {
        return { query, message: 'No recent transactions found to search through.' };
      }
      
      const searchTerms = query.toLowerCase().split(' ');
      const matchingTransactions = allActivity.filter(tx => {
        const txText = `${tx.tokenSymbol} ${tx.tokenName} ${tx.direction} ${tx.value}`.toLowerCase();
        return searchTerms.some(term => txText.includes(term));
      });
      
      if (matchingTransactions.length === 0) {
        return { query, message: `No transactions found matching "${query}".` };
      }
      
      return {
        query,
        transactions: matchingTransactions.slice(0, 10)
      };
      
    } catch (error) {
      console.error('[searchTransactions] Error:', error.message);
      return { query, message: 'Search failed. Please try again.' };
    }
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache() {
    this.apiCache.clear();
    console.log('[NoditService] Cache cleared');
  }
}

module.exports = new NoditService(); 