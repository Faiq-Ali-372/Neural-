'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThreeParticleBackground from '@/components/ui/ThreeParticleBackground';

interface HeroSectionProps {
  onLaunchAgent: () => void;
  onExploreModels: () => void;
}

const WORDS = ['DePIN Compute', 'AI Models', 'Datasets'];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function HeroSection({ onLaunchAgent, onExploreModels }: HeroSectionProps) {
  const [activeWord, setActiveWord] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWord((prev) => (prev + 1) % WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  return (
    <>
      <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '100px 24px 80px 24px', // Added paddingTop 100 to push text below logo
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Ambient Background Elements */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {/* Radial glow behind heading */}
        <div style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80vw',
          height: '60vh',
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)',
        }} />

        {/* Massive Rotating AI Core Ring */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '120vw',
          height: '120vw',
          maxWidth: 1400,
          maxHeight: 1400,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.15,
          willChange: 'transform',
          transform: 'translate(-50%, -50%) perspective(1000px) rotateX(60deg) translateZ(0)',
        }}>
          {/* Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '1px solid rgba(139,92,246,0.1)',
              borderTop: '1px solid rgba(139,92,246,0.4)',
              borderBottom: '1px solid rgba(139,92,246,0.4)',
              boxShadow: 'inset 0 0 40px rgba(139,92,246,0.05), 0 0 60px rgba(139,92,246,0.05)',
              willChange: 'transform',
            }}
          />
          {/* Middle Dashed Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: '80%',
              height: '80%',
              borderRadius: '50%',
              border: '2px dashed rgba(99,102,241,0.2)',
              opacity: 0.6,
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
          />
          {/* Inner Glowing Ring */}
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.02, 1] }}
            transition={{
              rotate: { duration: 40, repeat: Infinity, ease: 'linear' },
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }}
            style={{
              position: 'absolute',
              width: '55%',
              height: '55%',
              borderRadius: '50%',
              border: '2px solid rgba(167,139,250,0.15)',
              borderLeft: '2px solid rgba(167,139,250,0.6)',
              borderRight: '2px solid rgba(167,139,250,0.6)',
            }}
          />
          {/* Core Center Glow */}
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: '30%',
              height: '30%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)',
            }}
          />
        </div>
      </div>

      {/* Logo + Brand (Moved to Top Left) */}
      <motion.div
        variants={item}
        style={{
          position: 'absolute',
          top: 36,
          left: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 50,
        }}
      >
        <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Pulsing glow behind */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(129,140,248,0.6) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
          />
          {/* Outer rotating orbit */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: 52,
              height: 52,
              borderRadius: '50%',
              border: '1px solid rgba(129,140,248,0.12)',
              borderTopColor: 'rgba(129,140,248,0.5)',
              borderRightColor: 'rgba(52,211,153,0.3)',
            }}
          />
          {/* Inner counter-rotating orbit */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '1px dashed rgba(129,140,248,0.08)',
              borderBottomColor: 'rgba(52,211,153,0.2)',
            }}
          />
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={{ position: 'relative', zIndex: 2 }}>
            <defs>
              <linearGradient id="heroLogoGrad" x1="5" y1="4" x2="19" y2="20">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <motion.path 
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
              d="M5 20V4L19 20V4" 
              stroke="url(#heroLogoGrad)" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.6))' }}
            />
            {/* Glowing endpoint nodes */}
            <motion.circle 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: 'backOut' }}
              cx="5" cy="4" r="2.5" fill="#818cf8"
              style={{ filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.9))' }}
            />
            <motion.circle 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6, ease: 'backOut' }}
              cx="5" cy="20" r="1.5" fill="#a78bfa"
              style={{ filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.7))' }}
            />
            <motion.circle 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6, ease: 'backOut' }}
              cx="19" cy="20" r="2" fill="#34d399"
              style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.9))' }}
            />
            <motion.circle 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.6, ease: 'backOut' }}
              cx="19" cy="4" r="1.5" fill="#34d399"
              style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.7))' }}
            />
          </svg>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#f5f5f5',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>
            NEURAL
          </div>
          <div style={{ fontSize: 10, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
            Solana Infrastructure
          </div>
        </div>
      </motion.div>

      {/* Network Status Badge (Moved to Top Right) */}
      <motion.div
        variants={item}
        style={{
          position: 'absolute',
          top: 36,
          right: 40,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 18px',
          borderRadius: 100,
          border: '1px solid rgba(52,211,153,0.15)',
          background: 'rgba(52,211,153,0.04)',
          fontSize: 12,
          fontWeight: 500,
          color: '#34d399',
          backdropFilter: 'blur(12px)',
          zIndex: 50,
        }}
      >
        <span className="pulse-dot" />
        <span>Live on Solana Devnet</span>
      </motion.div>

      {/* Main Heading */}
      <motion.h1
        variants={item}
        style={{
          fontSize: 'clamp(52px, 7vw, 88px)',
          fontWeight: 700,
          letterSpacing: '-0.05em',
          lineHeight: 1.0,
          maxWidth: 950,
          marginBottom: 28,
          position: 'relative',
          zIndex: 1,
          textShadow: '0 0 40px rgba(255,255,255,0.15)',
        }}
      >
        <span style={{ color: '#ffffff' }}>The Autonomous</span>
        <br />
        <span style={{
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 40%, #8b5cf6 100%)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'gradientShift 3s ease infinite',
        }}>
          AI Economy
        </span>
      </motion.h1>

      {/* Subtitle with Interactive Cycling */}
      <motion.p
        variants={item}
        style={{
          fontSize: 18,
          lineHeight: 1.7,
          color: '#f1f5f9',
          maxWidth: 600,
          marginBottom: 44,
          fontWeight: 500,
          minHeight: 60, // Keep height stable during animation
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6 }}>
          <span>Access world-class</span>
          <span style={{ position: 'relative', width: 140, height: 26, display: 'inline-block', overflow: 'hidden' }}>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={activeWord}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  left: 0,
                  width: '100%',
                  textAlign: 'center',
                  color: activeWord === 0 ? '#10F5A0' : activeWord === 1 ? '#60a5fa' : '#a78bfa',
                  fontWeight: 800,
                }}
              >
                {WORDS[activeWord]}
              </motion.span>
            </AnimatePresence>
          </span>
          <span>settled on-chain in milliseconds.</span>
        </span>
      </motion.p>

      {/* CTAs */}
      <motion.div
        variants={item}
        style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 1 }}
      >
        <motion.button
          onClick={onLaunchAgent}
          whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2)' }}
          whileTap={{ scale: 0.97 }}
          style={{
            padding: '12px 32px',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            transition: 'box-shadow 0.3s',
          }}
        >
          Enter Marketplace
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>

        <motion.button
          onClick={onExploreModels}
          whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)' }}
          whileTap={{ scale: 0.97 }}
          style={{
            padding: '12px 32px',
            fontSize: 14,
            fontWeight: 500,
            color: '#fff',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 14,
            cursor: 'pointer',
            transition: 'all 0.3s',
            backdropFilter: 'blur(12px)',
          }}
        >
          Explore Models
        </motion.button>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        variants={item}
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 50,
        }}
        onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
      >
        {/* Three stacked chevrons that cascade */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {[0, 1, 2].map(i => (
            <motion.svg
              key={i}
              width="20"
              height="10"
              viewBox="0 0 20 10"
              animate={{ 
                opacity: [0.15, 0.8, 0.15],
                y: [0, 3, 0]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                delay: i * 0.2,
                ease: 'easeInOut'
              }}
            >
              <path 
                d="M2 2L10 8L18 2" 
                stroke="url(#scrollChevGrad)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none"
              />
              <defs>
                <linearGradient id="scrollChevGrad" x1="2" y1="2" x2="18" y2="2">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </motion.svg>
          ))}
        </div>
      </motion.div>
    </motion.div> {/* END OF 100vh HERO CONTAINER */}

    {/* Floating Stats - Revealed on Scroll */}
    <motion.div
      variants={item}
      initial="hidden"
      whileInView="visible"
        viewport={{ once: true, amount: 0.8 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: 80,
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{
          display: 'flex',
          gap: 48,
          padding: '24px 56px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 24,
          backdropFilter: 'blur(10px)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {[
            { value: '47+', label: 'AI Models' },
            { value: '128k', label: 'Inferences' },
            { value: '<200ms', label: 'Latency' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#f5f5f5',
                letterSpacing: '-0.03em',
              }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
