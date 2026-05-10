"""
services/model_seeder.py
Seed the 9 core marketplace AI models into the DB on startup.
Models are marked is_approved=True (pre-approved platform models).
Idempotent — skips models that already exist.
"""
from sqlalchemy.orm import Session
from app.db.models import AIModel

PLATFORM_WALLET = "PLATFORM_NEURALSOL"

SEED_MODELS = [
    {
        "key":         "btc_price_predictor",
        "name":        "BTC Price Predictor",
        "description": "Predicts Bitcoin 24h price using LSTM + technical indicators. Trained on 6 years of OHLCV data from 5 exchanges.",
        "category":    "Finance",
        "price_sol":   0.001,
        "accuracy":    0.72,
        "total_uses":  128400,
    },
    {
        "key":         "sentiment_analyzer",
        "name":        "Crypto Sentiment",
        "description": "Classifies crypto social posts as bullish, bearish, or neutral using a fine-tuned RoBERTa model.",
        "category":    "NLP",
        "price_sol":   0.0005,
        "accuracy":    0.88,
        "total_uses":  94100,
    },
    {
        "key":         "eth_classifier",
        "name":        "ETH Market Classifier",
        "description": "Classifies ETH market regime: bull, bear, or accumulation phase. Uses on-chain + macro signals.",
        "category":    "Finance",
        "price_sol":   0.001,
        "accuracy":    0.79,
        "total_uses":  61700,
    },
    {
        "key":         "anomaly_detector",
        "name":        "Anomaly Detector",
        "description": "Real-time anomaly detection in crypto price and volume data using Isolation Forest + Z-score.",
        "category":    "Anomaly",
        "price_sol":   0.002,
        "accuracy":    0.83,
        "total_uses":  42000,
    },
    {
        "key":         "defi_risk_scorer",
        "name":        "DeFi Risk Scorer",
        "description": "Scores DeFi protocol risk across smart contract, liquidity, and governance dimensions.",
        "category":    "DeFi",
        "price_sol":   0.0015,
        "accuracy":    0.76,
        "total_uses":  28300,
    },
    {
        "key":         "nft_trend",
        "name":        "NFT Trend Predictor",
        "description": "Forecasts NFT collection floor price movement (7-day horizon) using sales history and wash trading detection.",
        "category":    "Finance",
        "price_sol":   0.0012,
        "accuracy":    0.68,
        "total_uses":  19500,
    },
    {
        "key":         "wallet_scorer",
        "name":        "Wallet Behavior Scorer",
        "description": "Analyzes on-chain wallet history to score trading style: trader, holder, DeFi power user.",
        "category":    "DeFi",
        "price_sol":   0.0008,
        "accuracy":    0.81,
        "total_uses":  37200,
    },
    {
        "key":         "liquidation_alert",
        "name":        "Liquidation Alert Model",
        "description": "Predicts imminent DeFi liquidation risk. Returns health factor assessment + urgency level.",
        "category":    "DeFi",
        "price_sol":   0.0018,
        "accuracy":    0.85,
        "total_uses":  22100,
    },
    {
        "key":         "macro_classifier",
        "name":        "Macro Regime Classifier",
        "description": "Classifies crypto market macro regime using on-chain + macro data (Fed signals, VIX, BTC dominance).",
        "category":    "Finance",
        "price_sol":   0.0022,
        "accuracy":    0.74,
        "total_uses":  15800,
    },
]


def seed_marketplace_models(db: Session) -> None:
    """
    Idempotently seed the 9 core marketplace models.
    Won't overwrite existing entries — safe to call on every startup.
    """
    added = 0
    for raw in SEED_MODELS:
        exists = db.query(AIModel).filter(AIModel.key == raw["key"]).first()
        if exists:
            continue

        # Use a copy — never mutate SEED_MODELS entries
        m_data     = dict(raw)
        total_uses = m_data.pop("total_uses", 0)
        model = AIModel(
            **m_data,
            owner_wallet=PLATFORM_WALLET,
            endpoint_url=None,
            is_active=True,
            is_approved=True,           # pre-approved platform models
            total_uses=total_uses,
            total_revenue_sol=round(total_uses * m_data["price_sol"], 4),
        )
        db.add(model)
        added += 1

    if added:
        db.commit()
        print(f"   [SEED] {added} marketplace models seeded into DB")
    else:
        print("   [SEED] Marketplace models already present — skipped")
