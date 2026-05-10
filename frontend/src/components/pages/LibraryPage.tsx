'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletState } from '@/context/WalletContext';
import { truncAddr } from '@/lib/solana';
import type { Model } from '@/lib/constants';
import type { TxStatus } from '@/components/ui/TransactionToast';

interface Props {
  purchasedModels: Model[];
  purchasedDatasets: any[];
  onNavigate: (p: string) => void;
  setTxToast: (status: TxStatus, hash?: string) => void;
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.015)',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: 16,
  padding: 24,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease-out',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

export default function LibraryPage({ purchasedModels, purchasedDatasets, onNavigate, setTxToast }: Props) {
  const { publicKey, connected } = useWallet();
  const { balance } = useWalletState();
  const [tab, setTab] = useState<'models' | 'datasets'>('models');
  const [downloading, setDownloading] = useState<string | null>(null);

  const totalSpent = purchasedModels.reduce((acc, m) => {
    return acc + parseFloat(m.price.split(' ')[0]);
  }, 0) + purchasedDatasets.reduce((acc, d) => {
    return acc + (d.free ? 0 : parseFloat(d.price.split(' ')[0] || '0'));
  }, 0);

  const handleDownload = (m: Model) => {
    if (downloading) return;
    setDownloading(m.key);
    
    // Simulate a short decrypting delay before the browser download
    setTimeout(() => {
      // Generate a mock SDK/Weights file
      const mockData = JSON.stringify({
        model_name: m.name,
        category: m.cat,
        license: "Purchased via NEURAL Network",
        weights_hash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        status: "DECRYPTED & VERIFIED"
      }, null, 2);
      
      // Trigger a native browser download
      const blob = new Blob([mockData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${m.key}_sdk_weights.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setDownloading(null);
    }, 1500);
  };

  const handleDatasetDownload = (d: any) => {
    const blob = new Blob([`Dummy data for ${d.label}\nColumn1,Column2,Column3\nValue1,Value2,Value3\n`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${d.name}_sample.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '40px 0', maxWidth: 1000, margin: '0 auto', width: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            My Library
          </h1>
          <p style={{ color: '#CBD5E1', marginTop: 4, fontSize: 14 }}>
            Models you have purchased and licensed for inference.
          </p>
        </div>
        
        {/* Buyer Wallet & Stats Container */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: 12, padding: '12px 20px', 
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
          }}>
            <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Spent</span>
            <span style={{ fontSize: 20, color: '#f87171', fontWeight: 700, textShadow: '0 0 10px rgba(248,113,113,0.3)' }}>
              -{totalSpent.toFixed(4)} SOL
            </span>
          </div>

          <div style={{ 
            background: 'rgba(52,211,153,0.03)', 
            border: '1px solid rgba(52,211,153,0.1)', 
            borderRadius: 12, padding: '12px 20px', 
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            boxShadow: 'inset 0 0 20px rgba(52,211,153,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.8)' }} />
              <span style={{ fontSize: 11, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Connected Buyer</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 20, color: '#f5f5f5', fontWeight: 700 }}>{balance} SOL</span>
              <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>{connected && publicKey ? truncAddr(publicKey.toString()) : 'Not connected'}</span>
            </div>
          </div>
        </div>
      </div>

      {!connected ? (
        <div style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
          <div style={{ fontSize: 18, color: '#f5f5f5', fontWeight: 600, marginBottom: 8 }}>Connect Wallet to View Library</div>
          <div style={{ color: '#CBD5E1', fontSize: 14 }}>Please connect your Phantom wallet to view your purchased assets.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: '#0C1220', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['models', 'datasets'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '6px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: tab === t ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: tab === t ? '#F1F5F9' : '#94A3B8', textTransform: 'capitalize' }}>
                {t} ({t === 'models' ? purchasedModels.length : purchasedDatasets.length})
              </button>
            ))}
          </div>

          {tab === 'models' && (
            purchasedModels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                <div style={{ fontSize: 18, color: '#f5f5f5', fontWeight: 600, marginBottom: 8 }}>Your Models Library is Empty</div>
                <div style={{ color: '#CBD5E1', fontSize: 14, marginBottom: 24 }}>You haven't purchased any models from the marketplace yet.</div>
                <button 
                  onClick={() => onNavigate('models')}
                  style={{
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                    color: '#818cf8', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                >
                  Explore Marketplace
                </button>
              </div>
            ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          <AnimatePresence>
            {purchasedModels.map((m, idx) => (
              <motion.div
                key={`${m.key}-${idx}`}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4, borderColor: 'rgba(129,140,248,0.3)', boxShadow: '0 12px 40px -10px rgba(129,140,248,0.15)' }}
                style={{ ...cardStyle }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: 150, height: 150,
                  background: 'radial-gradient(circle at top left, rgba(129,140,248,0.08), transparent 70%)',
                  pointerEvents: 'none'
                }} />
                
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 32, filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' }}>{m.emoji || '📦'}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#f5f5f5', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {m.cat}
                  </span>
                </div>
                
                <div style={{ fontWeight: 700, fontSize: 18, color: '#f5f5f5', marginBottom: 6 }}>{m.name}</div>
                <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, marginBottom: 20, flex: 1, minHeight: 40 }}>{m.desc}</div>
                
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>Purchased For</div>
                    <div style={{ fontSize: 14, color: '#fbbf24', fontWeight: 600 }}>{m.price}</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>Accuracy</div>
                    <div style={{ fontSize: 14, color: '#60a5fa', fontWeight: 600 }}>{m.accuracy}%</div>
                  </div>
                </div>

                <motion.button
                  onClick={() => handleDownload(m)}
                  disabled={downloading !== null}
                  whileHover={downloading ? {} : { scale: 1.02 }}
                  whileTap={downloading ? {} : { scale: 0.98 }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    border: 'none',
                    background: downloading === m.key ? 'rgba(52,211,153,0.1)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: downloading === m.key ? '#34d399' : '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: downloading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                >
                  {downloading === m.key ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: 14, height: 14, border: '2px solid rgba(52,211,153,0.3)', borderTopColor: '#34d399', borderRadius: '50%' }} />
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Download SDK
                    </>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
            )
          )}

          {tab === 'datasets' && (
            purchasedDatasets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🗃️</div>
                <div style={{ fontSize: 18, color: '#f5f5f5', fontWeight: 600, marginBottom: 8 }}>Your Datasets Library is Empty</div>
                <div style={{ color: '#CBD5E1', fontSize: 14, marginBottom: 24 }}>You haven't purchased any datasets yet.</div>
                <button 
                  onClick={() => onNavigate('datasets')}
                  style={{
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                    color: '#818cf8', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                >
                  Browse Datasets
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                <AnimatePresence>
                  {purchasedDatasets.map((d, idx) => {
                    const color = d.free ? '#10F5A0' : '#6366F1';
                    return (
                      <motion.div
                        key={`${d.name}-${idx}`}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -4, borderColor: `${color}60`, boxShadow: `0 12px 40px -10px ${color}30, inset 0 0 20px ${color}10` }}
                        style={{ 
                          ...cardStyle,
                          borderLeft: `3px solid ${color}80`,
                          display: 'flex', flexDirection: 'column'
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 0, right: 0, width: 120, height: 120,
                          background: `radial-gradient(circle at top right, ${color}15, transparent 70%)`,
                          pointerEvents: 'none'
                        }} />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, position: 'relative', zIndex: 1 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: `${color}15`, color: color, border: `1px solid ${color}30` }}>
                            {d.cat}
                          </span>
                        </div>
                        
                        <h3 style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: '#fff', marginBottom: 8, position: 'relative', zIndex: 1 }}>
                          {d.label}
                        </h3>
                        
                        <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, flex: 1, marginBottom: 20, minHeight: 40, position: 'relative', zIndex: 1 }}>{d.desc}</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20, position: 'relative', zIndex: 1 }}>
                          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#f5f5f5' }}>{d.rows}</div>
                            <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4, fontWeight: 500, textTransform: 'uppercase' }}>Rows</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>{d.size}</div>
                            <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4, fontWeight: 500, textTransform: 'uppercase' }}>Size</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>{d.price}</div>
                            <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4, fontWeight: 500, textTransform: 'uppercase' }}>Cost</div>
                          </div>
                        </div>

                        <motion.button
                          onClick={() => handleDatasetDownload(d)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                            background: 'linear-gradient(135deg, #10F5A0, #059669)',
                            color: '#060910', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Download CSV
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )
          )}
        </>
      )}
    </motion.div>
  );
}
