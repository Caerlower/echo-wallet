import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import ChatContainer from './components/ChatContainer';
import WalletStatus from './components/WalletStatus';
import FloatingActionButton from './components/FloatingActionButton';
import WalletModal from './components/WalletModal';
import { useWallet } from './hooks/useWallet';
import { useChat } from './hooks/useChat';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showWalletStatus, setShowWalletStatus] = useState(false);

  const {
    walletData,
    isConnecting,
    error: walletError,
    connectWallet,
    disconnectWallet,
    isConnected,
  } = useWallet();

  const {
    messages,
    isTyping,
    sendMessage,
    sendQuickAction,
    clearChat,
  } = useChat(walletData?.address);

  // Apply theme class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleConnectWallet = async () => {
    setShowWalletModal(false);
    await connectWallet();
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    setShowWalletStatus(false);
    clearChat();
  };

  const handleOpenWalletSettings = () => {
    if (isConnected) {
      setShowWalletStatus(true);
    } else {
      setShowWalletModal(true);
    }
  };

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleOpenHelp = () => {
    sendMessage("How can I use EchoWallet? What features are available?");
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
    }`}>
      {/* Header */}
      <Header
        walletData={walletData}
        onConnectWallet={() => setShowWalletModal(true)}
        onOpenSettings={handleOpenWalletSettings}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content */}
      <main className="pt-16 h-screen flex">
        {/* Sidebar - Wallet Status */}
        <AnimatePresence>
          {showWalletStatus && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="w-80 p-4 border-r border-white/10"
            >
              <WalletStatus
                walletData={walletData}
                onConnect={() => setShowWalletModal(true)}
                onDisconnect={handleDisconnectWallet}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 max-w-4xl mx-auto w-full"
          >
            <ChatContainer
              messages={messages}
              onSendMessage={sendMessage}
              onQuickAction={sendQuickAction}
              isTyping={isTyping}
              isConnected={isConnected}
            />
          </motion.div>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton
        onOpenWallet={handleOpenWalletSettings}
        onToggleTheme={handleToggleTheme}
        onOpenHelp={handleOpenHelp}
        isDarkMode={isDarkMode}
      />

      {/* Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleConnectWallet}
        isConnecting={isConnecting}
        error={walletError}
      />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
}

export default App;