'use client';

/**
 * WalletContext.tsx
 *
 * Wraps the entire app with Solana wallet adapter providers.
 * Exports `useWallet` and `useConnection` from @solana/wallet-adapter-react.
 * Also provides a convenience `useWalletBalance` hook that auto-fetches the SOL balance.
 *
 * Why a custom provider?
 *  - We need 'use client' because wallet adapters use browser APIs (window.solana)
 *  - We configure Phantom + Devnet here so the rest of the app doesn't need to
 *  - We also expose `walletBalance` and `solPrice` as global reactive state
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { fetchBalance, fetchSolPrice, fetchBlockHeight } from '@/lib/solana';

// ─── Re-export wallet hooks for convenience ────────────────────────────────
export { useWallet, useConnection };

// ─── App-level wallet state context ───────────────────────────────────────
interface WalletStateContextValue {
  balance: string;
  solPrice: string;
  blockHeight: string;
  refreshBalance: () => Promise<void>;
}

const WalletStateContext = createContext<WalletStateContextValue>({
  balance: '0.0000',
  solPrice: '$—',
  blockHeight: '—',
  refreshBalance: async () => {},
});

export const useWalletState = () => useContext(WalletStateContext);

// ─── Inner component (has access to wallet hooks) ─────────────────────────
function WalletStateProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState('0.0000');
  const [solPrice, setSolPrice] = useState('$—');
  const [blockHeight, setBlockHeight] = useState('—');

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    const bal = await fetchBalance(publicKey.toString());
    setBalance(bal);
  }, [publicKey]);

  // Fetch balance whenever wallet changes
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // Fetch SOL price + block height periodically
  useEffect(() => {
    const loadPrice = async () => setSolPrice(await fetchSolPrice());
    const loadBlock = async () => setBlockHeight(await fetchBlockHeight());

    loadPrice();
    loadBlock();

    const priceInterval = setInterval(loadPrice, 60_000);
    const blockInterval = setInterval(loadBlock, 10_000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(blockInterval);
    };
  }, []);

  return (
    <WalletStateContext.Provider value={{ balance, solPrice, blockHeight, refreshBalance }}>
      {children}
    </WalletStateContext.Provider>
  );
}

// ─── Root provider (wraps ConnectionProvider → WalletProvider → Modal) ─────
const WALLETS = [new PhantomWalletAdapter()];

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  // Use Devnet endpoint
  const endpoint = clusterApiUrl('devnet');

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={WALLETS} autoConnect>
        <WalletModalProvider>
          <WalletStateProvider>
            {children}
          </WalletStateProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
