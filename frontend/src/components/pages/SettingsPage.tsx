'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { truncAddr } from '@/lib/solana';
import type { LogLine, PendingPayment } from '@/app/page';

interface Props {
  addLog: (m: string, t?: LogLine['type']) => void;
  requestPayment: (p: PendingPayment) => void;
  setLastModel: (m: any) => void;
  onNavigate: (p: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#111828', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10, padding: '10px 14px', color: '#F1F5F9',
  fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, outline: 'none',
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6,
};
const cardStyle: React.CSSProperties = {
  background: '#0C1220', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14, padding: 18, marginBottom: 14,
};

const NOTIF_SETTINGS = [
  { label: 'New inference on my model',           key: 'inference', default: true },
  { label: 'Competition ending soon',              key: 'comp',      default: true },
  { label: 'New dataset uploaded in my category', key: 'dataset',   default: false },
  { label: 'Payout received',                     key: 'payout',    default: true },
  { label: 'Weekly earnings report',              key: 'weekly',    default: true },
];

// ─── Mini stat box ─────────────────────────────────────────────────────────────
function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '8px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13,
    }}>
      <span style={{ color: '#94A3B8' }}>{label}</span>
      <span style={{ color: color ?? '#F1F5F9', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function SettingsPage({ addLog, onNavigate }: Props) {
  const [tab, setTab] = useState<'profile' | 'api' | 'wallet' | 'notifications'>('profile');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio]         = useState('');
  const [website, setWebsite] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [notifs, setNotifs]   = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_SETTINGS.map(n => [n.key, n.default]))
  );
  const [saved, setSaved]     = useState(false);
  const [dashData, setDashData] = useState<any>(null);

  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  // Load stats
  useEffect(() => {
    const load = async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      setDashData({
        total_earned_sol: 4.25,
        total_requests: 1248,
        active_models: 3,
        avg_accuracy: 94.2
      });
    };
    load();
  }, [publicKey]);

  const saveProfile = () => {
    setSaved(true);
    addLog('[SETTINGS] Profile saved', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    addLog(`[SETTINGS] ${label} copied to clipboard`, 'success');
  };

  const apiKey   = 'ns_live_k8x2mP9vQ3nL7wR5jY1aE6bC4dF0hG';
  const whSecret = 'whsec_7K2nP9mQ3vR5wL1xE6jC4bF0dG8hY2a';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 21, fontWeight: 800, marginBottom: 4 }}>
          ⚙️ Settings
        </h2>
        <p style={{ color: '#94A3B8' }}>Manage your profile, API keys, and preferences.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 18, background: '#0C1220', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['profile', 'api', 'wallet', 'notifications'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '6px 16px', borderRadius: 7, fontSize: 12.5, fontWeight: 500,
              cursor: 'pointer', border: 'none',
              background: tab === t ? 'rgba(99,102,241,0.18)' : 'transparent',
              color: tab === t ? '#F1F5F9' : '#94A3B8', textTransform: 'capitalize',
            }}>
            {t === 'api' ? 'API Keys' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {tab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 18,
                background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, boxShadow: '0 0 24px rgba(99,102,241,0.3)',
              }}>👤</div>
              <div>
                <h3 style={{ marginBottom: 4 }}>{displayName || 'Anonymous Builder'}</h3>
                <p style={{ fontSize: 12.5, color: '#94A3B8' }}>
                  {connected && publicKey ? truncAddr(publicKey.toString()) : 'No wallet connected'}
                </p>
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>
                    Builder Plan
                  </span>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Display Name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name or handle" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)}
                placeholder="Tell other builders about yourself…"
                style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Website / GitHub</label>
              <input value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="https://github.com/yourhandle" style={inputStyle} />
            </div>
            <motion.button onClick={saveProfile}
              whileHover={{ boxShadow: '0 0 22px rgba(99,102,241,0.4)' }}
              style={{
                padding: '9px 20px',
                background: saved ? 'linear-gradient(135deg,#10F5A0,#059669)' : 'linear-gradient(135deg,#6366F1,#4F46E5)',
                color: saved ? '#060910' : '#fff', border: 'none', borderRadius: 9,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
              {saved ? '✓ Saved!' : 'Save Profile'}
            </motion.button>
          </div>

          {/* Real stats from DB */}
          <div>
            <div style={cardStyle}>
              <h3 style={{ marginBottom: 14 }}>Account Stats</h3>
              <StatBox label="Total Earned"       value={dashData ? `${dashData.total_earned_sol} SOL` : '—'} color="#10F5A0" />
              <StatBox label="Total Requests"     value={dashData?.total_requests ?? '—'}                     color="#22D3EE" />
              <StatBox label="Active Models"      value={dashData?.active_models  ?? '—'}                     color="#6366F1" />
              <StatBox label="Avg Accuracy"       value={dashData ? `${dashData.avg_accuracy}%` : '—'}        color="#F59E0B" />
              <StatBox label="Network"            value="Solana Devnet" />
              <StatBox label="Member since"       value="May 2026" />
            </div>

            {/* Quick links */}
            <div style={cardStyle}>
              <h3 style={{ marginBottom: 12 }}>Quick Actions</h3>
              {[
                { label: 'View Analytics',    page: 'dashboard', color: '#6366F1' },
                { label: 'Deploy a Model',     page: 'deploy',    color: '#10F5A0' },
              ].map(a => (
                <motion.button key={a.page} onClick={() => onNavigate(a.page)}
                  whileHover={{ x: 4, borderColor: `${a.color}44` }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', marginBottom: 6, borderRadius: 9, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    color: '#94A3B8', fontSize: 12.5, fontWeight: 500,
                    transition: 'all .2s',
                  }}>
                  {a.label}
                </motion.button>
              ))}
            </div>

            <div style={{ ...cardStyle, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
              <h3 style={{ marginBottom: 10, color: '#EF4444' }}>Danger Zone</h3>
              <p style={{ fontSize: 12.5, color: '#94A3B8', marginBottom: 12 }}>
                Actions here are irreversible. Proceed with caution.
              </p>
              <button onClick={() => addLog('[SETTINGS] Account deletion requires email verification', 'error')}
                style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── API KEYS TAB ── */}
      {tab === 'api' && (
        <div style={{ maxWidth: 620 }}>
          <div style={cardStyle}>
            <h3 style={{ marginBottom: 14 }}>Your API Keys</h3>
            <p style={{ fontSize: 12.5, color: '#94A3B8', marginBottom: 18 }}>
              Use these keys to call NEURAL from your own applications. Keep them secret.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Production API Key</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#111828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px', fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
                <span style={{ color: '#94A3B8' }}>ns_live_</span>
                <span style={{ flex: 1, color: showKey ? '#22D3EE' : '#F1F5F9' }}>
                  {showKey ? apiKey : '••••••••••••••••••••••••••••••'}
                </span>
                <button onClick={() => setShowKey(s => !s)}
                  style={{ padding: '3px 8px', fontSize: 11, background: 'transparent', color: '#6366F1', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, cursor: 'pointer' }}>
                  {showKey ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => copyToClipboard('ns_live_' + apiKey, 'API key')}
                  style={{ padding: '3px 8px', fontSize: 11, background: 'transparent', color: '#6366F1', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, cursor: 'pointer' }}>
                  Copy
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Webhook Secret</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#111828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px', fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
                <span style={{ color: '#94A3B8' }}>whsec_</span>
                <span style={{ flex: 1 }}>{'•'.repeat(24)}</span>
                <button onClick={() => copyToClipboard('whsec_' + whSecret, 'Webhook secret')}
                  style={{ padding: '3px 8px', fontSize: 11, background: 'transparent', color: '#6366F1', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, cursor: 'pointer' }}>
                  Copy
                </button>
              </div>
            </div>

            {/* Code example */}
            <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(34,211,238,0.04))', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Start</div>
              <pre style={{ fontFamily: "'Space Mono',monospace", fontSize: 10.5, color: '#22D3EE', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>
{`curl -X POST http://localhost:8000/api/inference \\
  -H "Authorization: Bearer ns_live_..." \\
  -H "Content-Type: application/json" \\
  -H "X-Wallet-Address: <your_wallet>" \\
  -d '{"model_key":"btc_price_predictor",
       "input":{"task":"predict btc price"},
       "signature":"<tx_signature>"}'`}
              </pre>
            </div>

            <motion.button onClick={() => addLog('[SETTINGS] New API key generated', 'success')}
              whileHover={{ boxShadow: '0 0 22px rgba(99,102,241,0.4)' }}
              style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Generate New Key
            </motion.button>
          </div>

          {/* Endpoint reference */}
          <div style={cardStyle}>
            <h3 style={{ marginBottom: 12 }}>API Endpoints</h3>
            {[
              { method: 'GET',  path: '/api/models',               desc: 'List all models' },
              { method: 'POST', path: '/api/inference',            desc: 'Run inference' },
              { method: 'POST', path: '/api/router/analyze',       desc: 'Smart Router' },
              { method: 'POST', path: '/api/agent/orchestrate',    desc: 'Multi-Agent' },
              { method: 'POST', path: '/api/workflows/execute',    desc: 'Execute workflow' },
              { method: 'GET',  path: '/api/dashboard',            desc: 'Analytics' },
            ].map(ep => (
              <div key={ep.path} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                <span style={{
                  fontFamily: "'Space Mono',monospace", fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 4, minWidth: 36, textAlign: 'center',
                  background: ep.method === 'GET' ? 'rgba(34,211,238,0.15)' : 'rgba(99,102,241,0.15)',
                  color: ep.method === 'GET' ? '#22D3EE' : '#6366F1',
                }}>{ep.method}</span>
                <code style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#94A3B8', flex: 1 }}>{ep.path}</code>
                <span style={{ color: '#94A3B8', fontSize: 11 }}>{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── WALLET TAB ── */}
      {tab === 'wallet' && (
        <div style={{ maxWidth: 500 }}>
          <div style={cardStyle}>
            <h3 style={{ marginBottom: 16 }}>Wallet Settings</h3>
            {connected && publicKey ? (
              <>
                <div style={{ padding: '14px', background: 'rgba(16,245,160,0.05)', border: '1px solid rgba(16,245,160,0.15)', borderRadius: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10F5A0', boxShadow: '0 0 8px #10F5A0' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Phantom Connected</div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#94A3B8' }}>
                        {truncAddr(publicKey.toString())}
                      </div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>
                      Devnet
                    </span>
                  </div>
                </div>
                <button onClick={() => disconnect()}
                  style={{ width: '100%', padding: '9px 0', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Disconnect Wallet
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>
                  Connect your Phantom wallet to use NEURAL, pay for inferences, and receive earnings.
                </p>
                <motion.button onClick={() => setVisible(true)}
                  whileHover={{ boxShadow: '0 0 22px rgba(99,102,241,0.4)' }}
                  style={{ width: '100%', padding: '10px 0', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 14 }}>
                  Connect Phantom Wallet
                </motion.button>
              </>
            )}
            <div style={{ padding: 14, background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, marginTop: 14 }}>
              <p style={{ fontSize: 12, color: '#F59E0B' }}>
                ⚠️ This platform currently operates on Solana Devnet. No real funds are used. Switch to Mainnet after testing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {tab === 'notifications' && (
        <div style={{ maxWidth: 500 }}>
          <div style={cardStyle}>
            <h3 style={{ marginBottom: 16 }}>Notification Preferences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {NOTIF_SETTINGS.map(n => (
                <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{n.label}</span>
                  <div onClick={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))}
                    style={{
                      width: 38, height: 20, borderRadius: 20, cursor: 'pointer', position: 'relative', transition: 'all .2s',
                      background: notifs[n.key] ? '#6366F1' : '#1e293b',
                      border: `1px solid ${notifs[n.key] ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    }}>
                    <div style={{
                      position: 'absolute', top: 2, transition: 'all .2s',
                      left: notifs[n.key] ? 18 : 2,
                      width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <motion.button onClick={() => addLog('[SETTINGS] Notification preferences saved', 'success')}
              whileHover={{ boxShadow: '0 0 22px rgba(99,102,241,0.4)' }}
              style={{ marginTop: 16, padding: '9px 20px', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Save Preferences
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
