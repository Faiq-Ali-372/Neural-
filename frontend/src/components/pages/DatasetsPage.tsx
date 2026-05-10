'use client';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { LogLine, PendingPayment } from '@/app/page';

interface Props { addLog:(m:string,t?:LogLine['type'])=>void; requestPayment:(p:PendingPayment)=>void; setLastModel:(m:any)=>void; onNavigate:(p:string)=>void; onPurchaseComplete?:(d:any)=>void; }

const DS_DATA = [
  { name:'crypto_sentiment', label:'Crypto Sentiment', desc:'2M tweets + Reddit posts labelled bullish/bearish', cat:'NLP', price:'0.05 SOL', rows:'2.1M rows', size:'340MB', downloads:841, free:false },
  { name:'defi_tvl', label:'DeFi TVL History', desc:'Daily TVL for 500+ protocols from 2020 to present', cat:'DeFi', price:'0.03 SOL', rows:'180k rows', size:'28MB', downloads:1203, free:false },
  { name:'btc_ohlcv', label:'BTC OHLCV 1-min', desc:'1-minute BTC/USD tick data from 5 exchanges, 2018-2024', cat:'Crypto', price:'0.08 SOL', rows:'3.2M rows', size:'890MB', downloads:672, free:false },
  { name:'nft_floor_prices', label:'NFT Floor Prices', desc:'Hourly floor prices for top 200 collections, 2021-2024', cat:'NFT', price:'0.04 SOL', rows:'850k rows', size:'120MB', downloads:445, free:false },
  { name:'wallet_patterns', label:'Wallet Patterns', desc:'Anonymized wallet behavior clusters from Ethereum mainnet', cat:'DeFi', price:'0.12 SOL', rows:'5.7M rows', size:'1.2GB', downloads:298, free:false },
  { name:'sol_metrics', label:'Solana Protocol Metrics', desc:'Daily metrics for all Solana protocols: users, vol, fees', cat:'Crypto', price:'Free', rows:'220k rows', size:'45MB', downloads:2841, free:true },
];

const CAT_FILTERS = ['All','Crypto','DeFi','NLP','NFT','Free'];
const inputStyle: React.CSSProperties = { width:'100%', background:'#111828', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 14px', color:'#F1F5F9', fontFamily:"'Space Grotesk',sans-serif", fontSize:13, outline:'none' };
const labelStyle: React.CSSProperties = { fontSize:12, fontWeight:600, color:'#94A3B8', display:'block', marginBottom:6 };
const cardStyle: React.CSSProperties = { background:'#0C1220', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:18, marginBottom:14 };

export default function DatasetsPage({ addLog, requestPayment, onPurchaseComplete }: Props) {
  const [tab, setTab] = useState<'browse'|'upload'|'mine'>('browse');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dsName, setDsName] = useState('');
  const [dsCat, setDsCat] = useState('Crypto / Finance');
  const [dsDesc, setDsDesc] = useState('');
  const [dsPrice, setDsPrice] = useState('0.05');
  const [dsLicense, setDsLicense] = useState('CC BY 4.0');
  const [dsFiles, setDsFiles] = useState<{name:string;size:number}[]>([]);
  const [myDatasets, setMyDatasets] = useState<typeof DS_DATA>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const visible = DS_DATA.filter(d => {
    const matchF = filter === 'All' || (filter === 'Free' ? d.free : d.cat === filter);
    const matchS = !search || d.label.toLowerCase().includes(search.toLowerCase()) || d.desc.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const access = (d: typeof DS_DATA[number]) => {
    if (d.free) { 
      addLog(`[DATASET] Downloaded: ${d.label}`, 'success');
      if (onPurchaseComplete) onPurchaseComplete(d);
      const blob = new Blob([`Dummy data for ${d.label}\nColumn1,Column2,Column3\nValue1,Value2,Value3\n`], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${d.name}_sample.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return; 
    }
    requestPayment({
      amount: d.price, description: 'Dataset Access', service: d.label,
      onPaid: (sig) => {
        addLog(`[DATASET] Access granted: ${d.label} — ${sig.slice(0,12)}…`, 'success');
        if (onPurchaseComplete) onPurchaseComplete(d);
      }
    });
  };

  const publish = () => {
    if (!dsName.trim()) { addLog('[DATASET] Name required', 'error'); return; }
    if (dsFiles.length === 0) { addLog('[DATASET] Please upload a file', 'error'); return; }
    requestPayment({
      amount: '0.01 SOL', description: 'Dataset Publishing Fee', service: dsName,
      onPaid: (sig) => {
        setMyDatasets(m => [{ name: dsName.toLowerCase().replace(/\s+/g,'_'), label: dsName, desc: dsDesc || 'No description', cat: dsCat.split('/')[0].trim(), price: `${dsPrice} SOL`, rows: '?', size: dsFiles[0]?(dsFiles[0].size/1048576).toFixed(1)+'MB':'?', downloads:0, free: parseFloat(dsPrice) === 0 }, ...m]);
        addLog(`[DATASET] Published: "${dsName}"`, 'success');
        setDsName(''); setDsDesc(''); setDsFiles([]); setTab('mine');
      }
    });
  };

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:21, fontWeight:800, marginBottom:4 }}>🗃️ Datasets</h2>
        <p style={{ color:'#94A3B8' }}>Browse, upload, and monetize training datasets.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:2, marginBottom:18, background:'#0C1220', borderRadius:10, padding:4, width:'fit-content', border:'1px solid rgba(255,255,255,0.06)' }}>
        {(['browse','upload','mine'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'6px 16px', borderRadius:7, fontSize:12.5, fontWeight:500, cursor:'pointer', border:'none',
              background: tab===t ? 'rgba(99,102,241,0.18)' : 'transparent',
              color: tab===t ? '#F1F5F9' : '#94A3B8' }}>
            {t === 'browse' ? 'Browse' : t === 'upload' ? 'Upload Dataset' : `My Datasets (${myDatasets.length})`}
          </button>
        ))}
      </div>

      {/* BROWSE TAB */}
      {tab === 'browse' && (
        <>
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search datasets…"
              style={{ ...inputStyle, maxWidth:240 }} />
            <div style={{ display:'flex', gap:5 }}>
              {CAT_FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding:'5px 12px', borderRadius:7, fontSize:12, cursor:'pointer',
                    background: filter===f ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: filter===f ? '#6366F1' : '#94A3B8',
                    border: filter===f ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.06)' }}>
                  {f}
                </button>
              ))}
            </div>
            <div style={{ marginLeft:'auto', fontSize:12, color:'#94A3B8' }}>{visible.length} datasets</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
            {visible.map(d => {
              const color = d.free ? '#10F5A0' : '#6366F1';
              return (
              <motion.div key={d.name} 
                whileHover={{ y: -4, borderColor: `${color}60`, boxShadow: `0 12px 40px -10px ${color}30, inset 0 0 20px ${color}10` }}
                style={{ 
                  background: 'rgba(255,255,255,0.025)', 
                  border: '1px solid rgba(255,255,255,0.04)', 
                  borderLeft: `3px solid ${color}80`,
                  borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column',
                  position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease-out'
                }}>
                
                {/* Background Glow */}
                <div style={{
                  position: 'absolute', top: 0, right: 0, width: 120, height: 120,
                  background: `radial-gradient(circle at top right, ${color}15, transparent 70%)`,
                  pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                    background: `${color}15`, color: color, border: `1px solid ${color}30` }}>
                    {d.cat}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', textShadow: '0 0 10px rgba(251,191,36,0.3)' }}>{d.price}</span>
                </div>
                
                <h3 style={{ 
                  fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', 
                  background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)', 
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', 
                  marginBottom: 8, position: 'relative', zIndex: 1 
                }}>
                  {d.label}
                </h3>
                
                <p style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.6, flex: 1, marginBottom: 20, position: 'relative', zIndex: 1 }}>{d.desc}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20, position: 'relative', zIndex: 1 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 4px', textAlign: 'center', boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.01)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f5f5f5' }}>{d.rows}</div>
                    <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4, fontWeight: 500, textTransform: 'uppercase' }}>Rows</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 4px', textAlign: 'center', boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.01)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>{d.size}</div>
                    <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4, fontWeight: 500, textTransform: 'uppercase' }}>Size</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 4px', textAlign: 'center', boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.01)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#818cf8' }}>{d.downloads.toLocaleString()}</div>
                    <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 4, fontWeight: 500, textTransform: 'uppercase' }}>DLs</div>
                  </div>
                </div>

                <motion.button onClick={() => access(d)} 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: d.free ? 'linear-gradient(135deg,#10F5A0,#059669)' : 'linear-gradient(135deg,#6366F1,#4F46E5)',
                    color: d.free ? '#060910' : '#fff', position: 'relative', zIndex: 1 }}>
                  {d.free ? '⬇️ Download Free' : `Purchase Access`}
                </motion.button>
              </motion.div>
            )})}
          </div>
        </>
      )}

      {/* UPLOAD TAB */}
      {tab === 'upload' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16 }}>
          <div>
            <div style={cardStyle}>
              <h3 style={{ marginBottom:16 }}>Dataset Info</h3>
              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Dataset Name *</label>
                <input value={dsName} onChange={e=>setDsName(e.target.value)} placeholder="e.g. Crypto Sentiment 2024" style={inputStyle} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <div style={{ position: 'relative' }} onMouseLeave={() => { const el = document.getElementById('ds-cat-dropdown'); if (el) el.style.display = 'none'; }}>
                    <div 
                      onClick={() => {
                        const el = document.getElementById('ds-cat-dropdown');
                        if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                      }}
                      style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      {dsCat}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    
                    <div id="ds-cat-dropdown" style={{ 
                      display: 'none',
                      position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 50, 
                      background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, marginTop: 6, 
                      overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
                    }}>
                      {['Crypto / Finance','DeFi Analytics','Social / NLP','NFT Markets','On-chain Data','Other'].map(c => (
                        <div 
                          key={c} 
                          onClick={() => { 
                            setDsCat(c); 
                            const el = document.getElementById('ds-cat-dropdown');
                            if (el) el.style.display = 'none'; 
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          style={{ 
                            padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                            color: dsCat === c ? '#818cf8' : '#ccc',
                            background: 'transparent', transition: 'background 0.2s'
                          }}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Row Count (approx)</label>
                  <input type="number" placeholder="e.g. 50000" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description *</label>
                <textarea value={dsDesc} onChange={e=>setDsDesc(e.target.value)}
                  placeholder="What does this dataset contain? Time period, sources, format…"
                  style={{ ...inputStyle, minHeight:90, resize:'vertical' }} />
              </div>
            </div>
          </div>
          <div>
            <div style={cardStyle}>
              <h3 style={{ marginBottom:16 }}>Upload File</h3>
              <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);setDsFiles(Array.from(e.dataTransfer.files).map(f=>({name:f.name,size:f.size})));}}
                onClick={()=>fileRef.current?.click()}
                style={{ border:`2px dashed ${dragOver?'rgba(99,102,241,0.5)':'rgba(99,102,241,0.2)'}`, borderRadius:12, padding:'24px 16px', textAlign:'center', cursor:'pointer', background:dragOver?'rgba(99,102,241,0.08)':'transparent', transition:'all .2s' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>📊</div>
                <p style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>Drag &amp; drop CSV / JSON</p>
                <p style={{ fontSize:11.5, color:'#94A3B8' }}>Max 500MB · .csv .json .parquet .zip</p>
                <input ref={fileRef} type="file" accept=".csv,.json,.parquet,.zip" style={{ display:'none' }} onChange={e=>setDsFiles(Array.from(e.target.files||[]).map(f=>({name:f.name,size:f.size})))} />
              </div>
              {dsFiles.map((f,i)=>(
                <div key={i} style={{ display:'flex', gap:8, padding:'7px 10px', background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:8, marginTop:8, fontSize:12 }}>
                  <span>📄</span><span style={{ flex:1 }}>{f.name}</span>
                  <span style={{ color:'#94A3B8' }}>{(f.size/1024).toFixed(0)}KB</span>
                  <span style={{ fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:5, background:'rgba(16,245,160,0.12)', color:'#10F5A0' }}>Ready</span>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <h3 style={{ marginBottom:12 }}>Pricing</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={labelStyle}>Access Price (SOL)</label>
                  <input type="number" value={dsPrice} onChange={e=>setDsPrice(e.target.value)} step="0.01" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>License</label>
                  <select value={dsLicense} onChange={e=>setDsLicense(e.target.value)} style={inputStyle}>
                    {['CC BY 4.0','MIT','Proprietary','Research Only'].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <motion.button onClick={publish} whileHover={{ boxShadow:'0 0 28px rgba(99,102,241,0.5)' }}
              style={{ width:'100%', padding:'12px 0', background:'linear-gradient(135deg,#6366F1,#4F46E5)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              📤 Publish Dataset · 0.01 SOL
            </motion.button>
          </div>
        </div>
      )}

      {/* MY DATASETS TAB */}
      {tab === 'mine' && (
        myDatasets.length === 0 ? (
          <div style={{ ...cardStyle, textAlign:'center', padding:'60px 40px' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🗃️</div>
            <h3 style={{ marginBottom:8 }}>No datasets yet</h3>
            <p style={{ color:'#94A3B8', fontSize:13, marginBottom:16 }}>Upload your first dataset to start earning SOL when others access it.</p>
            <motion.button onClick={() => setTab('upload')} whileHover={{ scale:1.02 }}
              style={{ padding:'9px 20px', background:'linear-gradient(135deg,#6366F1,#4F46E5)', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Upload Dataset →
            </motion.button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
            {myDatasets.map((d,i) => (
              <div key={i} style={cardStyle}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:10.5, fontWeight:600, padding:'2px 7px', borderRadius:5, background:'rgba(99,102,241,0.15)', color:'#6366F1' }}>{d.cat}</span>
                  <span style={{ fontSize:10.5, fontWeight:600, padding:'2px 7px', borderRadius:5, background:'rgba(16,245,160,0.12)', color:'#10F5A0' }}>Mine</span>
                </div>
                <h3 style={{ marginBottom:6 }}>{d.label}</h3>
                <p style={{ fontSize:12, color:'#94A3B8', marginBottom:10 }}>{d.desc}</p>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:'#10F5A0' }}>{d.price}</span>
                  <span style={{ color:'#94A3B8' }}>⬇️ {d.downloads}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </motion.div>
  );
}
