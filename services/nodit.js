// services/nodit.js
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
    this.tokenCache = {};
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

      console.log(`[getTokenPricesByContracts] Fetching prices for ${contractAddresses.length} tokens`);
      
      const response = await this._callDataApi('/token/getTokenPricesByContracts', {
        contractAddresses: contractAddresses
      });

      if (!response || !response.items) {
        console.log('No token prices found via Nodit Data API');
        return {};
      }

      console.log(`[getTokenPricesByContracts] Found ${response.items.length} token prices via Nodit Data API`);
      
      const prices = {};
      response.items.forEach(token => {
        if (token.contractAddress && token.price) {
          prices[token.contractAddress.toLowerCase()] = parseFloat(token.price);
        }
      });
      
      return prices;
    } catch (error) {
      console.warn(`[getTokenPricesByContracts] Data API failed: ${error.message}`);
      
      // Fallback prices for common tokens when API fails
      const fallbackPrices = {
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 2300, // ETH
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 1, // USDC
        '0x4200000000000000000000000000000000000006': 2300, // WETH
        '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 1, // DAI
        '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22': 2300, // cbETH
        '0x236aa50979dbf4de0c0aa16b3c4c4b3b3b3b3b3b': 1, // USDbC
      };
      
      const prices = {};
      contractAddresses.forEach(address => {
        const normalizedAddress = address.toLowerCase();
        if (fallbackPrices[normalizedAddress]) {
          prices[normalizedAddress] = fallbackPrices[normalizedAddress];
        }
      });
      
      console.log(`[getTokenPricesByContracts] Using fallback prices for ${Object.keys(prices).length} tokens`);
      return prices;
    }
  }

  async getPortfolio(address) {
    console.log(`[getPortfolio] Fetching portfolio for address: ${address}`);
    await this._updateLoadingMessage('🔍 Fetching portfolio...\n(1/2) Discovering tokens...');

    try {
      const portfolio = [];
      
      // 1. Get native ETH balance
      const ethBalance = await this.getWalletBalance(address);
      if (ethBalance > 0.000001) {
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
        console.log(`[getPortfolio] Using Nodit Data API for token discovery`);
        const tokensResponse = await Promise.race([
          this._callDataApi('/token/getTokensOwnedByAccount', {
            accountAddress: address,
            rpp: 100, // Get up to 100 tokens
            page: 1
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Nodit API timeout')), 15000))
        ]);

        if (tokensResponse && tokensResponse.items && tokensResponse.items.length > 0) {
          console.log(`[getPortfolio] Nodit discovered ${tokensResponse.items.length} tokens`);
          
          tokensResponse.items.forEach(token => {
            const balance = parseFloat(this.web3.utils.fromWei(token.balance, token.contract.decimals));
            if (balance > 0.000001) {
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
        console.warn(`[getPortfolio] Nodit token discovery failed: ${noditError.message}`);
        
        // 3. Fallback: Check common tokens manually
        console.log(`[getPortfolio] Checking common tokens manually`);
        const commonTokenPromises = Object.entries(this.commonTokens).map(async ([address, token]) => {
          try {
            const balanceHex = await Promise.race([
              this._callNodeRpc('eth_call', [{
                to: address,
                data: '0x70a08231' + address.toLowerCase().replace('0x', '').padStart(64, '0')
              }, 'latest']),
              new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 10000))
            ]);
            
            if (balanceHex && balanceHex !== '0x' && balanceHex !== '0x0') {
              const balance = parseFloat(this.web3.utils.fromWei(balanceHex, token.decimals));
              if (balance > 0.000001) {
                return {
                  contractAddress: address,
                  name: token.name,
                  symbol: token.symbol,
                  balance: balance,
                  decimals: token.decimals,
                  discoveredBy: 'Manual Check'
                };
              }
            }
            return null;
          } catch (error) {
            return null;
          }
        });

        const commonTokenResults = await Promise.all(commonTokenPromises);
        const validCommonTokens = commonTokenResults.filter(token => token !== null);
        portfolio.push(...validCommonTokens);
      }
      
      await this._updateLoadingMessage('🔍 Fetching portfolio...\n(2/2) Getting token prices...');
      
      // 4. Get prices using Nodit Data API (no CoinGecko!)
      const tokenAddresses = portfolio.map(a => a.contractAddress);
      const prices = await this.getTokenPricesByContracts(tokenAddresses);

      let totalValue = 0;
      const portfolioAssets = portfolio.map(asset => {
        const price = prices[asset.contractAddress.toLowerCase()] || 0;
        const value = asset.balance * price;
        totalValue += value;
        
        return { ...asset, price, value };
      });

      // 5. Filter and sort by value
      const valuableAssets = portfolioAssets
        .filter(asset => asset.value > 0.01) // Show assets worth more than $0.01
        .sort((a, b) => b.value - a.value);
      
      console.log(`[getPortfolio] Finished. Total value: $${totalValue.toFixed(2)}`);
      console.log(`[getPortfolio] Valuable assets: ${valuableAssets.length}`);
      
      return {
        totalValue,
        assets: valuableAssets
      };
      
    } catch (error) {
      console.error('[getPortfolio] Error:', error.message);
      return { totalValue: 0, assets: [] };
    }
  }

  async getTokenTransfers(address) {
    try {
      console.log(`[getTokenTransfers] Fetching transfers for: ${address}`);
      
      // Use Nodit Data API for token transfers
      const response = await this._callDataApi('/token/getTokenTransfersByAccount', {
        accountAddress: address,
        rpp: 50 // Get up to 50 transfers (we'll take last 10)
      });

      if (!response || !response.items) {
        console.log('[getTokenTransfers] No transfers found via Nodit Data API');
        return [];
      }

      console.log(`[getTokenTransfers] Nodit found ${response.items.length} transfers`);
      
      const transfers = response.items
        .filter(tx => tx.from.toLowerCase() === address.toLowerCase() || tx.to.toLowerCase() === address.toLowerCase())
        .map(transfer => {
          // Redundant, explicit check to ensure data integrity.
          if (transfer.from.toLowerCase() !== address.toLowerCase() && transfer.to.toLowerCase() !== address.toLowerCase()) {
            return null;
          }
          return {
            hash: transfer.transactionHash,
            direction: transfer.from.toLowerCase() === address.toLowerCase() ? 'OUT' : 'IN',
            value: (parseFloat(transfer.value) / Math.pow(10, transfer.contract.decimals || 18)).toFixed(6),
            tokenSymbol: transfer.contract.symbol || 'TOKEN',
            tokenName: transfer.contract.name || 'Unknown Token',
            tokenAddress: transfer.contract.address,
            from: transfer.from,
            to: transfer.to,
            timestamp: new Date(transfer.timestamp * 1000).toLocaleString(),
            type: 'token',
            blockNumber: transfer.blockNumber
          }
        }).filter(Boolean); // Remove null entries that failed the check

      // Return last 10 transfers (not last 10 days!)
      return transfers
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
      
    } catch (error) {
      console.error('[getTokenTransfers] Error:', error.message);
      return [];
    }
  }

  async getNativeTransactions(address) {
    try {
      console.log(`[getNativeTransactions] Fetching native transactions for: ${address}`);
      
      // Use Nodit Data API for native transactions
      const response = await this._callDataApi('/blockchain/getTransactionsByAccount', {
        accountAddress: address,
        rpp: 50 // Get up to 50 transactions (we'll take last 10)
      });

      if (!response || !response.items) {
        console.log('[getNativeTransactions] No native transactions found via Nodit Data API');
        return [];
      }

      console.log(`[getNativeTransactions] Nodit found ${response.items.length} native transactions`);
      
      const transactions = response.items
        .filter(tx => tx.value && parseFloat(tx.value) > 0.0001 && (tx.from.toLowerCase() === address.toLowerCase() || tx.to.toLowerCase() === address.toLowerCase()))
        .map(tx => {
          // Redundant, explicit check to ensure data integrity.
          if (tx.from.toLowerCase() !== address.toLowerCase() && tx.to.toLowerCase() !== address.toLowerCase()) {
            return null;
          }
          return {
            hash: tx.transactionHash,
            direction: tx.from.toLowerCase() === address.toLowerCase() ? 'OUT' : 'IN',
            value: parseFloat(this.web3.utils.fromWei(tx.value, 'ether')).toFixed(6),
            tokenSymbol: 'ETH',
            tokenName: 'Ethereum',
            from: tx.from,
            to: tx.to,
            timestamp: new Date(tx.timestamp * 1000).toLocaleString(),
            type: 'native',
            blockNumber: tx.blockNumber
          }
        }).filter(Boolean); // Remove any null entries that failed the check

      // Return last 10 transactions (not last 10 days!)
      return transactions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
      
    } catch (error) {
      console.error('[getNativeTransactions] Error:', error.message);
      return [];
    }
  }

  _updateLoadingMessage = async (text) => {}; 
  
  setLoadingCallback(callback) {
    this._updateLoadingMessage = callback;
  }

  async getTransactionsByAddress(address, days = 7) {
    try {
      console.log(`[getTransactionsByAddress] Fetching transactions for ${address}`);
      return await this.getNativeTransactions(address);
    } catch (error) {
      console.warn(`[getTransactionsByAddress] Failed: ${error.message}`);
      return [];
    }
  }

  async getTokenTransfersByAddress(address, days = 7) {
    try {
      console.log(`[getTokenTransfersByAddress] Fetching token transfers for ${address}`);
      return await this.getTokenTransfers(address);
    } catch (error) {
      console.warn(`[getTokenTransfersByAddress] Failed: ${error.message}`);
      return [];
    }
  }

  async getWalletInsights(address, days = 7) {
    try {
      console.log(`[getWalletInsights] Getting comprehensive insights for ${address}`);
      
      // Fetch all data in parallel with proper error handling
      const [transactions, tokenTransfers, portfolio] = await Promise.allSettled([
        this.getTransactionsByAddress(address, days),
        this.getTokenTransfersByAddress(address, days),
        this.getPortfolio(address)
      ]);

      const allTransactions = transactions.status === 'fulfilled' ? transactions.value : [];
      const allTokenTransfers = tokenTransfers.status === 'fulfilled' ? tokenTransfers.value : [];
      const walletPortfolio = portfolio.status === 'fulfilled' ? portfolio.value : { totalValue: 0, assets: [] };

      const allActivity = [...allTransactions, ...allTokenTransfers]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Calculate insights, ensuring Net Flow is ONLY for native ETH
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
          recentActivity: allActivity.slice(0, 10)
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
          recentActivity: []
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
        transactions: matchingTransactions.slice(0, 5)
      };
      
    } catch (error) {
      console.error('[searchTransactions] Error:', error.message);
      return { query, message: 'Search failed. Please try again.' };
    }
  }
}

module.exports = new NoditService();
