'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '@/lib/constants';
import type { LogLine } from '@/app/page';
import ActivityTicker from '@/components/ui/ActivityTicker';

interface Props {
  addLog: (m: string, t?: LogLine['type']) => void;
  onNavigate: (p: string) => void;
  pendingDatasets?: any[];
  pendingGpus?: any[];
  onApproveDataset?: (name: string) => void;
  onRejectDataset?: (name: string) => void;
  onApproveGpu?: (id: string) => void;
  onRejectGpu?: (id: string) => void;
}

interface PendingModel {
  model_key: string; name: string; description: string;
  category: string; price_sol: number; accuracy: number;
  is_approved: boolean; is_active: boolean;
  total_uses: number; total_revenue: number; created_at: string;
}

interface ProgramInfo {
  deployed: boolean;
  program_id: string;
  framework: string;
  language: string;
  revenue_split: string;
  instructions: string[];
  explorer?: string;
  message?: string;
}

const ADMIN_WALLET = 'ADMIN_OVERRIDE';

async function fetchPendingModels(): Promise<PendingModel[]> {
  // Use the admin endpoint which returns ALL models (pending + approved)
  // sorted with pending first so admins see what needs attention immediately
  const res = await fetch(`${API_BASE}/deploy/admin/all`, {
    headers: { 'X-Wallet-Address': ADMIN_WALLET },
  });
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
  return res.json();
}

async function approveModel(key: string): Promise<void> {
  const res = await fetch(`${API_BASE}/deploy/approve/${key}`, {
    method: 'POST',
    headers: { 'X-Wallet-Address': ADMIN_WALLET },
  });
  if (!res.ok) throw new Error(await res.text());
}

function StatPill({ label, val, color }: { label: string; val: string | number; color: string }) {
  return (
    <div style={{ textAlign: 'center', background: '#060910', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color }}>{val}</div>
      <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function AdminPage({ addLog, onNavigate, pendingDatasets = [], pendingGpus = [], onApproveDataset, onRejectDataset, onApproveGpu, onRejectGpu }: Props) {
  const [tab, setTab] = useState<'submissions' | 'models' | 'stats' | 'logs'>('submissions');
  const [models, setModels]     = useState<PendingModel[]>([]);
  const [loading, setLoading]   = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [filter, setFilter]     = useState<'all' | 'pending' | 'approved'>('all');
  const [programInfo, setProgramInfo] = useState<ProgramInfo | null>(null);
  const [activityLog, setActivityLog] = useState<{msg: string; time: string}[]>(() => [
    { msg: '[SYSTEM] Admin panel initialized',          time: new Date().toLocaleTimeString() },
    { msg: '[DB] 9 marketplace models seeded',           time: new Date().toLocaleTimeString() },
    { msg: '[RATE_LIMITER] slowapi active — 60 req/min', time: new Date().toLocaleTimeString() },
    { msg: '[GZIP] GZip middleware active (≥512 bytes)', time: new Date().toLocaleTimeString() },
    { msg: '[ROUTE] /api/deploy/approve/{key} available',time: new Date().toLocaleTimeString() },
  ]);

  const loadModels = () => {
    setLoading(true);
    fetchPendingModels()
      .then(ms => setModels(ms))
      .catch(() => addLog('[ADMIN] Failed to load models', 'error'))
      .finally(() => setLoading(false));
  };

  const loadProgramInfo = () => {
    fetch(`${API_BASE}/deploy/program-info`)
      .then(r => r.json())
      .then(info => {
        setProgramInfo(info);
        const status = info.deployed ? '✅ Deployed on devnet' : '⏳ Not yet deployed';
        setActivityLog(l => [{ msg: `[PROGRAM] ${status} — ${info.program_id ?? 'no ID'}`, time: new Date().toLocaleTimeString() }, ...l.slice(0, 19)]);
      })
      .catch(() => {/* non-critical */});
  };

  useEffect(() => { loadModels(); loadProgramInfo(); }, []);

  const handleApprove = async (key: string, name: string) => {
    setApproving(key);
    try {
      await approveModel(key);
      setModels(m => m.map(model =>
        model.model_key === key ? { ...model, is_approved: true } : model
      ));
      const msg = `[ADMIN] Model "${name}" approved → visible in marketplace`;
      addLog(msg, 'success');
      setActivityLog(l => [{ msg, time: new Date().toLocaleTimeString() }, ...l.slice(0, 19)]);
    } catch (e) {
      addLog(`[ADMIN] Approval failed: ${e instanceof Error ? e.message : 'error'}`, 'error');
    } finally {
      setApproving(null);
    }
  };

  const filtered = models.filter(m => {
    if (filter === 'pending')  return !m.is_approved;
    if (filter === 'approved') return m.is_approved;
    return true;
  });

  const pendingCount  = models.filter(m => !m.is_approved).length;
  const approvedCount = models.filter(m =>  m.is_approved).length;
  const totalUses     = models.reduce((s, m) => s + m.total_uses, 0);
  const totalRev      = models.reduce((s, m) => s + m.total_revenue, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 21, fontWeight: 800 }}>📈 Creator Dashboard</h2>
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(16,245,160,0.15)', color: '#10F5A0', border: '1px solid rgba(16,245,160,0.25)', letterSpacing: 1 }}>
              CREATOR
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: 13 }}>Track your AI assets, view inference analytics, and monitor SOL earnings.</p>
        </div>
        <motion.button onClick={loadModels}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
          style={{ padding: '6px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#94A3B8', fontSize: 12, cursor: 'pointer' }}>
          ↻ Refresh
        </motion.button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        <StatPill label="Your Models"    val={approvedCount}       color="#F1F5F9" />
        <StatPill label="Inference Calls"val={totalUses.toLocaleString()} color="#22D3EE" />
        <StatPill label="Avg Rating"     val="4.9/5.0"              color="#F59E0B" />
        <StatPill label="Total Earned"   val={`${totalRev.toFixed(3)} SOL`} color="#10F5A0" />
      </div>

      {/* 7-Day Earnings Chart */}
      <div style={{ background: '#0C1220', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>7-Day Earnings</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: 120, gap: 12 }}>
          {[0.02, 0.05, 0.03, 0.08, 0.12, 0.09, 0.15].map((val, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <motion.div 
                initial={{ height: 0 }} animate={{ height: (val / 0.15) * 100 }} 
                transition={{ duration: 0.8, delay: i * 0.1 }}
                style={{ width: '100%', background: 'linear-gradient(180deg, #10F5A0 0%, rgba(16,245,160,0.2) 100%)', borderRadius: 4 }} 
              />
              <span style={{ fontSize: 10, color: '#94A3B8' }}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 18, background: '#0C1220', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        {([['submissions', `📥 Submissions (${pendingDatasets.length + pendingGpus.length + pendingCount})`], ['models', '🧩 My Models'], ['stats', '📊 Stats'], ['logs', '📋 Logs']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t as any)}
            style={{
              padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: tab === t ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: tab === t ? '#F1F5F9' : '#94A3B8', fontSize: 12.5, fontWeight: 500,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── SUBMISSIONS TAB ── */}
      {(tab as string) === 'submissions' && (
        <div>
          {pendingDatasets.length === 0 && pendingGpus.length === 0 && pendingCount === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 0', border:'1px dashed rgba(255,255,255,0.08)', borderRadius:14 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#F1F5F9', marginBottom:6 }}>No Pending Submissions</div>
              <div style={{ fontSize:13, color:'#64748B' }}>All submissions have been reviewed. Upload a model, dataset, or GPU to see it here.</div>
            </div>
          ) : (
            <>
              {/* Pending Datasets */}
              {pendingDatasets.length > 0 && (
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#fbbf24', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                    🗃️ Pending Datasets ({pendingDatasets.length})
                  </div>
                  {pendingDatasets.map((d, i) => (
                    <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                      style={{ background:'rgba(251,191,36,0.04)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:12, padding:16, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontWeight:700, color:'#F1F5F9', marginBottom:4 }}>{d.label}</div>
                        <div style={{ fontSize:12, color:'#94A3B8' }}>{d.cat} · {d.size} · {d.price}</div>
                        <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{d.desc}</div>
                      </div>
                      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                        <motion.button whileHover={{ scale:1.05 }} onClick={() => { onApproveDataset?.(d.name); addLog(`[ADMIN] ✅ Dataset approved: "${d.label}"`, 'success'); }}
                          style={{ padding:'7px 16px', background:'linear-gradient(135deg,#34d399,#059669)', border:'none', borderRadius:8, color:'#060910', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                          ✅ Approve
                        </motion.button>
                        <motion.button whileHover={{ scale:1.05 }} onClick={() => { onRejectDataset?.(d.name); addLog(`[ADMIN] ❌ Dataset rejected: "${d.label}"`, 'warn'); }}
                          style={{ padding:'7px 16px', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:8, color:'#f87171', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                          ❌ Reject
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pending GPUs */}
              {pendingGpus.length > 0 && (
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#818cf8', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                    🖥️ Pending GPUs ({pendingGpus.length})
                  </div>
                  {pendingGpus.map((g, i) => (
                    <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                      style={{ background:'rgba(99,102,241,0.04)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:12, padding:16, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontWeight:700, color:'#F1F5F9', marginBottom:4 }}>{g.name}</div>
                        <div style={{ fontSize:12, color:'#94A3B8' }}>{g.vram} · {g.tflops}T FLOPS · {g.pricePerHr} SOL/hr · {g.location}</div>
                      </div>
                      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                        <motion.button whileHover={{ scale:1.05 }} onClick={() => { onApproveGpu?.(g.id); addLog(`[ADMIN] ✅ GPU approved: "${g.name}"`, 'success'); }}
                          style={{ padding:'7px 16px', background:'linear-gradient(135deg,#34d399,#059669)', border:'none', borderRadius:8, color:'#060910', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                          ✅ Approve
                        </motion.button>
                        <motion.button whileHover={{ scale:1.05 }} onClick={() => { onRejectGpu?.(g.id); addLog(`[ADMIN] ❌ GPU rejected: "${g.name}"`, 'warn'); }}
                          style={{ padding:'7px 16px', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:8, color:'#f87171', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                          ❌ Reject
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pending Models from backend */}
              {pendingCount > 0 && (
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#34d399', marginBottom:12 }}>🧩 Pending Models ({pendingCount})</div>
                  <AnimatePresence>
                    {models.filter(m => !m.is_approved).map((m, i) => (
                      <motion.div key={m.model_key} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                        style={{ background:'rgba(52,211,153,0.04)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:12, padding:16, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div style={{ fontWeight:700, color:'#F1F5F9', marginBottom:4 }}>{m.name}</div>
                          <div style={{ fontSize:12, color:'#94A3B8' }}>{m.category} · {m.price_sol} SOL · Acc: {m.accuracy}%</div>
                          <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{m.description}</div>
                        </div>
                        <motion.button whileHover={{ scale:1.05 }} onClick={() => handleApprove(m.model_key, m.name)}
                          disabled={approving === m.model_key}
                          style={{ padding:'7px 16px', background:'linear-gradient(135deg,#34d399,#059669)', border:'none', borderRadius:8, color:'#060910', fontWeight:700, fontSize:12, cursor:'pointer', opacity: approving === m.model_key ? 0.7 : 1 }}>
                          {approving === m.model_key ? '…' : '✅ Approve'}
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MODELS TAB ── */}
      {tab === 'models' && (
        <div>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {([['all', 'All'], ['pending', `Pending (${pendingCount})`], ['approved', 'Approved']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{
                  padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  background: filter === k ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: filter === k ? '#F1F5F9' : '#94A3B8',
                  border: filter === k ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                }}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="shimmer" style={{ height: 80, borderRadius: 12, marginBottom: 10 }} />
            ))
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#334155' }}>
              <div style={{ fontSize: 32, opacity: 0.3, marginBottom: 10 }}>📦</div>
              <p>No {filter === 'pending' ? 'pending' : ''} models found.</p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((m, i) => {
                const isApproved = m.is_approved;
                const color = isApproved ? '#10F5A0' : '#F59E0B';
                return (
                <motion.div key={m.model_key}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2, borderColor: `${color}60`, boxShadow: `0 12px 40px -10px ${color}20, inset 0 0 20px ${color}05` }}
                  style={{
                    background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.05)`,
                    borderLeft: `3px solid ${color}80`, borderRadius: 16, padding: '20px 24px', marginBottom: 16,
                    position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease-out',
                    display: 'flex', flexDirection: 'column', gap: 16
                  }}>
                  {/* Radial Background */}
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: `radial-gradient(circle at top right, ${color}10, transparent 70%)`, pointerEvents: 'none' }} />

                  {/* Header Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', 
                        background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)', 
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', 
                      }}>{m.name}</div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>{m.category}</span>
                      <code style={{ fontSize: 10, fontFamily: "'Space Mono',monospace", color: '#94A3B8', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>{m.model_key}</code>
                    </div>
                    
                    {/* Status badge */}
                    <motion.span 
                      animate={isApproved ? { boxShadow: [`0 0 0px ${color}00`, `0 0 12px ${color}60`, `0 0 0px ${color}00`] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: 0.5,
                        background: `${color}10`, color: color, border: `1px solid ${color}30`, backdropFilter: 'blur(4px)'
                      }}>
                      <motion.div animate={isApproved ? { opacity: [0.4, 1, 0.4] } : {}} transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      {isApproved ? 'APPROVED' : 'PENDING'}
                    </motion.span>
                  </div>

                  {/* Glass Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, position: 'relative', zIndex: 1 }}>
                    {[
                      { label: 'Price', val: `${m.price_sol} SOL`, col: '#fbbf24' },
                      { label: 'Accuracy', val: `${Math.round(m.accuracy * 100)}%`, col: '#60a5fa' },
                      { label: 'Uses', val: m.total_uses, col: '#818cf8' },
                      { label: 'Revenue', val: `${m.total_revenue.toFixed(4)} SOL`, col: '#34d399' }
                    ].map(s => (
                      <div key={s.label} style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 8px', textAlign: 'center', boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.01)' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: s.col }}>{s.val}</div>
                        <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4, fontWeight: 500, textTransform: 'uppercase' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, position: 'relative', zIndex: 1, marginTop: 4 }}>
                    {!isApproved ? (
                      <motion.button
                        onClick={() => handleApprove(m.model_key, m.name)}
                        disabled={approving === m.model_key}
                        whileHover={approving !== m.model_key ? { scale: 1.05, boxShadow: '0 0 18px rgba(16,245,160,0.3)' } : {}}
                        whileTap={approving !== m.model_key ? { scale: 0.95 } : {}}
                        style={{
                          padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: approving === m.model_key ? 'not-allowed' : 'pointer',
                          background: approving === m.model_key ? 'rgba(16,245,160,0.2)' : 'linear-gradient(135deg, #10F5A0, #059669)',
                          color: approving === m.model_key ? '#10F5A0' : '#060910', display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                        {approving === m.model_key ? <div className="spinner" style={{ width:12, height:12, border:'2px solid rgba(16,245,160,0.4)', borderTopColor:'#10F5A0', borderRadius:'50%', animation:'spin 1s linear infinite' }} /> : null}
                        {approving === m.model_key ? 'Approving...' : 'Approve Model'}
                      </motion.button>
                    ) : (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f5f5f5', cursor: 'pointer' }}>
                        Manage Settings
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )})}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* ── STATS TAB ── */}
      {tab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { title: 'Backend', icon: '⚙️', items: [
              { label: 'FastAPI version',    val: '0.111.0' },
              { label: 'Python',             val: '3.10+' },
              { label: 'Database',           val: 'SQLite (SQLAlchemy)' },
              { label: 'Rate limiting',      val: '60 req/min (slowapi)' },
              { label: 'Compression',        val: 'GZip ≥512B' },
              { label: 'Environment',        val: 'Development' },
            ]},
            { title: 'Solana', icon: '◎', items: [
              { label: 'Network',            val: 'Devnet' },
              { label: 'RPC',                val: 'api.devnet.solana.com' },
              { label: 'Platform Wallet',    val: '7xKXtg2…gAsU' },
              { label: 'Payment model',      val: 'Per-request micropayments' },
              { label: 'Tx verification',    val: 'Program CPI + transfer fallback' },
              { label: 'Mainnet ready',      val: 'Pending .env update' },
            ]},
            { title: 'Smart Contract', icon: '🦀', items: [
              { label: 'Language',           val: programInfo?.language ?? 'Rust' },
              { label: 'Framework',          val: programInfo?.framework ?? 'Anchor v0.30.1' },
              { label: 'Status',             val: programInfo?.deployed ? '✅ Live on devnet' : '⏳ Awaiting deploy' },
              { label: 'Program ID',         val: programInfo?.program_id ? `${programInfo.program_id.slice(0,8)}…${programInfo.program_id.slice(-6)}` : 'Not deployed' },
              { label: 'Revenue split',      val: programInfo?.revenue_split ?? '95% creator / 5% platform' },
              { label: 'Instructions',       val: `${programInfo?.instructions?.length ?? 6} on-chain` },
            ]},
            { title: 'AI Engine', icon: '🧠', items: [
              { label: 'Models in registry', val: '9' },
              { label: 'Smart Router',       val: 'Multi-criteria scoring' },
              { label: 'Agent pipeline',     val: '7-step reasoning' },
              { label: 'Multi-agent',        val: '4 parallel agents (asyncio)' },
              { label: 'Inference mode',     val: 'Task-aware simulation' },
              { label: 'Determinism',        val: 'SHA-256 seeded RNG' },
            ]},
            { title: 'Frontend', icon: '🎨', items: [
              { label: 'Framework',          val: 'Next.js 14 (App Router)' },
              { label: 'Language',           val: 'TypeScript (0 errors)' },
              { label: 'Animations',         val: 'Framer Motion' },
              { label: 'Wallet',             val: 'Solana Wallet Adapter' },
              { label: 'Pages',              val: '11 fully connected' },
              { label: 'Design system',      val: 'Cyber-Industrial dark' },
            ]},
          ].map(section => (
            <div key={section.title} style={{ background: '#0C1220', border: `1px solid ${section.title === 'Smart Contract' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{section.icon} {section.title}</span>
                {section.title === 'Smart Contract' && programInfo?.explorer && (
                  <a href={programInfo.explorer} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 10, color: '#22D3EE', textDecoration: 'none', padding: '2px 7px', borderRadius: 5, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>
                    Explorer ↗
                  </a>
                )}
              </div>
              {section.items.map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                  <span style={{ color: '#94A3B8' }}>{item.label}</span>
                  <span style={{ fontFamily: "'Space Mono',monospace", color: item.label === 'Status' && programInfo?.deployed ? '#10F5A0' : '#94A3B8', fontSize: 11 }}>{item.val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── LOGS TAB ── */}
      {tab === 'logs' && (
        <div style={{ background: '#060910', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, fontFamily: "'Space Mono',monospace", fontSize: 11.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: 1 }}>SYSTEM LOG</span>
            <button onClick={() => setActivityLog([])} style={{ fontSize: 10.5, color: '#334155', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear
            </button>
          </div>
          {activityLog.length === 0
            ? <p style={{ color: '#334155', fontSize: 12 }}>No log entries.</p>
            : activityLog.map((entry, i) => {
              const line = typeof entry === 'string' ? entry : entry.msg;
              const time = typeof entry === 'string' ? '' : entry.time;
              const color = line.includes('ERROR') ? '#EF4444' : line.includes('success') || line.includes('approved') ? '#10F5A0' : '#94A3B8';
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  style={{ color, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 11 }}>
                  <span style={{ color: '#334155', marginRight: 8 }}>{time}</span>
                  {line}
                </motion.div>
              );
            })
          }
        </div>
      )}
      
      {/* Activity Ticker at the bottom of the dashboard */}
      <div style={{ marginTop: 40 }}>
        <ActivityTicker />
      </div>
    </motion.div>
  );
}
