'use client';

const ITEMS = [
  '0x7f...a1b just earned 0.05 SOL from inference',
  'New model "Llama-3-Fin" deployed to Devnet',
  'Tx verified: 0.001 SOL paid for Sentiment Analyzer',
  'Smart Contract CPI called: Transfer 0.02 SOL to 8B2...f9',
  'Marketplace volume 24h: 312.4 SOL (+12.4%)',
  '0x9c...3f2 just bought "DeFi Risk Scorer" dataset',
  'Validator nodes synced: 142ms latency',
  '0x1a...b44 earned 0.015 SOL from dataset access',
  'New Agent "Risk Manager Alpha" initialized',
];

export default function ActivityTicker() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div style={{
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      fontWeight: 500,
      color: '#F1F5F9', // Bright white text
      background: 'rgba(16, 245, 160, 0.05)', // Subtle green neon background
      borderTop: '1px solid rgba(16, 245, 160, 0.2)',
      borderBottom: '1px solid rgba(16, 245, 160, 0.2)',
      padding: '10px 0',
      boxShadow: '0 0 20px rgba(16, 245, 160, 0.05)',
    }}>
      <div className="ticker-track" style={{
        display: 'flex',
        gap: 60,
        whiteSpace: 'nowrap',
        width: 'fit-content',
      }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#10F5A0',
              boxShadow: '0 0 8px #10F5A0', // Neon glowing dot
              flexShrink: 0,
            }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
