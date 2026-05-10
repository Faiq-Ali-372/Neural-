'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WalletButton from '@/components/wallet/WalletButton';

interface TopbarProps {
  onNavigate?: (p: string) => void;
  onSearch?: (q: string) => void;
}

export default function Topbar({ onNavigate, onSearch }: TopbarProps) {
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearch('');
    } else if (e.key === 'Enter' && search.trim()) {
      onSearch?.(search.trim());
      setSearch('');
    }
  };

  return (
    <header style={{
      height: 60,
      minHeight: 60,
      background: 'rgba(5, 5, 10, 0.4)',
      backdropFilter: 'blur(32px)',
      WebkitBackdropFilter: 'blur(32px)',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 32px',
      gap: 24,
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Light leak at the top edge */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.2), rgba(99,102,241,0.2), transparent)',
      }} />

      {/* Search */}
      <motion.div 
        animate={{ 
          borderColor: isFocused ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)',
          backgroundColor: isFocused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)'
        }}
        transition={{ duration: 0.2 }}
        onClick={() => inputRef.current?.focus()}
        style={{
          flex: 1,
          maxWidth: 480,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderRadius: 12,
          padding: '8px 16px',
          boxShadow: isFocused ? '0 0 0 2px rgba(139,92,246,0.1), inset 0 2px 4px rgba(0,0,0,0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.2)',
          cursor: 'text',
        }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: isFocused ? '#a78bfa' : '#94A3B8', transition: 'color 0.2s', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search models, agents, datasets..."
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#f5f5f5',
            fontSize: 14,
            fontFamily: 'var(--font)',
          }}
        />
        {search.length > 0 ? (
          <div style={{ display: 'flex', gap: 4, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setSearch(''); inputRef.current?.focus(); }}>
            <span style={{
              fontSize: 10,
              color: '#f87171',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 6,
              padding: '3px 6px',
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 2px 0 rgba(0,0,0,0.2)',
              transition: 'all 0.2s',
            }}>
              ESC
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 4, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); inputRef.current?.focus(); }}>
            <span style={{
              fontSize: 10,
              color: '#CBD5E1',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              padding: '3px 6px',
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 2px 0 rgba(0,0,0,0.2)',
            }}>
              ⌘
            </span>
            <span style={{
              fontSize: 10,
              color: '#CBD5E1',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              padding: '3px 6px',
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 2px 0 rgba(0,0,0,0.2)',
            }}>
              K
            </span>
          </div>
        )}
      </motion.div>

      {/* Right Actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Back to landing */}
        <motion.button
          onClick={() => onNavigate?.('home')}
          whileHover={{ color: '#fff', background: 'rgba(255,255,255,0.05)' }}
          style={{
            background: 'transparent',
            border: '1px solid transparent',
            color: '#CBD5E1',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 8,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Exit App
        </motion.button>

        {/* Notification Bell & Dropdown */}
        <div style={{ position: 'relative' }}>
          <motion.button
            onClick={() => setShowNotifs(!showNotifs)}
            whileHover={{ background: 'rgba(255,255,255,0.05)' }}
            style={{
              background: showNotifs ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.05)',
              color: showNotifs ? '#fff' : '#aaa',
              width: 36,
              height: 36,
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {/* Unread indicator */}
            <div style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 8px rgba(52,211,153,0.8)',
            }} />
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 12,
                  width: 320,
                  background: 'rgba(10, 10, 15, 0.95)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02)',
                  overflow: 'hidden',
                  zIndex: 50,
                }}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Notifications</span>
                  <span style={{ fontSize: 11, color: '#818cf8', cursor: 'pointer' }}>Mark all as read</span>
                </div>
                
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {/* Notification Item 1 */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 12, background: 'rgba(52,211,153,0.05)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', marginTop: 6, flexShrink: 0, boxShadow: '0 0 8px rgba(52,211,153,0.6)' }} />
                    <div>
                      <div style={{ fontSize: 13, color: '#f5f5f5', fontWeight: 500, marginBottom: 4 }}>Model Deployment Successful</div>
                      <div style={{ fontSize: 12, color: '#CBD5E1' }}>Your custom Anomaly Detection model is now live on the Solana edge network.</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 6 }}>Just now</div>
                    </div>
                  </div>

                  {/* Notification Item 2 */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'transparent', border: '1px solid #94A3B8', marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500, marginBottom: 4 }}>New Agent Framework</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>Eliza v2 is now available in the NEURAL marketplace. Upgrade your agents.</div>
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 6 }}>2 hours ago</div>
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: 12, color: '#CBD5E1', cursor: 'pointer' }}>View all notifications</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />

        <WalletButton />
      </div>
    </header>
  );
}
