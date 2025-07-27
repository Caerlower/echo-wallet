# EchoWallet Frontend

A modern React + TypeScript frontend for EchoWallet with a ChatGPT-like interface.

## Features

- 🎨 **Modern UI**: ChatGPT-inspired interface with smooth animations
- 🌙 **Dark/Light Theme**: Easily switchable themes
- 📱 **Responsive Design**: Mobile-friendly interface
- 🔗 **Wallet Integration**: MetaMask connection with Base chain support
- 💬 **Chat Interface**: Natural language interaction with wallet data
- ⚡ **Real-time Updates**: Live data from blockchain
- 🎭 **Smooth Animations**: Framer Motion powered transitions

## Tech Stack

- **React 18** with TypeScript
- **Framer Motion** for animations
- **TailwindCSS** for styling
- **Lucide React** for icons
- **Axios** for API calls
- **React Markdown** for message formatting

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   ```
   Update the API URL if needed.

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # App header with wallet status
│   ├── ChatContainer.tsx # Main chat interface
│   ├── MessageBubble.tsx # Individual message component
│   ├── ChatInput.tsx   # Message input component
│   ├── QuickActions.tsx # Quick action buttons
│   ├── WalletStatus.tsx # Wallet connection status
│   ├── WalletModal.tsx # Wallet connection modal
│   ├── FloatingActionButton.tsx # FAB for settings
│   └── TypingIndicator.tsx # Typing animation
├── hooks/              # Custom React hooks
│   ├── useWallet.ts    # Wallet connection logic
│   └── useChat.ts      # Chat state management
├── services/           # API services
│   └── api.ts          # API client and endpoints
├── types/              # TypeScript type definitions
│   └── index.ts        # Shared types
├── App.tsx             # Main app component
├── index.tsx           # App entry point
└── index.css           # Global styles
```

## Key Components

### ChatContainer
The main chat interface that handles message display and user input.

### MessageBubble
Individual message component with support for user/assistant messages and markdown rendering.

### WalletStatus
Displays wallet connection status and provides connection/disconnection functionality.

### Header
Fixed header with app branding, wallet status, and theme toggle.

### FloatingActionButton
Floating action button for quick access to wallet settings and other actions.

## Styling

The app uses TailwindCSS with custom utility classes:

- `.glass` - Glass morphism effect
- `.btn-primary` - Primary button styling
- `.btn-secondary` - Secondary button styling
- `.input-field` - Input field styling
- `.message-bubble` - Message bubble base styling

## Animations

Smooth animations are implemented using Framer Motion:

- Page transitions
- Message animations
- Button hover effects
- Modal animations
- Loading states

## Wallet Integration

The app integrates with MetaMask for wallet connectivity:

- Automatic network switching to Base chain
- Balance display
- Address management
- Secure connection handling

## API Integration

The frontend communicates with the EchoWallet backend through:

- Wallet API endpoints
- Chat processing endpoints
- AI analysis endpoints
- Real-time data fetching

## Responsive Design

The interface is fully responsive with:

- Mobile-first approach
- Flexible layouts
- Touch-friendly interactions
- Optimized for all screen sizes

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Environment Variables

- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:3001/api)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.