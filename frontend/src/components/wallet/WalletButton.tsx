'use client';

/**
 * WalletButton.tsx — Minimal wallet connect button for the topbar.
 */

import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletState } from '@/context/WalletContext';
import { truncAddr } from '@/lib/solana';
import { motion } from 'framer-motion';

export default function WalletButton() {
  const { publicKey, connected } = useWallet();
  const { balance } = useWalletState();
  const { setVisible } = useWalletModal();

  const handleClick = () => setVisible(true);

  if (connected && publicKey) {
    return (
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 8,
          background: 'rgba(52,211,153,0.06)',
          border: '1px solid rgba(52,211,153,0.15)',
          color: '#34d399',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: '#34d399', flexShrink: 0,
          boxShadow: '0 0 6px rgba(52,211,153,0.6)',
        }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          {balance} SOL
        </span>
        <span style={{ color: '#555', fontSize: 10 }}>
          {truncAddr(publicKey.toString())}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 16px',
        borderRadius: 8,
        background: '#6366f1',
        border: 'none',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      Connect Wallet
    </motion.button>
  );
}
