'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModelCard from '@/components/marketplace/ModelCard';
import { MODELS_DATA } from '@/lib/constants';
import { fetchModels, type BackendModel } from '@/lib/api';
import type { Model } from '@/lib/constants';
import type { LogLine, PendingPayment } from '@/app/page';

interface Props {
  addLog:         (m: string, t?: LogLine['type']) => void;
  requestPayment: (p: PendingPayment) => void;
  setLastModel:   (m: { name: string; accuracy: number; cost: string; cat: string }) => void;
  onNavigate:     (p: string) => void;
  searchQuery?:   string;
  onPurchaseComplete?: (m: Model) => void;
}

const FILTERS: string[] = ['All', 'Finance', 'NLP', 'Anomaly', 'DeFi'];

function backendToLocal(bm: BackendModel): Model {
  const fallback = MODELS_DATA.find(m => m.key === bm.key);
  if (fallback) return fallback;
  return {
    key: bm.key as Model['key'], name: bm.name, desc: bm.keywords.join(', '),
    accuracy: Math.round(bm.accuracy * 100), speed: 'Fast', uses: '0',
    price: `${bm.price_sol} SOL`, lamports: Math.round(bm.price_sol * 1e9),
    cat: bm.category, color: 'indigo', emoji: '',
  } as unknown as Model;
}

function creatorToLocal(m: any): Model {
  const existing = MODELS_DATA.find(d => d.key === m.model_key);
  if (existing) return existing;
  return {
    key: m.model_key as Model['key'], name: m.name, desc: m.description,
    accuracy: Math.round(m.accuracy * 100), speed: 'Fast',
    uses: m.total_uses > 999 ? `${(m.total_uses / 1000).toFixed(1)}k` : String(m.total_uses),
    price: `${m.price_sol} SOL`, lamports: Math.round(m.price_sol * 1e9),
    cat: m.category as Model['cat'], color: 'purple', emoji: '',
  } as unknown as Model;
}

function parseUses(s: string): number {
  const n = parseFloat(s);
  if (s.includes('k')) return n * 1000;
  return n;
}

export default function ModelsPage({ addLog, requestPayment, setLastModel, onNavigate, searchQuery = '', onPurchaseComplete }: Props) {
  const [search, setSearch] = useState(searchQuery);
  const [filter, setFilter] = useState('All');
  const [models, setModels] = useState<Model[]>([...MODELS_DATA]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setSearch(searchQuery); }, [searchQuery]);


  useEffect(() => {
    // AbortController gives localhost:8000 a max of 3 seconds before giving up.
    // Without this, a dead backend causes the marketplace to freeze for ~30s.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const load = async () => {
      // Run BOTH fetches at the same time — no sequential stalling
      const [backendResult, creatorResult] = await Promise.allSettled([
        fetchModels()
          .then(bms => bms.map(backendToLocal))
          .catch(() => [...MODELS_DATA]),
        fetch('http://localhost:8000/api/deploy/marketplace', { signal: controller.signal })
          .then(r => r.ok ? r.json() : [])
          .catch(() => []),
      ]);

      const backendModels: Model[] = backendResult.status === 'fulfilled'
        ? backendResult.value
        : [...MODELS_DATA];

      const creatorRaw: any[] = creatorResult.status === 'fulfilled' ? creatorResult.value : [];
      const existingKeys = new Set(backendModels.map(m => m.key));
      const creatorModels = creatorRaw
        .filter((m: any) => !existingKeys.has(m.model_key))
        .map(creatorToLocal);

      setModels([...backendModels, ...creatorModels]);
      setLoading(false);
    };

    load().catch(() => setLoading(false));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);


  const filtered = useMemo(() => {
    return models
      .filter(m => {
        const matchCat = filter === 'All' || m.cat === filter;
        const q = search.toLowerCase();
        const matchSearch = !q || m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q);
        return matchCat && matchSearch;
      })
      .sort((a, b) => b.accuracy - a.accuracy);
  }, [models, filter, search]);

  const handleUse = (m: Model) => {
    requestPayment({
      amount: m.price, description: m.name, service: 'AI Inference',
      onPaid: (sig) => {
        addLog(`[PAY] ${sig.slice(0, 16)}…`, 'success');
        setLastModel({ name: m.name, accuracy: m.accuracy, cost: m.price, cat: m.cat });
        onPurchaseComplete?.(m);
      },
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8, color: '#f5f5f5' }}>
          Marketplace
        </h1>
        <p style={{ fontSize: 14, color: '#94A3B8' }}>
          {models.length} production AI models · Pay per request · Settle on-chain
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.04)',
          borderRadius: 8, padding: '8px 14px',
          flex: '0 0 240px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: '#64748B' }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search models..."
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: '#f5f5f5', fontSize: 13, width: '100%',
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s',
                background: filter === f ? 'rgba(129,140,248,0.1)' : 'transparent',
                color: filter === f ? '#818cf8' : '#94A3B8',
                border: filter === f ? '1px solid rgba(129,140,248,0.2)' : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, color: '#64748B', marginLeft: 'auto' }}>
          {filtered.length} model{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}
      >
        {filtered.map((m, i) => (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{ display: 'flex' }}
          >
            <ModelCard model={m} onUse={handleUse} />
          </motion.div>
        ))}
      </motion.div>

      {/* Empty */}
      {filtered.length === 0 && !loading && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          borderRadius: 16, border: '1px dashed rgba(255,255,255,0.06)',
        }}>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>No models match your filter.</p>
          <button
            onClick={() => { setFilter('All'); setSearch(''); }}
            className="btn-ghost"
            style={{ padding: '8px 20px', fontSize: 13 }}
          >
            Clear filters
          </button>
        </div>
      )}
    </motion.div>
  );
}
