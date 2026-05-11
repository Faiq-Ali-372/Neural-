'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogLine, PendingPayment } from '@/app/page';

interface Props { addLog:(m:string,t?:LogLine['type'])=>void; requestPayment:(p:PendingPayment)=>void; setLastModel:(m:any)=>void; onNavigate:(p:string)=>void; onPurchaseComplete?:(g:any)=>void; pendingGpus?:any[]; approvedGpus?:any[]; onAddPending?:(g:any)=>void; onRemovePending?:(id:string)=>void; }

const GPU_DATA = [
  { id:'gpu-001', name:'NVIDIA RTX 4090', vram:'24GB GDDR6X', cuda:16384, tflops:82.6, pricePerHr:'0.08', priceSOL:0.08, provider:'0x7xKX…AsU', providerName:'AlphaRig Labs', rating:4.9, jobs:412, location:'Frankfurt, DE', uptime:99.8, status:'available', tags:['LLM Fine-tuning','Stable Diffusion','Training'] },
  { id:'gpu-002', name:'NVIDIA A100 80GB', vram:'80GB HBM2e', cuda:6912, tflops:77.6, pricePerHr:'0.15', priceSOL:0.15, provider:'0x3mJK…Bq2', providerName:'CloudMiner Pro', rating:5.0, jobs:891, location:'Singapore', uptime:100, status:'available', tags:['Large Models','Multi-GPU','Research'] },
  { id:'gpu-003', name:'NVIDIA RTX 3090', vram:'24GB GDDR6X', cuda:10496, tflops:35.6, pricePerHr:'0.04', priceSOL:0.04, provider:'0x9pLM…Rc1', providerName:'DevNode XR', rating:4.7, jobs:234, location:'New York, US', uptime:97.2, status:'available', tags:['Fine-tuning','Inference','Budget'] },
  { id:'gpu-004', name:'NVIDIA H100 SXM', vram:'80GB HBM3', cuda:16896, tflops:133.8, pricePerHr:'0.35', priceSOL:0.35, provider:'0x2nPQ…Wz8', providerName:'HyperScale AI', rating:4.8, jobs:156, location:'London, UK', uptime:99.5, status:'busy', tags:['Frontier Models','MoE','Enterprise'] },
  { id:'gpu-005', name:'AMD RX 7900 XTX', vram:'24GB GDDR6', cuda:0, tflops:61.4, pricePerHr:'0.03', priceSOL:0.03, provider:'0x5tRS…Kd4', providerName:'ROCm Warrior', rating:4.5, jobs:78, location:'Tokyo, JP', uptime:96.1, status:'available', tags:['ROCm','Inference','Budget'] },
  { id:'gpu-006', name:'NVIDIA RTX 4080', vram:'16GB GDDR6X', cuda:9728, tflops:48.7, pricePerHr:'0.06', priceSOL:0.06, provider:'0x8vHT…Np3', providerName:'NeuralNode EU', rating:4.6, jobs:301, location:'Amsterdam, NL', uptime:98.4, status:'available', tags:['Stable Diffusion','Inference','Mid-range'] },
];

const inputS: React.CSSProperties = { width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 14px', color:'#F1F5F9', fontSize:13, outline:'none', fontFamily:"'Space Grotesk',sans-serif" };
const labelS: React.CSSProperties = { fontSize:12, fontWeight:600, color:'#94A3B8', display:'block', marginBottom:6 };

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20,
      background: status === 'available' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
      color: status === 'available' ? '#34d399' : '#fbbf24',
      border: `1px solid ${status === 'available' ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}`,
    }}>
      {status === 'available' ? '● Available' : '◌ Busy'}
    </span>
  );
}

export default function ComputePage({ addLog, requestPayment, onPurchaseComplete, pendingGpus = [], approvedGpus = [], onAddPending, onRemovePending }: Props) {
  const [tab, setTab] = useState<'browse'|'list'>('browse');
  const [filter, setFilter] = useState('All');
  const [rentalHours, setRentalHours] = useState<Record<string,number>>({});
  const [escrowModal, setEscrowModal] = useState<typeof GPU_DATA[number]|null>(null);

  // List form state
  const [gpuName, setGpuName] = useState('');
  const [gpuVram, setGpuVram] = useState('');
  const [gpuTflops, setGpuTflops] = useState('');
  const [gpuPrice, setGpuPrice] = useState('0.05');
  const [gpuLocation, setGpuLocation] = useState('');
  const [gpuDesc, setGpuDesc] = useState('');
  const [listedGpus, setListedGpus] = useState<any[]>([]);

  const filters = ['All', 'Available', 'Budget (<0.05)', 'High-end (>0.10)'];
  const visible = GPU_DATA.filter(g => {
    if (filter === 'Available') return g.status === 'available';
    if (filter === 'Budget (<0.05)') return g.priceSOL < 0.05;
    if (filter === 'High-end (>0.10)') return g.priceSOL > 0.10;
    return true;
  });

  const hours = (id: string) => rentalHours[id] ?? 1;

  const handleRent = (gpu: typeof GPU_DATA[number]) => {
    if (gpu.status !== 'available') { addLog(`[COMPUTE] ${gpu.name} is currently busy`, 'warn'); return; }
    setEscrowModal(gpu);
  };

  const confirmEscrow = (gpu: typeof GPU_DATA[number]) => {
    const h = hours(gpu.id);
    const total = (gpu.priceSOL * h).toFixed(4);
    setEscrowModal(null);
    requestPayment({
      amount: `${total} SOL`,
      description: `GPU Rental Escrow · ${h}h`,
      service: gpu.name,
      onPaid: (sig) => {
        addLog(`[COMPUTE] ✅ Escrow locked for ${gpu.name} · ${h}h · ${total} SOL`, 'success');
        addLog(`[COMPUTE] Tx: ${sig.slice(0,18)}…`, 'info');
        addLog(`[COMPUTE] GPU access granted — streaming SOL to provider per minute`, 'info');
        if (onPurchaseComplete) onPurchaseComplete({ ...gpu, type: 'gpu', rentedHours: h, totalCost: total });
      }
    });
  };

  const publishGpu = () => {
    if (!gpuName.trim()) { addLog('[COMPUTE] GPU name required', 'error'); return; }
    if (!gpuVram.trim()) { addLog('[COMPUTE] VRAM required', 'error'); return; }
    requestPayment({
      amount: '0.005 SOL',
      description: 'GPU Listing Fee',
      service: gpuName,
      onPaid: (sig) => {
        const newGpu = {
          id: `user-gpu-${Date.now()}`, name: gpuName, vram: gpuVram,
          tflops: parseFloat(gpuTflops) || 0, pricePerHr: gpuPrice,
          priceSOL: parseFloat(gpuPrice), provider: 'You', providerName: 'My GPU',
          rating: 5.0, jobs: 0, location: gpuLocation || 'Unknown',
          uptime: 100, status: 'pending',
          tags: ['Custom', 'New'], desc: gpuDesc
        };
        onAddPending?.(newGpu);
        addLog(`[COMPUTE] GPU submitted for approval: "${gpuName}"`, 'success');
        addLog(`[COMPUTE] ⏳ Check Creator panel to review and approve`, 'info');
        setGpuName(''); setGpuVram(''); setGpuTflops(''); setGpuDesc(''); setGpuLocation('');
      }
    });
  };

  const allGpus = [...approvedGpus, ...listedGpus, ...visible];

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.1))', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>⚡</div>
          <div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, margin:0 }}>GPU Compute</h2>
            <p style={{ color:'#94A3B8', fontSize:13, margin:0 }}>Rent decentralized GPU power · Pay per hour in SOL · Trustless escrow</p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:'flex', gap:12, marginTop:14 }}>
          {[
            { label:'Available GPUs', val: GPU_DATA.filter(g=>g.status==='available').length + listedGpus.length, color:'#34d399' },
            { label:'Avg Price/hr', val:'0.085 SOL', color:'#fbbf24' },
            { label:'Total Jobs Done', val:'2,072+', color:'#818cf8' },
            { label:'Escrow Protection', val:'100%', color:'#60a5fa' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 16px', flex:1 }}>
              <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, marginBottom:20, background:'#0C1220', borderRadius:10, padding:4, width:'fit-content', border:'1px solid rgba(255,255,255,0.06)' }}>
        {(['browse','list'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'7px 20px', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', border:'none',
              background: tab===t ? 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.15))' : 'transparent',
              color: tab===t ? '#F1F5F9' : '#64748B' }}>
            {t === 'browse' ? '🔍 Browse GPUs' : '➕ List Your GPU'}
          </button>
        ))}
      </div>

      {/* BROWSE TAB */}
      {tab === 'browse' && (
        <>
          {/* Filters */}
          <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'5px 14px', borderRadius:20, fontSize:12, cursor:'pointer',
                  background: filter===f ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: filter===f ? '#818cf8' : '#94A3B8',
                  border: filter===f ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.06)' }}>
                {f}
              </button>
            ))}
          </div>

          {/* x402 Info Banner */}
          <div style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))', border:'1px solid rgba(99,102,241,0.15)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:20 }}>🔒</span>
            <div>
              <span style={{ fontSize:13, fontWeight:600, color:'#a5b4fc' }}>Trustless Escrow via Solana Smart Contract</span>
              <span style={{ fontSize:12, color:'#64748B', marginLeft:8 }}>Powered by x402 Payment Protocol · SOL streams per-minute to provider · Auto-refund on downtime</span>
            </div>
          </div>

          {/* Pending Approval */}
          {pendingGpus.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <span style={{ fontSize:16 }}>⏳</span>
                <h3 style={{ fontSize:14, fontWeight:700, color:'#fbbf24', margin:0 }}>Pending Approval ({pendingGpus.length})</h3>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
                {pendingGpus.map((gpu, i) => (
                  <motion.div key={gpu.id ?? i}
                    style={{ background:'rgba(251,191,36,0.04)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:16, padding:22, display:'flex', flexDirection:'column', position:'relative', overflow:'hidden', opacity:0.85 }}>
                    <div style={{ position:'absolute', top:12, right:12, fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(251,191,36,0.15)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.3)' }}>⏳ Pending Review</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                      <span style={{ fontSize:24 }}>🖥️</span>
                      <div>
                        <div style={{ fontWeight:800, fontSize:14, color:'#F1F5F9' }}>{gpu.name}</div>
                        <div style={{ fontSize:11, color:'#64748B' }}>{gpu.providerName} · ⭐ {gpu.rating}</div>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
                      {[
                        { label:'VRAM', val:gpu.vram, color:'#60a5fa' },
                        { label:'TFLOPS', val:gpu.tflops+'T', color:'#a78bfa' },
                        { label:'Uptime', val:gpu.uptime+'%', color:'#34d399' },
                      ].map(s => (
                        <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8, padding:'7px 6px', textAlign:'center' }}>
                          <div style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.val}</div>
                          <div style={{ fontSize:9, color:'#64748B', marginTop:2, textTransform:'uppercase' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:14 }}>
                      {gpu.tags.map((tag:string) => (
                        <span key={tag} style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:'rgba(251,191,36,0.1)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.2)' }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748B' }}>
                      <span>📍 {gpu.location}</span>
                      <span style={{ color:'#fbbf24', fontWeight:700 }}>{gpu.pricePerHr} SOL/hr</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* GPU Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
            {allGpus.map((gpu, i) => (
              <motion.div key={gpu.id ?? i}
                whileHover={{ y:-4, borderColor:'rgba(99,102,241,0.3)', boxShadow:'0 16px 48px -12px rgba(99,102,241,0.2)' }}
                style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:22, display:'flex', flexDirection:'column', transition:'all 0.3s', position:'relative', overflow:'hidden' }}>

                {/* Glow */}
                <div style={{ position:'absolute', top:0, right:0, width:100, height:100, background:'radial-gradient(circle at top right, rgba(99,102,241,0.1), transparent 70%)', pointerEvents:'none' }} />

                {/* Top Row */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:24 }}>🖥️</span>
                    <div>
                      <div style={{ fontWeight:800, fontSize:14, color:'#F1F5F9' }}>{gpu.name}</div>
                      <div style={{ fontSize:11, color:'#64748B' }}>{gpu.providerName ?? 'My GPU'} · ⭐ {gpu.rating}</div>
                    </div>
                  </div>
                  <StatusBadge status={gpu.status} />
                </div>

                {/* Specs */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
                  {[
                    { label:'VRAM', val:gpu.vram, color:'#60a5fa' },
                    { label:'TFLOPS', val:gpu.tflops+'T', color:'#a78bfa' },
                    { label:'Uptime', val:gpu.uptime+'%', color:'#34d399' },
                  ].map(s => (
                    <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8, padding:'7px 6px', textAlign:'center' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.val}</div>
                      <div style={{ fontSize:9, color:'#64748B', marginTop:2, textTransform:'uppercase' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:14 }}>
                  {gpu.tags.map((tag:string) => (
                    <span key={tag} style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:'rgba(99,102,241,0.1)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.2)' }}>{tag}</span>
                  ))}
                </div>

                {/* Location + Jobs */}
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748B', marginBottom:16 }}>
                  <span>📍 {gpu.location}</span>
                  <span>✅ {gpu.jobs} jobs</span>
                </div>

                {/* Rental Controls */}
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
                  <div style={{ flex:1 }}>
                    <label style={{ ...labelS, marginBottom:4 }}>Hours</label>
                    <input type="number" min={1} max={72} value={hours(gpu.id)}
                      onChange={e => setRentalHours(prev => ({ ...prev, [gpu.id]: parseInt(e.target.value)||1 }))}
                      style={{ ...inputS, textAlign:'center', padding:'8px' }} />
                  </div>
                  <div style={{ flex:1, textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'#64748B', marginBottom:4 }}>TOTAL COST</div>
                    <div style={{ fontSize:16, fontWeight:800, color:'#fbbf24' }}>
                      {(gpu.priceSOL * hours(gpu.id)).toFixed(4)} SOL
                    </div>
                    <div style={{ fontSize:10, color:'#64748B' }}>{gpu.pricePerHr} SOL/hr</div>
                  </div>
                </div>

                {/* Rent Button */}
                <motion.button onClick={() => handleRent(gpu)}
                  whileHover={gpu.status==='available' ? { scale:1.02, boxShadow:'0 0 24px rgba(99,102,241,0.4)' } : {}}
                  whileTap={gpu.status==='available' ? { scale:0.98 } : {}}
                  style={{ width:'100%', padding:'11px 0', borderRadius:9, fontSize:13, fontWeight:700, cursor: gpu.status==='available' ? 'pointer' : 'not-allowed', border:'none',
                    background: gpu.status==='available' ? 'linear-gradient(135deg,#6366F1,#4F46E5)' : 'rgba(255,255,255,0.05)',
                    color: gpu.status==='available' ? '#fff' : '#64748B' }}>
                  {gpu.status === 'available' ? '⚡ Rent with Escrow' : '⏳ Currently Busy'}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* LIST YOUR GPU TAB */}
      {tab === 'list' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16 }}>
          <div>
            {/* How it works */}
            <div style={{ background:'linear-gradient(135deg,rgba(52,211,153,0.06),rgba(16,185,129,0.04))', border:'1px solid rgba(52,211,153,0.15)', borderRadius:12, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#34d399', marginBottom:8 }}>💡 How GPU Listing Works</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  '1. Fill in your GPU specs and set your hourly SOL price',
                  '2. Pay a tiny 0.005 SOL listing fee (on-chain registration)',
                  '3. Your GPU appears in the marketplace immediately',
                  '4. When rented, SOL streams to your wallet per minute via x402',
                ].map((s,i) => (
                  <div key={i} style={{ fontSize:12, color:'#94A3B8', padding:'8px 10px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:'1px solid rgba(255,255,255,0.04)' }}>{s}</div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div style={{ background:'#0C1220', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:20 }}>
              <h3 style={{ marginBottom:18, fontSize:15, fontWeight:700 }}>GPU Specifications</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                <div>
                  <label style={labelS}>GPU Model *</label>
                  <input value={gpuName} onChange={e=>setGpuName(e.target.value)} placeholder="e.g. NVIDIA RTX 4090" style={inputS} />
                </div>
                <div>
                  <label style={labelS}>VRAM *</label>
                  <input value={gpuVram} onChange={e=>setGpuVram(e.target.value)} placeholder="e.g. 24GB GDDR6X" style={inputS} />
                </div>
                <div>
                  <label style={labelS}>TFLOPS (FP32)</label>
                  <input type="number" value={gpuTflops} onChange={e=>setGpuTflops(e.target.value)} placeholder="e.g. 82.6" style={inputS} />
                </div>
                <div>
                  <label style={labelS}>Location</label>
                  <input value={gpuLocation} onChange={e=>setGpuLocation(e.target.value)} placeholder="e.g. New York, US" style={inputS} />
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={labelS}>What workloads is your GPU best for?</label>
                <textarea value={gpuDesc} onChange={e=>setGpuDesc(e.target.value)}
                  placeholder="e.g. Best for LLM fine-tuning, Stable Diffusion, PyTorch training jobs..."
                  style={{ ...inputS, minHeight:80, resize:'vertical' }} />
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div>
            <div style={{ background:'#0C1220', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:18, marginBottom:12 }}>
              <h3 style={{ marginBottom:14, fontSize:14, fontWeight:700 }}>💰 Pricing</h3>
              <div style={{ marginBottom:12 }}>
                <label style={labelS}>Rate (SOL / hour)</label>
                <input type="number" value={gpuPrice} onChange={e=>setGpuPrice(e.target.value)} step="0.01" min="0.01" style={inputS} />
              </div>
              <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:10, padding:12, border:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize:11, color:'#64748B', marginBottom:6 }}>EARNINGS ESTIMATE</div>
                {[['Per hour', `${gpuPrice} SOL`], ['Per day (24h)', `${(parseFloat(gpuPrice||'0')*24).toFixed(3)} SOL`], ['Per week', `${(parseFloat(gpuPrice||'0')*24*7).toFixed(2)} SOL`]].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:'#94A3B8' }}>{l}</span>
                    <span style={{ color:'#34d399', fontWeight:700 }}>{v}</span>
                  </div>
                ))}
                <div style={{ fontSize:10, color:'#64748B', marginTop:8, borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:8 }}>95% goes to you · 5% platform fee · Paid in real-time via x402 streaming</div>
              </div>
            </div>

            <motion.button onClick={publishGpu} whileHover={{ boxShadow:'0 0 28px rgba(52,211,153,0.4)', scale:1.02 }} whileTap={{ scale:0.98 }}
              style={{ width:'100%', padding:'13px 0', background:'linear-gradient(135deg,#34d399,#059669)', color:'#060910', border:'none', borderRadius:10, fontSize:14, fontWeight:800, cursor:'pointer' }}>
              🚀 List My GPU · 0.005 SOL
            </motion.button>
            <p style={{ fontSize:11, color:'#64748B', textAlign:'center', marginTop:8 }}>One-time listing fee · Appear on marketplace instantly</p>
          </div>
        </div>
      )}

      {/* Escrow Confirmation Modal */}
      <AnimatePresence>
        {escrowModal && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setEscrowModal(null)}
              style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', zIndex:1000 }} />
            <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.92 }}
              style={{ position:'fixed', top:0, left:0, right:0, bottom:0, margin:'auto', zIndex:1001, height:'fit-content',
                background:'linear-gradient(145deg,#0f1629,#0a0f1e)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:20, padding:32, width:420, maxWidth:'90vw' }}>

              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🔒</div>
                <h3 style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>Lock Escrow on Solana</h3>
                <p style={{ fontSize:12, color:'#94A3B8' }}>Your SOL will be locked in a smart contract and streamed to the provider per minute. Auto-refunded if the GPU goes offline.</p>
              </div>

              <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:12, padding:16, marginBottom:20, border:'1px solid rgba(255,255,255,0.06)' }}>
                {[
                  ['GPU', escrowModal.name],
                  ['Provider', escrowModal.providerName],
                  ['Duration', `${hours(escrowModal.id)} hour(s)`],
                  ['Rate', `${escrowModal.pricePerHr} SOL/hr`],
                  ['Total Escrow', `${(escrowModal.priceSOL * hours(escrowModal.id)).toFixed(4)} SOL`],
                  ['Protection', 'Auto-refund on downtime ✅'],
                ].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color:'#64748B' }}>{l}</span>
                    <span style={{ color: l==='Total Escrow' ? '#fbbf24' : '#F1F5F9', fontWeight: l==='Total Escrow' ? 800 : 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setEscrowModal(null)}
                  style={{ flex:1, padding:'11px 0', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'#94A3B8', fontSize:13, cursor:'pointer' }}>
                  Cancel
                </button>
                <motion.button onClick={() => confirmEscrow(escrowModal)}
                  whileHover={{ boxShadow:'0 0 24px rgba(99,102,241,0.5)' }}
                  style={{ flex:2, padding:'11px 0', background:'linear-gradient(135deg,#6366F1,#4F46E5)', border:'none', borderRadius:9, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  ⚡ Confirm &amp; Lock Escrow
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
