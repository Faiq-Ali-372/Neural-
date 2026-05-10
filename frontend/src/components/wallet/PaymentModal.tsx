'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { sendSolPayment } from '@/lib/solana';
import { isProgramDeployed, getProgramAddress, getTxExplorerUrl } from '@/lib/program';

type Phase = 'idle' | 'preparing' | 'signing' | 'confirmed' | 'error';

interface PaymentModalProps {
  isOpen: boolean;
  amount: string;
  description: string;
  service: string;
  onConfirm: (sig: string) => void;
  onClose: () => void;
  setTxToast?: (status: any, hash?: string) => void;
}

const PHASE_CONFIG: Record<Phase, { label: string; sub: string; color: string }> = {
  idle:      { label: 'Confirm Payment',  sub: 'Review the transaction details below',     color: '#818cf8' },
  preparing: { label: 'Preparing',        sub: 'Building transaction on Solana devnet',     color: '#60a5fa' },
  signing:   { label: 'Awaiting Signature', sub: 'Approve in your Phantom wallet',         color: '#a78bfa' },
  confirmed: { label: 'Payment Confirmed', sub: 'Transaction verified on-chain',            color: '#34d399' },
  error:     { label: 'Transaction Failed', sub: 'Could not complete payment',              color: '#f87171' },
};

export default function PaymentModal({ isOpen, amount, description, service, onConfirm, onClose, setTxToast }: PaymentModalProps) {
  const { publicKey, signTransaction } = useWallet();
  const [phase, setPhase]     = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txSig, setTxSig]     = useState('');

  useEffect(() => {
    if (!isOpen) { setPhase('idle'); setErrorMsg(''); setTxSig(''); }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (phase !== 'idle') return;
    
    // Switch to global toast notification system if available
    if (setTxToast) {
      onClose(); // Hide the modal immediately
      setTxToast('awaiting');
      await new Promise(r => setTimeout(r, 1500)); // Fake phantom approval time
      setTxToast('confirming');
      
      try {
        const amountNum = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0.001;
        const signer = (signTransaction as unknown as ((tx: unknown) => Promise<unknown>))
          ?? (async () => ({ serialize: () => new Uint8Array() }));
        const sig = await sendSolPayment(amountNum, publicKey?.toString() ?? 'demo', signer);
        
        await new Promise(r => setTimeout(r, 1200)); // Fake network confirmation
        setTxToast('success', sig);
        onConfirm(sig);
      } catch (e) {
        setTxToast('idle'); // Hide toast on error
        // Optionally show an error toast here
      }
      return;
    }

    // Fallback to internal modal phases if no global toast
    setPhase('preparing');
    await new Promise(r => setTimeout(r, 600));
    setPhase('signing');

    try {
      const amountNum = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0.001;
      const signer = (signTransaction as unknown as ((tx: unknown) => Promise<unknown>))
        ?? (async () => ({ serialize: () => new Uint8Array() }));
      const sig = await sendSolPayment(amountNum, publicKey?.toString() ?? 'demo', signer);
      setTxSig(sig);
      setPhase('confirmed');
      await new Promise(r => setTimeout(r, 1000));
      onConfirm(sig);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Payment failed');
      setPhase('error');
    }
  };

  const cfg = PHASE_CONFIG[phase];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={phase === 'idle' ? onClose : undefined}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal wrapper */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1001,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                width: 420,
                padding: 32,
                borderRadius: 20,
                background: 'rgba(8,8,8,0.97)',
                backdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                pointerEvents: 'auto',
                position: 'relative',
              }}
            >
              {/* Close */}
              {(phase === 'idle' || phase === 'error') && (
                <button onClick={onClose} style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, width: 28, height: 28,
                  cursor: 'pointer', color: '#666',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>×</button>
              )}

              {/* Status indicator */}
              <motion.div
                key={phase}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${cfg.color}12`,
                  border: `1px solid ${cfg.color}25`,
                }}
              >
                {phase === 'confirmed' ? (
                  <motion.svg
                    width="24" height="24" viewBox="0 0 24 24" fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.path d="M5 13l4 4L19 7" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}/>
                  </motion.svg>
                ) : phase === 'error' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke={cfg.color} strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: cfg.color,
                    boxShadow: `0 0 12px ${cfg.color}80`,
                  }} />
                )}
              </motion.div>

              {/* Phase label */}
              <h2 style={{
                fontSize: 20, fontWeight: 600, textAlign: 'center',
                marginBottom: 6, color: '#f5f5f5', letterSpacing: '-0.02em',
              }}>
                {cfg.label}
              </h2>
              <p style={{ color: '#555', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
                {phase === 'error' ? errorMsg : cfg.sub}
              </p>

              {/* Transaction details (idle) */}
              {phase === 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 24,
                  }}
                >
                  {[
                    { label: 'Service', val: service },
                    { label: 'Model', val: description },
                    { label: 'Network', val: 'Solana Devnet' },
                    { label: 'Contract', val: isProgramDeployed()
                        ? `${getProgramAddress().slice(0,6)}...${getProgramAddress().slice(-4)}`
                        : 'Direct Transfer' },
                  ].map(r => (
                    <div key={r.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      fontSize: 13,
                    }}>
                      <span style={{ color: '#555' }}>{r.label}</span>
                      <span style={{
                        fontWeight: 500,
                        color: '#aaa',
                        fontFamily: r.label === 'Contract' ? 'var(--font-mono)' : 'inherit',
                        fontSize: r.label === 'Contract' ? 11 : 13,
                      }}>{r.val}</span>
                    </div>
                  ))}
                  {isProgramDeployed() && (
                    <div style={{
                      marginTop: 12, padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(52,211,153,0.04)',
                      border: '1px solid rgba(52,211,153,0.1)',
                      fontSize: 11, color: '#34d399',
                    }}>
                      Revenue split: 95% creator / 5% platform — settled on-chain
                    </div>
                  )}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    paddingTop: 16, marginTop: 4,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#888' }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: '#f5f5f5' }}>
                      {amount}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Progress (preparing/signing) */}
              {(phase === 'preparing' || phase === 'signing') && (
                <div style={{
                  height: 2, background: 'rgba(255,255,255,0.04)',
                  borderRadius: 2, overflow: 'hidden', marginBottom: 28,
                }}>
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: phase === 'preparing' ? '40%' : '85%' }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                    style={{
                      height: '100%', borderRadius: 2,
                      background: cfg.color,
                    }}
                  />
                </div>
              )}

              {/* Signing animation */}
              {phase === 'signing' && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
                  {[0, 0.15, 0.3].map((d, i) => (
                    <motion.div key={i}
                      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, delay: d, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }}
                    />
                  ))}
                </div>
              )}

              {/* Action buttons */}
              {phase === 'idle' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={onClose} className="btn-ghost" style={{
                    flex: 1, padding: '12px 0', fontSize: 13,
                  }}>Cancel</button>
                  <motion.button
                    onClick={handleConfirm}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-primary"
                    style={{ flex: 2, padding: '12px 0', fontSize: 13 }}
                  >
                    Confirm · {amount}
                  </motion.button>
                </div>
              )}

              {/* Explorer link */}
              {phase === 'confirmed' && txSig && (
                <motion.a
                  href={getTxExplorerUrl(txSig)}
                  target="_blank" rel="noopener noreferrer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    display: 'block', textAlign: 'center',
                    fontSize: 12, color: '#60a5fa',
                    padding: '8px 0',
                  }}
                >
                  View on Solana Explorer →
                </motion.a>
              )}

              {phase === 'error' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={onClose} style={{
                    flex: 1, padding: '12px 0', borderRadius: 10,
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    background: 'rgba(248,113,113,0.06)',
                    color: '#f87171',
                    border: '1px solid rgba(248,113,113,0.15)',
                  }}>Close</button>
                  <button onClick={() => setPhase('idle')} className="btn-ghost" style={{
                    flex: 1, padding: '12px 0', fontSize: 13,
                  }}>Retry</button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
