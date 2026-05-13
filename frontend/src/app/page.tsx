'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import ParticleField from '@/components/ui/ParticleField';
import CursorGlow from '@/components/ui/CursorGlow';
import HomePage from '@/components/pages/HomePage';
import AgentPage from '@/components/pages/AgentPage';
import ModelsPage from '@/components/pages/ModelsPage';
import DashboardPage from '@/components/pages/DashboardPage';
import DeployPage from '@/components/pages/DeployPage';
import DatasetsPage from '@/components/pages/DatasetsPage';
import SettingsPage from '@/components/pages/SettingsPage';
import AdminPage from '@/components/pages/AdminPage';
import LibraryPage from '@/components/pages/LibraryPage';
import ComputePage from '@/components/pages/ComputePage';
import PaymentModal from '@/components/wallet/PaymentModal';
import TransactionToast, { TxStatus } from '@/components/ui/TransactionToast';

export interface LogLine { msg: string; type: 'info'|'success'|'warn'|'error'|''; time: string; }
export interface PendingPayment { amount: string; description: string; service: string; onPaid: (sig: string) => void; }

function ts() {
  return new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function App() {
  const [page, setPage]         = useState('home');
  const [searchQuery, setSearch] = useState('');
  const [logs, setLogs]         = useState<LogLine[]>(() => [
    { msg: '[NEURAL] v3.0 initialized',  type: 'info',    time: ts() },
    { msg: '[NET] Connected to devnet',      type: '',        time: ts() },
  ]);
  const [lastModel, setLastModel] = useState<{ name: string; accuracy: number; cost: string; cat: string } | null>(null);
  const [purchasedModels, setPurchasedModels] = useState<import('@/lib/constants').Model[]>([]);
  const [purchasedDatasets, setPurchasedDatasets] = useState<any[]>([]);
  const [purchasedGpus, setPurchasedGpus] = useState<any[]>([]);
  const [pendingDatasets, setPendingDatasets] = useState<any[]>([]);
  const [pendingGpus, setPendingGpus] = useState<any[]>([]);
  const [approvedDatasets, setApprovedDatasets] = useState<any[]>([]);
  const [approvedGpus, setApprovedGpus] = useState<any[]>([]);
  const [payment, setPayment]    = useState<PendingPayment | null>(null);
  const [txToast, setTxToast]    = useState<{ status: TxStatus; hash?: string }>({ status: 'idle' });

  const addLog = useCallback((msg: string, type: LogLine['type'] = '') => {
    setLogs(l => [...l.slice(-19), { msg, type, time: ts() }]);
  }, []);

  const requestPayment = useCallback((p: PendingPayment) => setPayment(p), []);

  const triggerTxToast = useCallback((status: TxStatus, hash?: string) => {
    setTxToast({ status, hash });
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage('models');
  }, []);

  const isLanding = page === 'home';
  const pageProps = { addLog, requestPayment, setLastModel, onNavigate: setPage, setTxToast: triggerTxToast };

  // ── Pages that require a connected wallet ──────────────────────────────────
  const PROTECTED_PAGES = ['models','datasets','compute','library','deploy','dashboard','agent','settings','admin'];
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const isProtected = PROTECTED_PAGES.includes(page) && !connected;

  return (
    <div style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Global ambient layers */}
      <ParticleField />
      <CursorGlow />

      {/* Landing mode — no chrome */}
      <AnimatePresence mode="wait">
        {isLanding ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ height: '100vh', overflow: 'auto', position: 'relative', zIndex: 2 }}
          >
            <HomePage {...pageProps} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', height: '100vh', position: 'relative', zIndex: 2, backgroundColor: 'transparent' }}
          >
            {/* Ambient App Background */}
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 0,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
            }} />
            
            {/* Subtle animated sweep */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.03), transparent)',
                transform: 'skewX(-20deg)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            <Sidebar activePage={page} onNavigate={setPage} />

            <div style={{
              marginLeft: 64,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              overflow: 'hidden',
              minWidth: 0,
            }}>
              <Topbar onNavigate={setPage} onSearch={handleSearch} />

              <main style={{
                flex: 1,
                overflowY: 'auto',
                padding: '32px 40px',
                minWidth: 0,
                position: 'relative',
              }}>
                {/* Ambient App Lighting */}
                <div style={{
                  position: 'fixed',
                  top: '-10%',
                  right: '-5%',
                  width: '60vw',
                  height: '60vw',
                  background: 'radial-gradient(circle at center, rgba(139,92,246,0.06) 0%, rgba(99,102,241,0.03) 40%, transparent 70%)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }} />
                <div style={{
                  position: 'fixed',
                  bottom: '-20%',
                  left: '10%',
                  width: '50vw',
                  height: '50vw',
                  background: 'radial-gradient(circle at center, rgba(52,211,153,0.03) 0%, transparent 60%)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }} />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={page}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* ── Wallet Guard ── show for protected pages when disconnected ── */}
                    {isProtected && (
                      <motion.div
                        key="wallet-gate"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          justifyContent: 'center', minHeight: '70vh', textAlign: 'center', gap: 0,
                        }}
                      >
                        {/* Glow */}
                        <div style={{
                          position: 'absolute', width: 340, height: 340, borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                          filter: 'blur(40px)', pointerEvents: 'none',
                        }} />

                        {/* Lock icon */}
                        <motion.div
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          style={{
                            width: 80, height: 80, borderRadius: 22, marginBottom: 28,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))',
                            border: '1px solid rgba(99,102,241,0.25)',
                            boxShadow: '0 0 40px rgba(99,102,241,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="11" width="18" height="11" rx="3" stroke="#818cf8" strokeWidth="1.5"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/>
                            <circle cx="12" cy="16" r="1.5" fill="#818cf8"/>
                          </svg>
                        </motion.div>

                        <h2 style={{
                          fontSize: 28, fontWeight: 700, color: '#f1f5f9',
                          letterSpacing: '-0.03em', marginBottom: 10,
                        }}>
                          Wallet Required
                        </h2>
                        <p style={{ fontSize: 15, color: '#64748b', maxWidth: 380, lineHeight: 1.6, marginBottom: 32 }}>
                          Connect your <span style={{ color: '#a78bfa', fontWeight: 600 }}>Phantom wallet</span> to access
                          the marketplace, make purchases, and manage your assets on-chain.
                        </p>

                        {/* Connect button */}
                        <motion.button
                          whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setVisible(true)}
                          style={{
                            padding: '14px 36px', fontSize: 15, fontWeight: 700,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none', borderRadius: 14, color: '#fff',
                            cursor: 'pointer',
                            boxShadow: '0 0 30px rgba(99,102,241,0.25), 0 0 60px rgba(99,102,241,0.1)',
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M20 12V8a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                            <path d="M20 12h-6a2 2 0 1 0 0 4h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                          Connect Phantom
                        </motion.button>

                        {/* Info chips */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
                          {['Solana Devnet', 'Non-custodial', 'Trustless Payments'].map(label => (
                            <span key={label} style={{
                              padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500,
                              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                              color: '#64748b',
                            }}>{label}</span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ── Page content (only when wallet is connected or page is unprotected) ── */}
                    {!isProtected && (
                      <>
                    {page === 'agent'     && <AgentPage {...pageProps} />}
                    {page === 'models'    && <ModelsPage {...pageProps} searchQuery={searchQuery} onPurchaseComplete={(m) => setPurchasedModels(prev => {
                if (prev.find(p => p.key === m.key)) return prev;
                return [...prev, m];
              })} />}
                    {page === 'dashboard' && <DashboardPage addLog={addLog} onNavigate={setPage} />}
                    {page === 'deploy'    && <DeployPage {...pageProps} />}
                    {page === 'datasets'  && <DatasetsPage {...pageProps}
                      pendingDatasets={pendingDatasets}
                      approvedDatasets={approvedDatasets}
                      onAddPending={(d: any) => setPendingDatasets(prev => [d, ...prev])}
                      onRemovePending={(name: string) => setPendingDatasets(prev => prev.filter(d => d.name !== name))}
                      onPurchaseComplete={(d: any) => setPurchasedDatasets(prev => {
                        if (prev.find(p => p.name === d.name)) return prev;
                        return [...prev, d];
                      })} />}
                    {page === 'compute'   && <ComputePage {...pageProps}
                      pendingGpus={pendingGpus}
                      approvedGpus={approvedGpus}
                      onAddPending={(g: any) => setPendingGpus(prev => [g, ...prev])}
                      onRemovePending={(id: string) => setPendingGpus(prev => prev.filter(g => g.id !== id))}
                      onPurchaseComplete={(g: any) => setPurchasedGpus(prev => {
                        if (prev.find(p => p.id === g.id)) return prev;
                        return [...prev, g];
                      })} />}
                    {page === 'settings'  && <SettingsPage {...pageProps} />}
                    {page === 'admin'     && <AdminPage addLog={addLog} onNavigate={setPage}
                      pendingDatasets={pendingDatasets}
                      pendingGpus={pendingGpus}
                      onApproveDataset={(name) => {
                        const ds = pendingDatasets.find(d => d.name === name);
                        if (ds) {
                          setPendingDatasets(prev => prev.filter(d => d.name !== name));
                          setApprovedDatasets(prev => [{ ...ds, status: 'live' }, ...prev]);
                          addLog(`[ADMIN] Dataset "${ds.label}" is now live on marketplace`, 'success');
                        }
                      }}
                      onRejectDataset={(name) => setPendingDatasets(prev => prev.filter(d => d.name !== name))}
                      onApproveGpu={(id) => {
                        const gpu = pendingGpus.find(g => g.id === id);
                        if (gpu) {
                          setPendingGpus(prev => prev.filter(g => g.id !== id));
                          setApprovedGpus(prev => [{ ...gpu, status: 'available' }, ...prev]);
                          addLog(`[ADMIN] GPU "${gpu.name}" is now live on marketplace`, 'success');
                        }
                      }}
                      onRejectGpu={(id) => setPendingGpus(prev => prev.filter(g => g.id !== id))}
                    />}
                    {page === 'library'   && <LibraryPage purchasedModels={purchasedModels} purchasedDatasets={purchasedDatasets} purchasedGpus={purchasedGpus} onNavigate={setPage} setTxToast={triggerTxToast} />}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {payment && (
        <PaymentModal
          isOpen={!!payment}
          amount={payment.amount}
          description={payment.description}
          service={payment.service}
          onConfirm={(sig) => { payment.onPaid(sig); setPayment(null); }}
          onClose={() => setPayment(null)}
          setTxToast={triggerTxToast}
        />
      )}

      <TransactionToast 
        status={txToast.status} 
        txHash={txToast.hash} 
        onClose={() => setTxToast({ status: 'idle' })} 
      />
    </div>
  );
}
