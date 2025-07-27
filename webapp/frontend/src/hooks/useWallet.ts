import { useState, useCallback, useEffect } from 'react';
import { WalletData } from '../types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWallet = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          });
          
          setWalletData({
            address: accounts[0],
            balance: balance,
            isConnected: true,
          });
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    }
  };

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install MetaMask and try again.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const address = accounts[0];

      // Check if we're on the right network (Base)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x2105') { // Base mainnet chain ID
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }]
          });
        } catch (switchError: any) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x2105',
                chainName: 'Base',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org']
              }]
            });
          } else {
            throw switchError;
          }
        }
      }

      // Get balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      setWalletData({
        address,
        balance,
        isConnected: true,
      });

    } catch (err: any) {
      console.error('Wallet connection error:', err);
      
      let errorMessage = err.message || 'Failed to connect wallet';
      
      if (err.code === 4001) {
        errorMessage = 'Connection rejected by user.';
      } else if (err.code === -32002) {
        errorMessage = 'Please check MetaMask - connection request is pending.';
      }
      
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletData(null);
    setError(null);
  }, []);

  const switchNetwork = useCallback(async (chainId: string) => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed.');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      });
    } catch (err: any) {
      console.error('Network switch error:', err);
      setError(`Failed to switch network: ${err.message}`);
    }
  }, []);

  return {
    walletData,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isConnected: !!walletData?.isConnected,
  };
};