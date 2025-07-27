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
    console.log('[PERPLEXITY] Starting wallet analysis...');
    console.log('[PERPLEXITY] API Key configured:', !!this.apiKey);
    
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

Please provide a comprehensive analysis with the following structure:

## Summary
- Brief overview of the wallet's current state and recent activity
- Key metrics and notable changes

## Patterns
- Transaction patterns and trends
- Asset usage patterns
- Behavioral insights

## Risk Assessment
- Any suspicious or risky activity
- Security considerations
- If no risks found, state "No significant risks detected"

## Suggestions
- Actionable recommendations
- Optimization opportunities
- Best practices

Keep the response concise, friendly, and well-structured. Use emojis appropriately to make it engaging. Format with proper markdown headers (##) and bullet points (-).`;
      console.log('[PERPLEXITY] Making API request...');
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'sonar-pro',
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
      console.log('[PERPLEXITY] API response received');
      if (response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('Invalid response from Perplexity API');
      }
    } catch (error) {
      console.error('[PERPLEXITY API ERROR]', error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new Error('Perplexity API key is invalid or not configured. Please check your .env file and ensure you have a valid API key from https://www.perplexity.ai/settings/api');
      } else if (error.response?.status === 429) {
        throw new Error('Perplexity API rate limit exceeded. Please try again later.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Perplexity API request timeout. Please check your internet connection and try again.');
      } else {
        throw new Error('AI analysis temporarily unavailable. Please check your API key and try again.');
      }
    }
  }

  async explainTransaction(transaction) {
    if (!this.apiKey) return null;
    try {
      const prompt = `Explain this blockchain transaction in simple terms:\n\nTransaction Hash: ${transaction.hash}\nType: ${transaction.type}\nDirection: ${transaction.direction}\nAmount: ${transaction.value} ${transaction.tokenSymbol}\nFrom: ${transaction.from}\nTo: ${transaction.to}\nTimestamp: ${transaction.timestamp}\n\nPlease provide:\n1. What happened in this transaction\n2. What it means for the wallet owner\n3. Any important details to note\n\nKeep it simple and user-friendly. Use emojis to make it engaging.`;
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'sonar-pro',
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
        prompt = `Context: User is asking about their Base chain wallet activity.
Wallet Address: ${walletContext.address}
Current Balance: ${walletContext.balance} ETH

User Question: ${question}

Please provide a helpful, well-structured answer. If the question is wallet-related, focus on their specific wallet and Base chain context. If not wallet-related, provide a general helpful response about blockchain topics.

Format your response with proper markdown structure, using headers (##) and bullet points (-) where appropriate. Keep it friendly and informative.`;
      }
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'sonar-pro',
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

  async analyzePortfolio(portfolio, address) {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }
    try {
      const assetSummary = portfolio.assets.map(a => 
        `${a.balance.toFixed(4)} ${a.symbol} ($${a.value.toFixed(2)})`
      ).join(', ');

      const prompt = `
Analyze this Base chain portfolio and provide insights:

**Wallet Address:** ${address}
**Total Portfolio Value:** $${portfolio.totalValue.toFixed(2)}
**Number of Assets:** ${portfolio.assets.length}

**Assets:**
${assetSummary}

Please provide a comprehensive portfolio analysis with the following structure:

## Portfolio Overview
- Summary of portfolio composition and value distribution
- Key metrics and performance indicators

## Asset Analysis
- Detailed analysis of major holdings
- Asset allocation insights
- Token performance observations

## Diversification Assessment
- Portfolio diversification analysis
- Risk distribution evaluation
- Concentration concerns (if any)

## Recommendations
- Optimization suggestions
- Risk management advice
- Strategic recommendations

Keep the analysis friendly, actionable, and well-structured. Use emojis appropriately and format with proper markdown headers (##) and bullet points (-).`;

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are EchoWallet, a helpful AI assistant for Base blockchain portfolio analysis. Provide clear, actionable insights about portfolio composition and optimization.' },
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
      console.error('[PERPLEXITY PORTFOLIO ANALYSIS ERROR]', error.response?.data || error.message);
      throw new Error('Portfolio analysis temporarily unavailable');
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