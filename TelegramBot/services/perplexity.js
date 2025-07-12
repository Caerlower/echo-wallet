const axios = require('axios');
require('dotenv').config();

class PerplexityService {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseURL = 'https://api.perplexity.ai';
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async queryWallet(walletAddress, transactions, portfolio) {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }
    try {
      const transactionSummary = this._prepareTransactionSummary(transactions);
      // Prepare a summary of the top 3 assets
      let assetSummary = 'No assets found.';
      if (portfolio && portfolio.assets && portfolio.assets.length > 0) {
        assetSummary = portfolio.assets.slice(0, 3).map(a => `${a.balance.toFixed(4)} ${a.symbol} ($${a.value.toFixed(2)})`).join(', ');
      }
      const prompt = `
Analyze the following Base chain wallet activity and provide insights.

**Wallet Address:** ${walletAddress}
**Top Assets:** ${assetSummary}
**Total Portfolio Value:** $${portfolio?.totalValue?.toFixed(2) || 0}

**Recent Transactions:**
${transactionSummary}

Please provide the following, using bolding for titles (e.g., *Summary*) and bullet points for lists (using '-'):
1.  *Summary:* A brief overview of the wallet's recent activity.
2.  *Patterns:* Any notable patterns or trends (e.g., frequent trades, stablecoin usage).
3.  *Risk Assessment:* Note any suspicious activity or risks. If none, say so.
4.  *Suggestions:* Actionable suggestions for the user.

Keep the response concise and friendly. Use emojis to make it engaging, but do not use any other markdown formatting like headers (#).`;
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          { role: 'system', content: 'You are EchoWallet, a helpful AI assistant for Base blockchain wallet analysis. Provide clear, concise insights about wallet activity. Be friendly and use emojis appropriately.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: this.headers,
        timeout: 30000
      });
      if (response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('Invalid response from Perplexity API');
      }
    } catch (error) {
      console.error('[PERPLEXITY API ERROR]', error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new Error('Perplexity API key is invalid');
      } else if (error.response?.status === 429) {
        throw new Error('Perplexity API rate limit exceeded');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Perplexity API request timeout');
      } else {
        throw new Error('AI analysis temporarily unavailable');
      }
    }
  }

  async explainTransaction(transaction) {
    if (!this.apiKey) return null;
    try {
      const prompt = `Explain this blockchain transaction in simple terms:\n\nTransaction Hash: ${transaction.hash}\nType: ${transaction.type}\nDirection: ${transaction.direction}\nAmount: ${transaction.value} ${transaction.tokenSymbol}\nFrom: ${transaction.from}\nTo: ${transaction.to}\nTimestamp: ${transaction.timestamp}\n\nPlease provide:\n1. What happened in this transaction\n2. What it means for the wallet owner\n3. Any important details to note\n\nKeep it simple and user-friendly. Use emojis to make it engaging.`;
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          { role: 'system', content: 'You are a helpful blockchain transaction explainer. Make complex transactions easy to understand for non-technical users.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      }, {
        headers: this.headers,
        timeout: 15000
      });
      if (response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content;
      } else {
        return null;
      }
    } catch (error) {
      console.error('[PERPLEXITY TRANSACTION EXPLANATION ERROR]', error.message);
      return null;
    }
  }

  async answerGeneralQuestion(question, walletContext = null) {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }
    try {
      let prompt = question;
      if (walletContext) {
        prompt = `Context: User is asking about their Base chain wallet activity.\nWallet Address: ${walletContext.address}\nCurrent Balance: ${walletContext.balance} ETH\n\nUser Question: ${question}\n\nPlease provide a helpful answer related to their wallet and Base chain. If the question is not wallet-related, provide a general helpful response.`;
      }
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          { role: 'system', content: 'You are EchoWallet, a helpful AI assistant for Base blockchain. Answer questions about wallets, transactions, and blockchain topics. Be friendly and informative.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.7
      }, {
        headers: this.headers,
        timeout: 20000
      });
      if (response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('Invalid response from Perplexity API');
      }
    } catch (error) {
      console.error('[PERPLEXITY GENERAL QUERY ERROR]', error.response?.data || error.message);
      throw new Error('AI assistant temporarily unavailable');
    }
  }

  _prepareTransactionSummary(transactions) {
    if (!transactions || transactions.length === 0) {
      return 'No recent transactions found.';
    }
    const summary = transactions.slice(0, 10).map(tx => {
      const direction = tx.direction === 'IN' ? '📥' : '📤';
      const type = tx.type === 'native' ? 'ETH' : tx.tokenSymbol;
      return `${direction} ${tx.value} ${type} (${tx.timestamp})`;
    }).join('\n');
    return summary;
  }

  isConfigured() {
    return !!this.apiKey;
  }
}

module.exports = new PerplexityService(); 