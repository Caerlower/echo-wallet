# 🤖 EchoWallet - AI-Powered Blockchain Assistant with Real-Time Monitoring

EchoWallet is a comprehensive blockchain wallet assistant that provides detailed insights into wallets on the **Base blockchain** with **real-time transaction monitoring and alerts**. It's available as both a **Telegram Bot** and a **Modern Web App**.

## 🚨 **NEW: Real-Time Transaction Monitoring**

EchoWallet now features **instant transaction monitoring** with Telegram alerts:

- ⚡ **Real-time webhook-based monitoring** (no polling delays)
- 🔔 **Instant Telegram notifications** for new transactions
- 🎯 **Customizable alerts** (amount thresholds, token types, transaction types)
- 📊 **Smart filtering** (incoming/outgoing, specific tokens, minimum amounts)
- 🔄 **Automatic monitoring** (starts immediately, runs continuously)

## 📱 **Two Ways to Use EchoWallet**

### 🌐 **Web App** (Recommended)
- **Modern chat-based interface**
- **Wallet connection support**
- **Real-time portfolio tracking**
- **Transaction monitoring dashboard**
- **Beautiful, responsive UI**
- **AI-powered insights**

### 📱 **Telegram Bot**
- **Simple chat interface**
- **Quick wallet analysis**
- **Portfolio overview**
- **Transaction history**
- **Real-time monitoring alerts**

## 🚀 **Quick Start**

### **Web App** (Recommended)
```bash
# Navigate to web app
cd webapp

# Start backend
cd backend && npm install && npm run dev

# Start frontend (new terminal)
cd frontend && npm install && npm run dev

# Open http://localhost:3000
```

### **Telegram Bot** (Legacy)
```bash
# Navigate to Telegram bot
cd TelegramBot

# Install dependencies
npm install

# Configure environment
cp env.example .env
# Add your API keys

# Start the bot
npm start
```

## ✨ **Features**

### 🎯 **Core Capabilities**
- **Portfolio Analysis**: Total USD values, asset breakdowns
- **Transaction History**: Native ETH and token transfers
- **ENS Resolution**: Support for ENS names
- **AI-Powered Insights**: Intelligent wallet analysis
- **Real-time Data**: Live blockchain data via Nodit APIs
- **Search Functionality**: Find specific transactions

### 🚨 **Real-Time Monitoring**
- **Webhook-Based Alerts**: Instant transaction notifications
- **Custom Alert Rules**: Amount thresholds, token types, transaction directions
- **Telegram Integration**: Direct notifications to your chat
- **Smart Filtering**: Only relevant transactions trigger alerts
- **Automatic Setup**: Easy webhook configuration
- **Multiple Wallets**: Monitor multiple addresses simultaneously

### 🤖 **AI Integration**
- **Perplexity AI**: Human-readable wallet analysis
- **Pattern Recognition**: Activity patterns and risk assessment
- **Conversational Interface**: Natural language queries
- **Contextual Suggestions**: Smart recommendations

### 🔗 **Blockchain Integration**
- **Nodit APIs**: Comprehensive blockchain data
- **Nodit Webhooks**: Real-time transaction notifications
- **Base Chain**: Full Base mainnet support
- **Multi-Token**: ETH and ERC-20 tokens
- **ENS Support**: Ethereum Name Service

## 🏗️ **Architecture**

### **Web App** (`/webapp`)
```
webapp/
├── backend/          # Express.js API server
│   ├── routes/       # API endpoints
│   │   ├── webhook.js              # Webhook receiver
│   │   ├── webhook-monitoring.js   # Monitoring management
│   │   ├── monitoring.js           # Legacy polling system
│   │   └── ...
│   ├── services/     # Business logic
│   │   ├── webhook-monitoring.js   # Real-time monitoring
│   │   ├── monitoring.js           # Legacy polling
│   │   └── ...
│   └── server.js     # Main server
└── frontend/         # Next.js React app
    ├── components/   # React components
    │   ├── MonitoringPanel.js      # Monitoring dashboard
    │   └── ...
    ├── pages/        # Next.js pages
    └── styles/       # CSS and styling
```

### **Telegram Bot** (`/TelegramBot`)
```
TelegramBot/
├── bot/             # Telegram bot logic
├── services/        # API services
└── index.js         # Bot entry point
```

## 🔧 **API Integration**

### **Primary APIs**
- **Nodit Data API**: Portfolio and transaction data
- **Nodit Webhook API**: Real-time transaction notifications
- **Nodit Node RPC**: Direct blockchain interactions
- **Perplexity AI**: Intelligent analysis
- **ENS**: Address resolution

### **No External Dependencies**
- ✅ **Nodit Only**: All blockchain data from Nodit
- ✅ **No CoinGecko**: Token prices from Nodit
- ✅ **No Etherscan**: Transaction data from Nodit
- ✅ **Self-Contained**: Minimal external dependencies

## 📊 **What EchoWallet Provides**

### **For Users**
- **Portfolio Overview**: Total value and asset breakdown
- **Transaction Monitoring**: Real-time activity tracking with alerts
- **AI Insights**: Intelligent wallet analysis
- **Search Capabilities**: Find specific transactions
- **ENS Support**: Easy address resolution
- **Custom Alerts**: Personalized notification rules

### **For Developers**
- **Clean Architecture**: Modular, maintainable code
- **API-First Design**: RESTful endpoints
- **Real-time Features**: WebSocket and webhook support
- **Modern Stack**: React, Next.js, Express
- **Comprehensive Documentation**: Detailed guides
- **Webhook System**: Scalable real-time monitoring

## 🎨 **User Experience**

### **Web App Features**
- **Modern UI**: Glass morphism design
- **Responsive**: Works on all devices
- **Real-time**: Live data updates
- **Interactive**: Chat-based interface
- **Wallet Connect**: Easy wallet integration
- **Monitoring Dashboard**: Real-time alert management

### **Telegram Bot Features**
- **Simple Commands**: Easy to use
- **Quick Responses**: Fast data retrieval
- **Portable**: Works anywhere Telegram is available
- **No Installation**: Just start chatting
- **Real-time Alerts**: Instant transaction notifications

## 🔒 **Security & Privacy**

- **Read-Only Access**: No private key storage
- **Secure APIs**: Rate limiting and validation
- **CORS Protection**: Secure cross-origin requests
- **Error Handling**: Graceful failure management
- **Data Privacy**: Minimal data collection
- **Webhook Security**: Validated webhook endpoints

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+
- Nodit API key
- Perplexity AI key (optional)
- Telegram Bot token (for monitoring alerts)
- MetaMask or compatible wallet (for web app)

### **Environment Setup**
```env
# Required
NODIT_API_KEY=your_nodit_api_key

# Optional
PERPLEXITY_API_KEY=your_perplexity_key
TELEGRAM_BOT_TOKEN=your_telegram_token
```

## 📚 **Documentation**

- **[Web App Guide](webapp/README.md)**: Complete web app documentation

## 🔧 **Monitoring API Endpoints**

### **Start Monitoring**
```bash
POST /api/webhook-monitoring/start/:address
{
  "chatId": "YOUR_TELEGRAM_CHAT_ID",
  "alerts": [
    {
      "type": "incoming_funds",
      "token": "USDC",
      "amount": "0.1"
    }
  ]
}
```

### **Stop Monitoring**
```bash
POST /api/webhook-monitoring/stop/:address
```

### **Check Status**
```bash
GET /api/webhook-monitoring/status/:address
```

### **Test Notification**
```bash
POST /api/webhook-monitoring/test-notification
{
  "chatId": "YOUR_TELEGRAM_CHAT_ID",
  "message": "Test message"
}
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is licensed under the ISC License.

## 🆘 **Support**

- **Documentation**: Check the README files
- **Issues**: Report bugs on GitHub
- **Questions**: Open a discussion

## 🔮 **Roadmap**

### **Web App Enhancements**
- [x] Real-time transaction monitoring
- [x] Webhook-based alerts
- [x] Telegram integration
- [ ] WalletConnect v2 integration
- [ ] Mobile app version
- [ ] Advanced analytics dashboard
- [ ] Multi-chain support
- [ ] NFT tracking

### **Bot Improvements**
- [x] Real-time monitoring alerts
- [ ] More commands
- [ ] Enhanced AI responses
- [ ] Group chat support
- [ ] Custom notifications

---

**Built with ❤️ for the Base ecosystem**

*Choose your preferred interface and start exploring your wallet data with AI-powered insights and real-time monitoring!*
