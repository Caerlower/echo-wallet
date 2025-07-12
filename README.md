# 🤖 EchoWallet - AI-Powered Blockchain Assistant

EchoWallet is a comprehensive blockchain wallet assistant that provides detailed insights into wallets on the **Base blockchain**. It's available as both a **Telegram Bot** and a **Modern Web App**.

![image](https://github.com/user-attachments/assets/85777b0b-0266-482f-8c79-ad04c8b00986)
<img width="937" alt="Screenshot 2025-06-22 at 4 04 56 PM" src="https://github.com/user-attachments/assets/ad7de994-8db4-4702-b832-b1f2abd84580" />

## 📱 **Two Ways to Use EchoWallet**

### 🌐 **Web App** (Recommended)
- **Modern chat-based interface**
- **Wallet connection support**
- **Real-time portfolio tracking**
- **Beautiful, responsive UI**
- **AI-powered insights**

### 📱 **Telegram Bot**
- **Simple chat interface**
- **Quick wallet analysis**
- **Portfolio overview**
- **Transaction history**

## 🚀 **Quick Start**

### **Web App** (New!)
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

### 🤖 **AI Integration**
- **Perplexity AI**: Human-readable wallet analysis
- **Pattern Recognition**: Activity patterns and risk assessment
- **Conversational Interface**: Natural language queries
- **Contextual Suggestions**: Smart recommendations

### 🔗 **Blockchain Integration**
- **Nodit APIs**: Comprehensive blockchain data
- **Base Chain**: Full Base mainnet support
- **Multi-Token**: ETH and ERC-20 tokens
- **ENS Support**: Ethereum Name Service

## 🏗️ **Architecture**

### **Web App** (`/webapp`)
```
webapp/
├── backend/          # Express.js API server
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic
│   └── server.js     # Main server
└── frontend/         # Next.js React app
    ├── components/   # React components
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
- **Transaction Monitoring**: Recent activity tracking
- **AI Insights**: Intelligent wallet analysis
- **Search Capabilities**: Find specific transactions
- **ENS Support**: Easy address resolution

### **For Developers**
- **Clean Architecture**: Modular, maintainable code
- **API-First Design**: RESTful endpoints
- **Real-time Features**: WebSocket support
- **Modern Stack**: React, Next.js, Express
- **Comprehensive Documentation**: Detailed guides

## 🎨 **User Experience**

### **Web App Features**
- **Modern UI**: Glass morphism design
- **Responsive**: Works on all devices
- **Real-time**: Live data updates
- **Interactive**: Chat-based interface
- **Wallet Connect**: Easy wallet integration

### **Telegram Bot Features**
- **Simple Commands**: Easy to use
- **Quick Responses**: Fast data retrieval
- **Portable**: Works anywhere Telegram is available
- **No Installation**: Just start chatting

## 🔒 **Security & Privacy**

- **Read-Only Access**: No private key storage
- **Secure APIs**: Rate limiting and validation
- **CORS Protection**: Secure cross-origin requests
- **Error Handling**: Graceful failure management
- **Data Privacy**: Minimal data collection

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+
- Nodit API key
- Perplexity AI key (optional)
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
- **[API Reference](webapp/backend/README.md)**: Backend API documentation
- **[Telegram Bot Guide](TelegramBot/README.md)**: Bot usage guide

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
- [ ] WalletConnect v2 integration
- [ ] Mobile app version
- [ ] Advanced analytics dashboard
- [ ] Multi-chain support
- [ ] NFT tracking

### **Bot Improvements**
- [ ] More commands
- [ ] Enhanced AI responses
- [ ] Group chat support
- [ ] Custom notifications

---

**Built with ❤️ for the Base ecosystem**

*Choose your preferred interface and start exploring your wallet data with AI-powered insights!*
