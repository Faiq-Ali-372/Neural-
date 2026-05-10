'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletState } from '@/context/WalletContext';
import LineChart from '@/components/ui/LineChart';
import CountUp from '@/components/ui/CountUp';
import ActivityTicker from '@/components/ui/ActivityTicker';
import type { LogLine } from '@/app/page';

interface Props { addLog: (m: string, t?: LogLine['type']) => void; onNavigate: (p: string) => void; }

const DEFAULT_SPARK = [20,35,28,45,38,55,42,60,48,72,65,80,70,85,78,90,82,88,92,86,95,88,90,94,88,92,95,90,96,100];

export default function DashboardPage({ addLog, onNavigate }: Props) {
  const { publicKey } = useWallet();
  const { solPrice, blockHeight } = useWalletState();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const wallet = publicKey?.toString() ?? 'demo';
        
        // Simulate network delay for the hackathon demo
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data representing the user's dashboard
        setData({
          total_earned_sol: 4.25,
          total_requests: 1248,
          active_models: 3,
          avg_accuracy: 94.2,
          top_models: [
            { key: 'btc_pred_v2', name: 'BTC Price Predictor', requests: 840, revenue_sol: 2.15, status: 'Live' },
            { key: 'eth_sentiment', name: 'ETH Sentiment Analysis', requests: 280, revenue_sol: 1.50, status: 'Live' },
            { key: 'sol_risk', name: 'Solana Risk Scorer', requests: 128, revenue_sol: 0.60, status: 'Live' }
          ],
          spark: DEFAULT_SPARK,
          revenue_chart: DEFAULT_SPARK.map(v => v * 0.05)
        });
      } catch {
        addLog('[DASHBOARD] Failed to load analytics', 'warn');
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [publicKey]);

  const sparkData: number[] = data?.spark ?? DEFAULT_SPARK;
  const revenueChartRaw = data?.revenue_chart;
  const revenueNums: number[] = Array.isArray(revenueChartRaw)
    ? revenueChartRaw.map((p: any) => typeof p === 'number' ? p : (p?.pct ?? p?.val ?? 0))
    : sparkData;

  const hasActivity = (data?.total_requests ?? 0) > 0;

  const metrics = [
    { label: 'Total Earned', val: data?.total_earned_sol ?? 0, suffix: ' SOL', decimals: 3, color: '#34d399' },
    { label: 'Total Requests', val: data?.total_requests ?? 0, suffix: '', decimals: 0, color: '#818cf8' },
    { label: 'Active Models', val: data?.active_models ?? 0, suffix: '', decimals: 0, color: '#60a5fa' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8, color: '#f5f5f5' }}>
          Analytics
        </h1>
        <p style={{ fontSize: 14, color: '#94A3B8' }}>
          Real-time earnings and usage from your deployed models.
        </p>
      </div>

      {/* Network bar */}
      <div style={{
        display: 'flex', gap: 32, marginBottom: 48,
        padding: '16px 24px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(255,255,255,0.015)',
      }}>
        {[
          { label: 'Network', value: 'Solana Devnet' },
          { label: 'Block Height', value: blockHeight },
          { label: 'SOL Price', value: solPrice },
          { label: 'Status', value: 'Live', isLive: true },
        ].map(item => (
          <div key={item.label}>
            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#aaa', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)' }}>
              {'isLive' in item && <span className="pulse-dot" style={{ width: 5, height: 5 }} />}
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
        {loading
          ? Array(3).fill(0).map((_, i) => <div key={i} className="shimmer" style={{ height: 120, borderRadius: 16 }} />)
          : metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.1)' }}
              style={{
                padding: '28px 24px',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.04)',
                background: 'rgba(255,255,255,0.015)',
                transition: 'all 0.3s',
              }}
            >
              <div style={{
                fontSize: 11, fontWeight: 500, color: '#94A3B8',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
              }}>{m.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em' }}>
                <CountUp to={m.val || 0} decimals={m.decimals} suffix={m.suffix} duration={1.4} style={{ color: m.color }} />
              </div>
            </motion.div>
          ))
        }
      </div>

      {/* Revenue Chart */}
      <div style={{
        padding: 32,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(255,255,255,0.015)',
        marginBottom: 48,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f5', marginBottom: 4 }}>Revenue</div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>SOL earned — last 30 days</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: '#34d399' }}>
              {(data?.total_earned_sol ?? 0).toFixed(3)} SOL
            </span>
          </div>
        </div>
        {loading
          ? <div className="shimmer" style={{ height: 120, borderRadius: 8 }} />
          : <LineChart data={revenueNums} width={700} height={120} color="#34d399" fill />
        }
      </div>

      {/* Model Leaderboard */}
      <div style={{
        padding: 32,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(255,255,255,0.015)',
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f5', marginBottom: 24 }}>
          Model Leaderboard
        </div>

        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 36, borderRadius: 8, marginBottom: 8 }} />
          ))
        ) : !hasActivity ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>No activity yet. Run an inference to see results.</p>
            <motion.button
              onClick={() => onNavigate('models')}
              whileHover={{ scale: 1.02 }}
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: 13 }}
            >
              Browse Models
            </motion.button>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 100px 120px',
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <span>#</span><span>Model</span><span style={{ textAlign: 'right' }}>Requests</span><span style={{ textAlign: 'right' }}>Revenue</span>
            </div>
            {(data?.top_models ?? []).map((m: any, i: number) => (
              <motion.div key={m.key ?? m.model_key ?? i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 100px 120px',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#ccc' }}>{m.name ?? m.model_key ?? m.key}</span>
                <span style={{ textAlign: 'right', fontSize: 12, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>{m.requests ?? 0}</span>
                <span style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                  +{((m.revenue_sol ?? m.earned ?? 0)).toFixed(3)} SOL
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 40, marginBottom: 40 }}>
        <ActivityTicker />
      </div>
    </motion.div>
  );
}
