'use client';
import { useState, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import type { Model } from '@/lib/constants';

const TAG_COLORS: Record<string, string> = {
  indigo: '#818cf8', cyan: '#60a5fa', amber: '#fbbf24',
  green: '#34d399', red: '#f87171', pink: '#f472b6', purple: '#a78bfa',
};

interface ModelCardProps { model: Model; onUse: (m: Model) => void; }

export default function ModelCard({ model, onUse }: ModelCardProps) {
  const color = TAG_COLORS[model.color] ?? '#818cf8';
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onUse(model)}
      whileHover={{ y: -4, borderColor: `${color}80`, boxShadow: `0 12px 40px -10px ${color}30, inset 0 0 20px ${color}10` }}
      style={{
        display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderLeft: `3px solid ${color}80`,
        borderRadius: 16,
        padding: 24,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
      }}
    >
      {/* Subtle background glow based on category color */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 150, height: 150,
        background: `radial-gradient(circle at top right, ${color}15, transparent 70%)`,
        pointerEvents: 'none'
      }} />
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative', zIndex: 1 }}>
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
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
            background: `${color}15`, color: color, border: `1px solid ${color}30`
          }}>
            {model.cat}
          </span>
        </div>
        <div style={{
          fontSize: 24, fontWeight: 700, color: '#f5f5f5',
          fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em',
        }}>
          {model.accuracy}%
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
        {model.desc}
      </p>

      {/* Accuracy bar */}
      <div style={{ height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.04)', marginBottom: 20, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${model.accuracy}%` }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
          style={{ height: '100%', borderRadius: 1, background: color }}
        />
      </div>

      {/* Glass Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20, position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.05)', 
          borderRadius: 12, padding: '12px 8px', textAlign: 'center',
          boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.01)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24', textShadow: '0 0 10px rgba(251,191,36,0.4)' }}>{model.price}</div>
          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</div>
        </div>
        <div style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.05)', 
          borderRadius: 12, padding: '12px 8px', textAlign: 'center',
          boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.01)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#818cf8', textShadow: '0 0 10px rgba(129,140,248,0.4)' }}>{model.uses}</div>
          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uses</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <motion.button
          onClick={e => { e.stopPropagation(); onUse(model); }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            padding: '6px 16px',
            fontSize: 12,
            fontWeight: 600,
            color: '#f5f5f5',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Run Model
        </motion.button>
      </div>
    </motion.div>
  );
}
