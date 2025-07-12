# 🤖 EchoWallet Web App

A modern, AI-powered blockchain wallet assistant for the Base chain, built with React, Next.js, and powered by Nodit APIs.

## ✨ Features

### 🎯 **Core Functionality**
- **Wallet Connection**: Connect with MetaMask and other popular wallets
- **Portfolio Analysis**: Real-time portfolio tracking with USD values
- **Transaction History**: Comprehensive transaction monitoring
- **AI-Powered Insights**: Intelligent wallet analysis using Perplexity AI
- **ENS Resolution**: Support for ENS names and addresses
- **Real-time Chat**: Interactive chat interface for wallet queries

### 🚀 **Key Capabilities**
- **Multi-Asset Support**: Native ETH and ERC-20 tokens
- **Smart Suggestions**: Context-aware quick actions
- **Search Functionality**: Find specific transactions and tokens
- **Responsive Design**: Beautiful UI that works on all devices
- **Real-time Updates**: Live data from Base blockchain

## 🏗️ Architecture

### **Frontend (Next.js)**
- **React 18** with modern hooks and patterns
- **Next.js 14** for optimal performance
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.IO** for real-time communication

### **Backend (Express.js)**
- **Express.js** server with RESTful APIs
- **Socket.IO** for real-time features
- **Nodit Integration** for blockchain data
- **Perplexity AI** for intelligent analysis
- **ENS Resolution** for address lookup

### **APIs Used**
- **Nodit Data API**: Portfolio and transaction data
- **Nodit Node RPC**: Direct blockchain interactions
- **Perplexity AI**: Intelligent wallet analysis
- **ENS**: Ethereum Name Service resolution

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or compatible wallet
- Nodit API key
- Perplexity AI API key (optional)

### Installation

1. **Clone and setup the project**
```bash
cd webapp
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure environment variables**

Backend (`.env`):
```env
PORT=3001
NODE_ENV=development
NODIT_API_KEY=your_nodit_api_key_here
BASE_RPC_URL=https://base-mainnet.nodit.io/
PERPLEXITY_API_KEY=your_perplexity_api_key_here
ETH_RPC_URL=https://cloudflare-eth.com
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:3000
```

Frontend (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

5. **Start the development servers**

Backend:
```bash
cd backend
npm run dev
```

Frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

6. **Open your browser**
Navigate to `http://localhost:3000`

## 📱 Usage

### **Connecting Your Wallet**
1. Click "Connect Wallet" in the header
2. Choose MetaMask (other wallets coming soon)
3. Approve the connection in your wallet
4. Switch to Base network if prompted

### **Using the Chat Interface**
- **Ask about your portfolio**: "Show my portfolio" or "What's my balance?"
- **Check transactions**: "Show recent transactions" or "Transaction history"
- **AI Analysis**: "Analyze my wallet" or "Get AI insights"
- **Search**: "Search for USDC transactions" or "Find ETH transfers"

### **Quick Actions**
The sidebar provides contextual suggestions based on your wallet:
- Portfolio overview
- Recent activity
- AI analysis
- Transaction search

## 🔧 API Endpoints

### **Wallet Routes**
- `GET /api/wallet/portfolio/:address` - Get portfolio data
- `GET /api/wallet/insights/:address` - Get comprehensive insights
- `GET /api/wallet/transactions/:address` - Get transaction history
- `POST /api/wallet/search/:address` - Search transactions
- `GET /api/wallet/balance/:address` - Get wallet balance

### **AI Routes**
- `POST /api/ai/analyze-wallet` - AI wallet analysis
- `POST /api/ai/analyze-portfolio` - AI portfolio analysis
- `POST /api/ai/explain-transaction` - Transaction explanation
- `POST /api/ai/ask` - General questions
- `GET /api/ai/suggestions/:address` - Get AI suggestions

### **Chat Routes**
- `POST /api/chat/process` - Process chat messages
- `GET /api/chat/suggestions` - Get chat suggestions

## 🎨 UI Components

### **Core Components**
- `ChatInterface` - Main chat functionality
- `WalletConnect` - Wallet connection modal
- `PortfolioCard` - Portfolio display
- `TransactionList` - Transaction history
- `SuggestionCard` - Quick action suggestions

### **Design Features**
- **Glass Morphism**: Modern translucent UI elements
- **Gradient Backgrounds**: Beautiful color schemes
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Layout**: Works on desktop and mobile
- **Dark Theme**: Optimized for dark environments

## 🔒 Security Features

- **CORS Protection**: Configured for secure cross-origin requests
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input sanitization
- **Error Handling**: Graceful error handling and user feedback
- **Wallet Security**: No private key storage, read-only access

## 🚀 Deployment

### **Backend Deployment**
```bash
cd backend
npm run build
npm start
```

### **Frontend Deployment**
```bash
cd frontend
npm run build
npm start
```

### **Environment Variables for Production**
Update the environment variables with production values:
- Use production API keys
- Set appropriate CORS origins
- Configure production database if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the API endpoints
- Test with the provided examples

## 🔮 Roadmap

### **Upcoming Features**
- [ ] WalletConnect v2 integration
- [ ] Coinbase Wallet support
- [ ] Mobile app version
- [ ] Advanced analytics dashboard
- [ ] Multi-chain support
- [ ] NFT tracking
- [ ] DeFi protocol integration
- [ ] Social features

### **Technical Improvements**
- [ ] WebSocket real-time updates
- [ ] Advanced caching strategies
- [ ] Performance optimizations
- [ ] Enhanced error handling
- [ ] Comprehensive testing suite

---

**Built with ❤️ for the Base ecosystem** 