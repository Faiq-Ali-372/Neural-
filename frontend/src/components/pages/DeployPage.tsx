'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { deployModel, fetchMyModels, type DeployedModel } from '@/lib/api';
import type { LogLine, PendingPayment } from '@/app/page';

interface Props {
  addLog: (m: string, t?: LogLine['type']) => void;
  requestPayment: (p: PendingPayment) => void;
  setLastModel: (m: any) => void;
  onNavigate: (p: string) => void;
}

interface FileItem { name: string; size: number; }

const CATS = ['Finance', 'NLP', 'DeFi', 'Anomaly', 'Vision', 'General', 'Other'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#f5f5f5',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: 6,
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.015)',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: 16,
  padding: 24,
  marginBottom: 16,
};

type Tab = 'deploy' | 'my_models';

/* ─── My Models card ──────────────────────────────────────────────── */
function MyModelCard({ model, onNavigate }: { model: DeployedModel; onNavigate: (p: string) => void }) {
  const approved = model.is_approved ?? true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -4, 
        borderColor: approved ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)',
        boxShadow: approved 
          ? '0 12px 40px -10px rgba(52,211,153,0.15), inset 0 0 20px rgba(52,211,153,0.02)' 
          : '0 12px 40px -10px rgba(251,191,36,0.15), inset 0 0 20px rgba(251,191,36,0.02)',
        background: 'rgba(255,255,255,0.025)'
      }}
      style={{ 
        ...cardStyle, 
        marginBottom: 16, 
        transition: 'all 0.3s ease-out', 
        position: 'relative', 
        overflow: 'hidden',
        borderLeft: approved ? '3px solid rgba(52,211,153,0.5)' : '3px solid rgba(251,191,36,0.5)'
      }}
    >
      {/* Subtle background glow based on status */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 150, height: 150,
        background: approved ? 'radial-gradient(circle at top right, rgba(52,211,153,0.05), transparent 70%)' : 'radial-gradient(circle at top right, rgba(251,191,36,0.05), transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ 
            fontWeight: 800, 
            fontSize: 20, 
            letterSpacing: '-0.02em', 
            background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            marginBottom: 8 
          }}>
            {model.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#CBD5E1' }}>
            <span style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6, fontWeight: 500, color: '#d1d5db' }}>{model.category}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#818cf8', fontSize: 11, background: 'rgba(129,140,248,0.1)', padding: '3px 6px', borderRadius: 4 }}>{model.model_key}</span>
          </div>
        </div>
        <motion.span 
          animate={approved ? { 
            boxShadow: ['0 0 0px rgba(52,211,153,0)', '0 0 12px rgba(52,211,153,0.4)', '0 0 0px rgba(52,211,153,0)']
          } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
            background: approved ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.08)',
            color: approved ? '#34d399' : '#fbbf24',
            border: `1px solid ${approved ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
            backdropFilter: 'blur(4px)'
          }}
        >
          <motion.div 
            animate={approved ? { opacity: [0.4, 1, 0.4] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} 
          />
          {approved ? 'LIVE' : 'PENDING'}
        </motion.span>
      </div>

      {!approved && (
        <div style={{
          background: 'rgba(251,191,36,0.04)',
          border: '1px solid rgba(251,191,36,0.1)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 12,
          fontSize: 12, color: '#CBD5E1', lineHeight: 1.6,
        }}>
          <span style={{ color: '#fbbf24', fontWeight: 500 }}>Under review</span> — Your model is awaiting admin approval. Usually &lt;24h.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Price', val: `${model.price_sol} SOL`, color: '#fbbf24' },
          { label: 'Accuracy', val: `${Math.round(model.accuracy * 100)}%`, color: '#60a5fa' },
          { label: 'Uses', val: model.total_uses.toLocaleString(), color: '#818cf8' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: 12,
            padding: '12px 8px', textAlign: 'center',
            boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.01)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, textShadow: `0 0 10px ${s.color}40` }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
          Total Revenue: <span style={{ color: '#34d399', fontWeight: 700, textShadow: '0 0 10px rgba(52,211,153,0.3)' }}>{model.total_revenue.toFixed(4)} SOL</span>
        </span>
        <motion.button 
          onClick={() => alert(`Manage panel for ${model.name} coming soon!`)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, cursor: 'pointer'
          }}
        >
          Manage
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────── */
export default function DeployPage({ addLog, requestPayment, onNavigate }: Props) {
  const { publicKey } = useWallet();
  const [tab, setTab]           = useState<Tab>('deploy');
  const [name, setName]         = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [price, setPrice]       = useState('0.001');
  const [accuracy, setAccuracy] = useState('0.80');
  const [cat, setCat]           = useState(CATS[0]);
  const [desc, setDesc]         = useState('');
  const [files, setFiles]       = useState<FileItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [myModels, setMyModels] = useState<DeployedModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wallet = publicKey?.toString();

  useEffect(() => {
    if (tab === 'my_models' && wallet) {
      setLoadingModels(true);
      fetchMyModels(wallet)
        .then(m => setMyModels(m))
        .catch(() => {})
        .finally(() => setLoadingModels(false));
    }
  }, [tab, wallet]);

  const handleFiles = (fl: File[]) => {
    setFiles(fl.map(f => ({ name: f.name, size: f.size })));
  };

  const resetForm = () => {
    setName(''); setDesc(''); setEndpoint('');
    setPrice('0.001'); setAccuracy('0.80'); setCat(CATS[0]); setFiles([]);
  };

  const deploy = () => {
    setError(null); setSuccess(null);
    if (!name.trim()) { setError('Model name is required.'); return; }
    if (!desc.trim() || desc.length < 10) { setError('Description must be at least 10 characters.'); return; }
    if (!wallet) { setError('Connect your Phantom wallet first.'); return; }

    requestPayment({
      amount: '0.02 SOL',
      description: 'Model Deployment Fee',
      service: name,
      onPaid: async (sig) => {
        setDeploying(true);
        try {
          const res = await deployModel({
            name: name.trim(),
            description: desc.trim(),
            category: cat,
            price_sol: parseFloat(price) || 0.001,
            accuracy: parseFloat(accuracy) || 0.80,
            endpoint_url: endpoint.trim() || undefined,
          }, wallet);
          setSuccess(`"${res.name}" deployed as ${res.model_key}`);
          addLog(`[DEPLOY] "${res.name}" live as ${res.model_key}`, 'success');
          resetForm();
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Deploy failed';
          setError(msg);
          addLog(`[DEPLOY] ${msg}`, 'error');
        } finally {
          setDeploying(false);
        }
      },
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8, color: '#f5f5f5' }}>
            Deploy Model
          </h1>
          <p style={{ fontSize: 14, color: '#94A3B8' }}>
            Publish your AI model. Earn SOL every time someone uses it.
          </p>
        </div>
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 10,
          padding: 4, border: '1px solid rgba(255,255,255,0.04)', gap: 2,
        }}>
          {([['deploy', 'New Deploy'], ['my_models', 'My Models']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: tab === t ? 'rgba(129,140,248,0.12)' : 'transparent',
                color: tab === t ? '#f5f5f5' : '#94A3B8', fontSize: 13, fontWeight: 500,
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── DEPLOY TAB ── */}
        {tab === 'deploy' && (
          <motion.div key="deploy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
              {/* Left */}
              <div>
                <div style={cardStyle}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#f5f5f5' }}>Model Information</h3>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Model Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)}
                      placeholder="e.g. Bitcoin LSTM Predictor v3" style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ position: 'relative' }} onMouseLeave={() => { const el = document.getElementById('deploy-cat-dropdown'); if (el) el.style.display = 'none'; }}>
                      <label style={labelStyle}>Category</label>
                      <div 
                        onClick={() => {
                          const el = document.getElementById('deploy-cat-dropdown');
                          if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                        }}
                        style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        {cat}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      
                      <div id="deploy-cat-dropdown" style={{ 
                        display: 'none',
                        position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 50, 
                        background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, marginTop: 6, 
                        overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
                      }}>
                        {CATS.map(c => (
                          <div 
                            key={c} 
                            onClick={() => { 
                              setCat(c); 
                              const el = document.getElementById('deploy-cat-dropdown');
                              if (el) el.style.display = 'none'; 
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            style={{ 
                              padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                              color: cat === c ? '#818cf8' : '#ccc',
                              background: 'transparent', transition: 'background 0.2s'
                            }}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Version</label>
                      <input defaultValue="v1.0.0" style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Description * (min 10 chars)</label>
                    <textarea value={desc} onChange={e => setDesc(e.target.value)}
                      placeholder="What does this model do?"
                      style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Tags (comma separated)</label>
                    <input placeholder="btc, lstm, prediction" style={inputStyle} />
                  </div>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#f5f5f5' }}>Pricing & Accuracy</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={labelStyle}>Price per Inference (SOL)</label>
                      <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                        step="0.0001" min="0.0001" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Accuracy (0–1 scale)</label>
                      <input type="number" value={accuracy} onChange={e => setAccuracy(e.target.value)}
                        step="0.01" min="0" max="1" style={inputStyle} />
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(52,211,153,0.03)',
                    border: '1px solid rgba(52,211,153,0.08)',
                    borderRadius: 10, padding: '10px 14px', fontSize: 12,
                  }}>
                    <span style={{ color: '#94A3B8' }}>At 100 inferences/day → </span>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>
                      {(parseFloat(price || '0') * 100).toFixed(4)} SOL/day
                    </span>
                    <span style={{ color: '#64748B' }}> · {(parseFloat(price || '0') * 100 * 30).toFixed(3)} SOL/month</span>
                  </div>
                </div>

                {/* Error / Success */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: '#f87171', padding: '10px 14px', background: 'rgba(248,113,113,0.04)', borderRadius: 10, marginBottom: 12, border: '1px solid rgba(248,113,113,0.1)' }}>
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 13, color: '#34d399', padding: '10px 14px', background: 'rgba(52,211,153,0.04)', borderRadius: 10, marginBottom: 12, border: '1px solid rgba(52,211,153,0.1)' }}>
                      {success} — <span style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setTab('my_models')}>View in My Models →</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right */}
              <div>
                <div style={cardStyle}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#f5f5f5' }}>API Endpoint</h3>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Inference Endpoint URL (optional)</label>
                    <input value={endpoint} onChange={e => setEndpoint(e.target.value)}
                      placeholder="https://your-api.com/predict" style={inputStyle} />
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B' }}>
                    Leave blank to use simulated inference during development.
                  </p>
                </div>

                <div style={{
                  ...cardStyle,
                  background: 'rgba(129,140,248,0.02)',
                  border: '1px solid rgba(129,140,248,0.08)',
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#f5f5f5' }}>Model File</h3>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>Upload model card, weights, or notebook.</p>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(Array.from(e.dataTransfer.files)); }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `1px dashed ${dragOver ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 12, padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
                      background: dragOver ? 'rgba(129,140,248,0.04)' : 'transparent',
                      transition: 'all 0.2s',
                    }}>
                    <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#CBD5E1' }}>Drag & drop or click</p>
                    <p style={{ fontSize: 11, color: '#64748B' }}>.pkl .h5 .onnx .ipynb .pdf</p>
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                      onChange={e => handleFiles(Array.from(e.target.files || []))} />
                  </div>
                  {files.map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      background: 'rgba(129,140,248,0.04)', border: '1px solid rgba(129,140,248,0.1)',
                      borderRadius: 8, marginTop: 8, fontSize: 12, color: '#aaa',
                    }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <span style={{ color: '#94A3B8' }}>{(f.size / 1024).toFixed(0)}KB</span>
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 4, background: 'rgba(52,211,153,0.08)', color: '#34d399' }}>Ready</span>
                    </div>
                  ))}
                </div>

                {/* Deploy CTA */}
                <div style={{
                  ...cardStyle,
                  background: 'rgba(129,140,248,0.03)',
                  border: '1px solid rgba(129,140,248,0.1)',
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Deployment fee</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#818cf8', letterSpacing: '-0.02em' }}>0.02 SOL</div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                      One-time listing fee · Earn {price} SOL per inference
                    </div>
                  </div>
                  <motion.button onClick={deploy}
                    disabled={deploying}
                    whileHover={!deploying ? { scale: 1.01 } : {}}
                    whileTap={!deploying ? { scale: 0.97 } : {}}
                    className="btn-primary"
                    style={{
                      width: '100%', padding: '14px 0', fontSize: 14,
                      opacity: deploying ? 0.5 : 1,
                      cursor: deploying ? 'not-allowed' : 'pointer',
                    }}>
                    {deploying ? 'Deploying...' : 'Deploy Model'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── MY MODELS TAB ── */}
        {tab === 'my_models' && (
          <motion.div key="my_models" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!wallet ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.06)' }}>
                <p style={{ color: '#94A3B8', fontSize: 14 }}>Connect your Phantom wallet to view your deployed models.</p>
              </div>
            ) : loadingModels ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8', fontSize: 14 }}>
                Loading your models...
              </div>
            ) : myModels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.06)' }}>
                <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 16 }}>You haven't deployed any models yet.</p>
                <motion.button onClick={() => setTab('deploy')} whileHover={{ scale: 1.02 }} className="btn-primary" style={{ padding: '10px 24px', fontSize: 13 }}>
                  Deploy Your First Model
                </motion.button>
              </div>
            ) : (
              <div>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'Models Live', val: myModels.filter(m => m.is_active).length, color: '#34d399' },
                    { label: 'Total Uses', val: myModels.reduce((a, m) => a + m.total_uses, 0).toLocaleString(), color: '#60a5fa' },
                    { label: 'Revenue', val: `${myModels.reduce((a, m) => a + m.total_revenue, 0).toFixed(4)} SOL`, color: '#fbbf24' },
                    { label: 'Avg Accuracy', val: `${Math.round(myModels.reduce((a, m) => a + m.accuracy, 0) / myModels.length * 100)}%`, color: '#818cf8' },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: 12, padding: '16px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {myModels.map(m => <MyModelCard key={m.model_key} model={m} onNavigate={onNavigate} />)}
                <motion.button onClick={() => setTab('deploy')} whileHover={{ scale: 1.01 }}
                  style={{
                    width: '100%', padding: '12px 0', border: '1px dashed rgba(129,140,248,0.2)',
                    borderRadius: 10, background: 'transparent', color: '#818cf8',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 8,
                  }}>
                  + Deploy Another Model
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
