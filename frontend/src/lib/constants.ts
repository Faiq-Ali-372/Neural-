// ─── Design Tokens ────────────────────────────────────────────────────────────
export const COLORS = {
  bg: '#030303',
  surface: 'rgba(255,255,255,0.02)',
  surface2: 'rgba(255,255,255,0.04)',
  surface3: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.06)',
  borderHi: 'rgba(255,255,255,0.12)',
  accent: '#818cf8',
  accentDim: '#6366f1',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  text: '#f5f5f5',
  text2: '#888888',
  text3: '#555555',
  text4: '#333333',
} as const;

// ─── Backend ───────────────────────────────────────────────────────────────
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

// ─── Solana ────────────────────────────────────────────────────────────────
export const SOLANA_NETWORK = 'devnet';
export const SOLANA_RPC = 'https://api.devnet.solana.com';
export const PLATFORM_WALLET = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
export const PROGRAM_ID = 'FcpyF36Lcve7QwvejkB62RiBA2NReYxQE2rp3VoDHUQW';

// ─── Models Data ──────────────────────────────────────────────────────────
export const MODELS_DATA = [
  { key: 'btc_price_predictor', name: 'BTC Price Predictor', desc: 'Predicts Bitcoin 24h price using LSTM + technical indicators', accuracy: 72, speed: 'Fast', uses: '128.4k', price: '0.001 SOL', lamports: 1_000_000, cat: 'Finance', color: 'amber', emoji: '₿' },
  { key: 'sentiment_analyzer', name: 'Crypto Sentiment', desc: 'Classifies crypto social posts: bullish, bearish, neutral', accuracy: 88, speed: 'Fast', uses: '94.1k', price: '0.0005 SOL', lamports: 500_000, cat: 'NLP', color: 'cyan', emoji: '📊' },
  { key: 'eth_classifier', name: 'ETH Market Classifier', desc: 'Classifies ETH market regime: bull, bear, accumulation', accuracy: 79, speed: 'Medium', uses: '61.7k', price: '0.001 SOL', lamports: 1_000_000, cat: 'Finance', color: 'indigo', emoji: 'Ξ' },
  { key: 'anomaly_detector', name: 'Anomaly Detector', desc: 'Real-time anomaly detection in price and volume data', accuracy: 83, speed: 'Fast', uses: '42.0k', price: '0.002 SOL', lamports: 2_000_000, cat: 'Anomaly', color: 'red', emoji: '🔍' },
  { key: 'defi_risk_scorer', name: 'DeFi Risk Scorer', desc: 'Scores DeFi protocol risk: smart contract + liquidity + governance', accuracy: 76, speed: 'Slow', uses: '28.3k', price: '0.0015 SOL', lamports: 1_500_000, cat: 'DeFi', color: 'green', emoji: '⚠️' },
  { key: 'nft_trend', name: 'NFT Trend Predictor', desc: 'Forecasts NFT collection floor price movement', accuracy: 68, speed: 'Medium', uses: '19.5k', price: '0.0012 SOL', lamports: 1_200_000, cat: 'Finance', color: 'pink', emoji: '🖼️' },
  { key: 'wallet_scorer', name: 'Wallet Behavior Scorer', desc: 'Analyzes on-chain wallet history to score trading style', accuracy: 81, speed: 'Fast', uses: '37.2k', price: '0.0008 SOL', lamports: 800_000, cat: 'DeFi', color: 'indigo', emoji: '👛' },
  { key: 'liquidation_alert', name: 'Liquidation Alert Model', desc: 'Predicts imminent DeFi liquidation risk for given positions', accuracy: 85, speed: 'Fast', uses: '22.1k', price: '0.0018 SOL', lamports: 1_800_000, cat: 'DeFi', color: 'red', emoji: '🚨' },
  { key: 'macro_classifier', name: 'Macro Regime Classifier', desc: 'Classifies crypto market macro regime from on-chain + macro data', accuracy: 74, speed: 'Medium', uses: '15.8k', price: '0.0022 SOL', lamports: 2_200_000, cat: 'Finance', color: 'amber', emoji: '🌐' },
] as const;

export type Model = typeof MODELS_DATA[number];

// ─── Navigation Items ─────────────────────────────────────────────────────
export const NAV_ITEMS = [
  {
    group: 'Platform', items: [
      { key: 'home', label: 'Overview', icon: 'home' },
      { key: 'agent', label: 'AI Agent', icon: 'agent', badge: 'Beta' as const },
      { key: 'models', label: 'Marketplace', icon: 'grid' },
    ]
  },
  {
    group: 'Create', items: [
      { key: 'deploy', label: 'Deploy Model', icon: 'upload' },
      { key: 'datasets', label: 'Datasets', icon: 'data' },
    ]
  },
  {
    group: 'Account', items: [
      { key: 'dashboard', label: 'Analytics', icon: 'chart' },
      { key: 'library', label: 'My Library', icon: 'data', badge: 'Purchases' as const },
      { key: 'settings', label: 'Settings', icon: 'settings' },
      { key: 'admin', label: 'Creator', icon: 'shield', badge: 'Earnings' as const },
    ]
  },
] as const;
