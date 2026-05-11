'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWalletState } from '@/context/WalletContext';
import { truncAddr } from '@/lib/solana';
import { NAV_ITEMS } from '@/lib/constants';

interface SidebarProps { activePage: string; onNavigate: (p: string) => void; }

/* ─── SVG Icons ─── */
const ICONS: Record<string, React.ReactNode> = {
  home:     <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" fill="none"/>,
  agent:    <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  grid:     <><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  upload:   <><path d="M12 15V3m0 0l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
  data:     <><path d="M21 5c0 1.657-4.03 3-9 3S3 6.657 3 5s4.03-3 9-3 9 1.343 9 3z" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  chart:    <><path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M7 14l4-4 4 2 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  settings: <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
  shield:   <><path d="M12 2l8 4v6c0 5.25-3.5 8.75-8 10-4.5-1.25-8-4.75-8-10V6l8-4z" stroke="currentColor" strokeWidth="1.5" fill="none"/></>,
  cpu:      <><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
};

function NavIcon({ name }: { name: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      {ICONS[name] || ICONS.home}
    </svg>
  );
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { publicKey, connected } = useWallet();
  const { balance } = useWalletState();
  const { setVisible } = useWalletModal();
  const [expanded, setExpanded] = useState(false);

  const width = expanded ? 260 : 72;

  return (
    <motion.aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      animate={{ width }}
      transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
      style={{
        zIndex: 50,
        flexShrink: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(10,10,20,0.95) 0%, rgba(5,5,15,0.98) 100%)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderRight: '1px solid rgba(99,102,241,0.08)',
        overflow: 'hidden',
        boxShadow: expanded
          ? '4px 0 40px rgba(99,102,241,0.08), 1px 0 0 rgba(99,102,241,0.1)'
          : '1px 0 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Subtle gradient accent line at top */}
      <div style={{
        height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(139,92,246,0.3), transparent)',
        flexShrink: 0,
      }} />

      {/* Logo */}
      <div style={{
        padding: expanded ? '20px 20px' : '20px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'flex-start' : 'center',
        gap: 12,
        minHeight: 68,
      }}>
        <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
          {/* Subtle rotating orbit */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1px solid rgba(129,140,248,0.1)',
              borderTopColor: 'rgba(129,140,248,0.35)',
            }}
          />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="sidebarLogoGrad" x1="5" y1="4" x2="19" y2="20">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <motion.path 
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
              d="M5 20V4L19 20V4" 
              stroke="url(#sidebarLogoGrad)" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 4px rgba(129,140,248,0.5))' }}
            />
            {/* Glowing endpoint nodes */}
            <motion.circle 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5, ease: 'backOut' }}
              cx="5" cy="4" r="2" fill="#818cf8"
              style={{ filter: 'drop-shadow(0 0 4px rgba(129,140,248,0.8))' }}
            />
            <motion.circle 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5, ease: 'backOut' }}
              cx="19" cy="4" r="2" fill="#34d399"
              style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.8))' }}
            />
          </svg>
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f5f5f5', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                NEURAL
              </div>
              <div style={{ fontSize: 9, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Solana Platform
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map(group => (
          <div key={group.group} style={{ marginBottom: 12 }}>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.2 } }}
                  exit={{ opacity: 0, transition: { duration: 0.05 } }}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#64748B',
                    padding: '8px 14px 6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {group.group}
                </motion.div>
              )}
            </AnimatePresence>

            {group.items.map(item => {
              const isActive = activePage === item.key;
              return (
                <motion.div
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  whileHover={{ background: 'rgba(99,102,241,0.06)' }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: expanded ? '10px 14px' : '10px 0',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    borderRadius: 10,
                    cursor: 'pointer',
                    marginBottom: 2,
                    color: isActive ? '#f5f5f5' : '#94A3B8',
                    background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                    border: isActive ? '1px solid rgba(99,102,241,0.12)' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Active glow */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarGlow"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 10,
                        background: 'rgba(99,102,241,0.05)',
                        boxShadow: '0 0 20px rgba(99,102,241,0.1)',
                      }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
                    />
                  )}

                  {/* Active indicator bar */}
                  {isActive && !expanded && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 16,
                      borderRadius: '0 3px 3px 0',
                      background: 'linear-gradient(180deg, #818cf8, #6366f1)',
                      boxShadow: '0 0 8px rgba(99,102,241,0.5)',
                    }} />
                  )}

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <NavIcon name={item.icon} />
                  </div>

                  <AnimatePresence>
                    {expanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 35 } }}
                        exit={{ opacity: 0, transition: { duration: 0.05 } }}
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 400,
                          whiteSpace: 'nowrap',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Badge */}
                  {'badge' in item && expanded && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1, transition: { delay: 0.05, type: 'spring' } }}
                      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.05 } }}
                      style={{
                        marginLeft: 'auto',
                        fontSize: 9,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(99,102,241,0.1)',
                        color: '#818cf8',
                        border: '1px solid rgba(99,102,241,0.15)',
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Wallet Section */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid rgba(99,102,241,0.06)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <motion.div
          onClick={() => setVisible(true)}
          whileHover={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.15)' }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 10,
            padding: expanded ? '12px 14px' : '12px 0',
            justifyContent: expanded ? 'flex-start' : 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: '1px solid transparent',
          }}
        >
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: connected ? '#34d399' : '#64748B',
            boxShadow: connected ? '0 0 10px rgba(52,211,153,0.6), 0 0 4px rgba(52,211,153,0.8)' : 'none',
            flexShrink: 0,
          }} />
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ minWidth: 0, overflow: 'hidden' }}
              >
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: connected ? '#aaa' : '#94A3B8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {connected && publicKey ? truncAddr(publicKey.toString()) : 'Connect Wallet'}
                </div>
                {connected && (
                  <div style={{
                    fontSize: 11,
                    color: '#34d399',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                  }}>
                    {balance} SOL
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.aside>
  );
}
