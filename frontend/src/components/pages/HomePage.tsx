'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import HeroSection from '@/components/ui/Hero';
import CountUp from '@/components/ui/CountUp';
import type { LogLine, PendingPayment } from '@/app/page';

interface Props {
  addLog: (m: string, t?: LogLine['type']) => void;
  requestPayment: (p: PendingPayment) => void;
  setLastModel: (m: any) => void;
  onNavigate: (p: string) => void;
}

/* ─── Reusable animated stat ──────────────────────────────────────────── */
function Stat({ value, suffix, label, delay = 0 }: { value: number; suffix?: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ textAlign: 'center' }}
    >
      <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em', color: '#f5f5f5' }}>
        {inView ? <CountUp to={value} suffix={suffix ?? ''} duration={2} /> : '0'}
      </div>
      <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </motion.div>
  );
}

/* ─── Feature Card ────────────────────────────────────────────────────── */
function FeatureCard({ title, description, index }: { title: string; description: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.1)' }}
      style={{
        padding: 32,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
        cursor: 'default',
      }}
    >
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#f5f5f5', letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: '#94A3B8' }}>{description}</p>
    </motion.div>
  );
}

/* ─── Routing Visualization ───────────────────────────────────────────── */
function RouterVisualization() {
  const nodes = [
    { label: 'User Request', x: 50, y: 50 },
    { label: 'Smart Router', x: 200, y: 50 },
    { label: 'BTC Predictor', x: 350, y: 15 },
    { label: 'Sentiment AI', x: 350, y: 50 },
    { label: 'Risk Scorer', x: 350, y: 85 },
  ];

  return (
    <svg width="100%" viewBox="0 0 400 100" style={{ maxWidth: 600, margin: '0 auto', display: 'block' }}>
      {/* Connections */}
      <motion.line x1="100" y1="50" x2="180" y2="50" stroke="rgba(129,140,248,0.3)" strokeWidth="1"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }} />
      {[15, 50, 85].map((y, i) => (
        <motion.line key={y} x1="250" y1="50" x2="330" y2={y} stroke="rgba(129,140,248,0.15)" strokeWidth="1"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }} />
      ))}
      {/* Selected path highlight */}
      <motion.line x1="250" y1="50" x2="330" y2="15" stroke="rgba(129,140,248,0.6)" strokeWidth="1.5"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 1 }} />

      {/* Nodes */}
      {nodes.map((n, i) => (
        <motion.g key={n.label}
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          <circle cx={n.x} cy={n.y} r={i === 2 ? 8 : 6}
            fill={i === 2 ? 'rgba(129,140,248,0.8)' : 'rgba(255,255,255,0.1)'}
            stroke={i === 2 ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.06)'}
            strokeWidth="1" />
          {i === 2 && (
            <motion.circle cx={n.x} cy={n.y} r="12" fill="none" stroke="rgba(129,140,248,0.2)"
              animate={{ r: [12, 18, 12], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }} />
          )}
          <text x={n.x} y={n.y + (i >= 2 ? -16 : 20)} textAnchor="middle"
            fill="#94A3B8" fontSize="8" fontFamily="Inter, sans-serif">{n.label}</text>
        </motion.g>
      ))}
    </svg>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */
export default function HomePage({ onNavigate }: Props) {
  return (
    <div style={{ overflowY: 'auto', height: '100%' }}>
      {/* ─── HERO ─── */}
      <HeroSection
        onLaunchAgent={() => onNavigate('models')}
        onExploreModels={() => onNavigate('models')}
      />

      {/* ─── STATS BAR ─── */}
      <section>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '80px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 32,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <Stat value={47} label="AI Models" />
          <Stat value={128} suffix="k" label="Inferences Run" delay={0.1} />
          <Stat value={8.4} suffix=" SOL" label="Prizes Distributed" delay={0.2} />
          <Stat value={2300} suffix="+" label="Builders" delay={0.3} />
        </div>
      </section>

      {/* ─── MARKETPLACE ─── */}
      <section>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>
            AI Marketplace
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 20, color: '#f5f5f5' }}>
            Production AI models, <br />
            <span style={{ color: '#94A3B8' }}>pay per request.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 500, margin: '0 auto 48px', lineHeight: 1.7 }}>
            Browse 9+ production models across Finance, NLP, DeFi, and Anomaly Detection.
            Each inference costs fractions of a cent, settled instantly on Solana.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 800, margin: '0 auto' }}>
            <FeatureCard index={0} title="Pay-Per-Use" description="No subscriptions. Pay only for the inferences you run, as little as 0.0005 SOL per request." />
            <FeatureCard index={1} title="Instant Settlement" description="Every payment is verified on-chain. No intermediaries, no delays, no chargebacks." />
            <FeatureCard index={2} title="Creator Revenue" description="95% of every payment goes directly to the model creator. 5% sustains the platform." />
          </div>
          <motion.button
            onClick={() => onNavigate('models')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="btn-ghost"
            style={{ marginTop: 48, padding: '12px 32px', fontSize: 14 }}
          >
            Browse All Models
          </motion.button>
        </div>
      </section>

      {/* ─── SMART ROUTER ─── */}
      <section>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>
            Intelligent Routing
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 20, color: '#f5f5f5' }}>
            The right model, <br />
            <span style={{ color: '#94A3B8' }}>every time.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 500, margin: '0 auto 56px', lineHeight: 1.7 }}>
            Our Smart Router analyzes your task across accuracy, speed, cost, and keyword
            intent — then selects the optimal model automatically.
          </p>
          <div style={{
            padding: 48,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.015)',
            maxWidth: 700,
            margin: '0 auto',
          }}>
            <RouterVisualization />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 32 }}>
              {[
                { label: 'Accuracy', value: '94%' },
                { label: 'Latency', value: '120ms' },
                { label: 'Cost', value: '0.001 SOL' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#f5f5f5' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── DEPLOY & EARN ─── */}
      <section>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>
            Creator Economy
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 20, color: '#f5f5f5' }}>
            Deploy a model, <br />
            <span style={{ color: '#94A3B8' }}>earn SOL per inference.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 500, margin: '0 auto 56px', lineHeight: 1.7 }}>
            Submit your AI model, set your price, and start earning immediately.
            Every payment is split automatically by our smart contract.
          </p>

          {/* Revenue Split Visualization */}
          <div style={{
            maxWidth: 500,
            margin: '0 auto',
            padding: 32,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.015)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: '#CBD5E1' }}>Revenue Split</span>
              <span style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>per inference</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', marginBottom: 20 }}>
              <motion.div
                initial={{ width: '0%' }}
                whileInView={{ width: '95%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--accent), #a78bfa)' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f5f5f5' }}>95%</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>Model Creator</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#94A3B8' }}>5%</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>Platform</div>
              </div>
            </div>
          </div>

          <motion.button
            onClick={() => onNavigate('deploy')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary"
            style={{ marginTop: 48 }}
          >
            Deploy Your Model
          </motion.button>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section>
        <div style={{
          maxWidth: 700,
          margin: '0 auto',
          padding: '120px 24px 80px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 20, color: '#f5f5f5' }}>
            Ready to build the future <br />
            <span className="text-gradient-accent">of AI infrastructure?</span>
          </h2>
          <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 460, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Connect your Phantom wallet and start using production AI models
            with instant on-chain settlement.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <motion.button
              onClick={() => onNavigate('models')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
            >
              Get Started
            </motion.button>
            <motion.button
              onClick={() => onNavigate('dashboard')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-ghost"
            >
              View Dashboard
            </motion.button>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: 100,
            paddingTop: 32,
            borderTop: '1px solid rgba(255,255,255,0.04)',
            fontSize: 12,
            color: '#333',
          }}>
            NEURAL · Built on Solana · MIT License
          </div>
        </div>
      </section>
    </div>
  );
}
