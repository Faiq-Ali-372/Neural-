'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export type TxStatus = 'idle' | 'awaiting' | 'confirming' | 'success';

interface Props {
  status: TxStatus;
  txHash?: string;
  onClose: () => void;
}

export default function TransactionToast({ status, txHash, onClose }: Props) {
  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(onClose, 5000);
      return () => clearTimeout(t);
    }
  }, [status, onClose]);

  if (status === 'idle') return null;

  return (
    <AnimatePresence>
      {status !== 'idle' as string && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px',
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
            minWidth: 320,
          }}
        >
          {/* Status Icon */}
          <div style={{ position: 'relative', width: 24, height: 24 }}>
            {status === 'awaiting' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(245,158,11,0.2)', borderTopColor: '#F59E0B' }}
              />
            )}
            {status === 'confirming' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(96,165,250,0.2)', borderTopColor: '#60A5FA' }}
              />
            )}
            {status === 'success' && (
              <motion.svg width="24" height="24" viewBox="0 0 24 24" fill="none" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <circle cx="12" cy="12" r="10" fill="#10B981" fillOpacity="0.2" />
                <path d="M8 12L11 15L16 9" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC', marginBottom: 2 }}>
              {status === 'awaiting' && 'Awaiting wallet approval...'}
              {status === 'confirming' && 'Confirming on Devnet...'}
              {status === 'success' && 'Transaction Success!'}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>
              {status === 'awaiting' && 'Please sign in Phantom'}
              {status === 'confirming' && 'Validating block hash'}
              {status === 'success' && (
                <a 
                  href={`https://explorer.solana.com/tx/${txHash || 'mock'}?cluster=devnet`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#38BDF8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  View on Solscan <span style={{ fontSize: 14 }}>↗</span>
                </a>
              )}
            </div>
          </div>
          
          {/* Close button */}
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
