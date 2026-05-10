"""
services/ai_router.py
Smart AI Router: model registry, task-aware inference simulation.

The output_fn for each model produces deterministic, task-contextual outputs
based on extracted keywords — not purely random. In production, these would
call real GPU endpoints (RunPod, Modal, Groq, etc.).
"""
import random
import re
import hashlib
from typing import Any


def _seed_from(task: str) -> random.Random:
    """Create a seeded RNG from the task string for reproducible results."""
    h = int(hashlib.sha256(task.encode()).hexdigest(), 16) % (2**32)
    return random.Random(h)


def _extract_coin(task: str) -> str:
    t = task.lower()
    if "eth" in t or "ethereum" in t: return "ETH"
    if "sol" in t or "solana" in t:   return "SOL"
    if "bnb" in t:                    return "BNB"
    return "BTC"


def _extract_protocol(task: str) -> str:
    t = task.lower()
    if "aave" in t:     return "Aave"
    if "compound" in t: return "Compound"
    if "curve" in t:    return "Curve"
    if "uniswap" in t:  return "Uniswap"
    return "DeFi Protocol"


# ─── Model Registry ────────────────────────────────────────────────────────────
MODEL_REGISTRY = {
    "btc_price_predictor": {
        "name":     "BTC Price Predictor",
        "category": "Finance",
        "price_sol": 0.001,
        "accuracy":  0.72,
        "speed":     "Fast",
        "keywords":  ["btc", "bitcoin", "price", "predict", "crypto", "market"],
        "output_fn": lambda inp: _btc_prediction(inp.get("task", "")),
    },
    "sentiment_analyzer": {
        "name":     "Crypto Sentiment",
        "category": "NLP",
        "price_sol": 0.0005,
        "accuracy":  0.88,
        "speed":     "Fast",
        "keywords":  ["sentiment", "bullish", "bearish", "news", "social", "twitter", "mood"],
        "output_fn": lambda inp: _sentiment_output(inp.get("task", "")),
    },
    "eth_classifier": {
        "name":     "ETH Market Classifier",
        "category": "Finance",
        "price_sol": 0.001,
        "accuracy":  0.79,
        "speed":     "Medium",
        "keywords":  ["eth", "ethereum", "regime", "classify", "market"],
        "output_fn": lambda inp: _eth_classifier(inp.get("task", "")),
    },
    "anomaly_detector": {
        "name":     "Anomaly Detector",
        "category": "Anomaly",
        "price_sol": 0.002,
        "accuracy":  0.83,
        "speed":     "Fast",
        "keywords":  ["anomaly", "detect", "unusual", "outlier", "spike", "volume"],
        "output_fn": lambda inp: _anomaly_output(inp.get("task", "")),
    },
    "defi_risk_scorer": {
        "name":     "DeFi Risk Scorer",
        "category": "DeFi",
        "price_sol": 0.0015,
        "accuracy":  0.76,
        "speed":     "Slow",
        "keywords":  ["defi", "risk", "protocol", "liquidation", "tvl", "aave", "compound"],
        "output_fn": lambda inp: _defi_risk(inp.get("task", "")),
    },
    "nft_trend": {
        "name":     "NFT Trend Predictor",
        "category": "Finance",
        "price_sol": 0.0012,
        "accuracy":  0.68,
        "speed":     "Medium",
        "keywords":  ["nft", "floor", "collection", "opensea", "jpeg"],
        "output_fn": lambda inp: _nft_trend(inp.get("task", "")),
    },
    "wallet_scorer": {
        "name":     "Wallet Behavior Scorer",
        "category": "DeFi",
        "price_sol": 0.0008,
        "accuracy":  0.81,
        "speed":     "Fast",
        "keywords":  ["wallet", "behavior", "score", "history", "on-chain", "address"],
        "output_fn": lambda inp: _wallet_score(inp.get("task", "")),
    },
    "liquidation_alert": {
        "name":     "Liquidation Alert Model",
        "category": "DeFi",
        "price_sol": 0.0018,
        "accuracy":  0.85,
        "speed":     "Fast",
        "keywords":  ["liquidation", "margin", "collateral", "health", "factor"],
        "output_fn": lambda inp: _liquidation_alert(inp.get("task", "")),
    },
    "macro_classifier": {
        "name":     "Macro Regime Classifier",
        "category": "Finance",
        "price_sol": 0.0022,
        "accuracy":  0.74,
        "speed":     "Medium",
        "keywords":  ["macro", "regime", "fed", "interest", "inflation", "global", "rate"],
        "output_fn": lambda inp: _macro_regime(inp.get("task", "")),
    },
}


# ─── Task-aware output functions ──────────────────────────────────────────────

def _btc_prediction(task: str) -> dict:
    rng = _seed_from(task)
    base  = rng.randint(68000, 76000)
    upper = base + rng.randint(3000, 8000)
    trend = "↑ Bullish" if rng.random() > 0.42 else "↓ Bearish"
    coin  = _extract_coin(task)
    return {
        "prediction": f"{coin} Forecast (24h): ${base:,} — ${upper:,} | Signal: {trend}",
        "confidence":  round(rng.uniform(0.68, 0.89), 3),
    }


def _sentiment_output(task: str) -> dict:
    rng = _seed_from(task)
    t   = task.lower()
    # Weight sentiment based on task keywords
    bull_words = sum(1 for w in ["bull", "up", "gain", "pump", "buy", "moon", "green"] if w in t)
    bear_words = sum(1 for w in ["bear", "down", "dump", "sell", "crash", "red", "fear"] if w in t)
    if bull_words > bear_words:
        label, emoji = "Positive (Bullish)", "🟢"
    elif bear_words > bull_words:
        label, emoji = "Negative (Bearish)", "🔴"
    else:
        choice = rng.choices(["Positive (Bullish) 🟢", "Negative (Bearish) 🔴", "Neutral ⚪"], weights=[45, 30, 25])[0]
        return {"prediction": choice, "confidence": round(rng.uniform(0.72, 0.95), 3)}

    score = rng.randint(55, 90)
    return {
        "prediction": f"{label} {emoji} — Sentiment Score: {score}/100",
        "confidence":  round(rng.uniform(0.78, 0.95), 3),
    }


def _eth_classifier(task: str) -> dict:
    rng = _seed_from(task)
    regimes = [
        ("Bull Market 🐂", 0.40),
        ("Bear Market 🐻", 0.25),
        ("Accumulation Phase 🔄", 0.25),
        ("Distribution Phase ⬇️", 0.10),
    ]
    regime = rng.choices([r[0] for r in regimes], weights=[r[1] for r in regimes])[0]
    return {
        "prediction": f"ETH Regime: {regime} | Momentum: {rng.choice(['Strong', 'Moderate', 'Weak'])}",
        "confidence":  round(rng.uniform(0.65, 0.85), 3),
    }


def _anomaly_output(task: str) -> dict:
    rng = _seed_from(task)
    outcomes = [
        ("No Anomaly Detected ✅", 0.55),
        ("⚠️ Volume Spike Detected", 0.20),
        ("⚠️ Price Anomaly", 0.15),
        ("🚨 Flash Crash Pattern Detected", 0.10),
    ]
    base  = rng.choices([o[0] for o in outcomes], weights=[o[1] for o in outcomes])[0]
    sigma = round(rng.uniform(1.1, 4.2), 1)
    if "Anomaly" in base and "No" not in base:
        base += f" +{sigma}σ"
    return {"prediction": base, "confidence": round(rng.uniform(0.75, 0.94), 3)}


def _defi_risk(task: str) -> dict:
    rng      = _seed_from(task)
    protocol = _extract_protocol(task)
    score    = rng.randint(8, 92)
    label    = "Low 🟢" if score < 35 else ("Medium 🟡" if score < 65 else "High 🔴")
    tvl_str  = f"${rng.randint(50, 9000)}M TVL"
    return {
        "prediction": f"{protocol} Risk Score: {score}/100 ({label}) | {tvl_str}",
        "confidence":  round(rng.uniform(0.68, 0.84), 3),
    }


def _nft_trend(task: str) -> dict:
    rng    = _seed_from(task)
    change = round(rng.uniform(-18.0, 28.0), 1)
    arrow  = "↑" if change > 0 else "↓"
    emoji  = "📈" if change > 0 else "📉"
    col    = task.split()[0].title() if task else "Collection"
    return {
        "prediction": f"{col} Floor: {arrow} {abs(change):.1f}% (7d) {emoji} | Vol: {rng.randint(10, 500)} ETH",
        "confidence":  round(rng.uniform(0.55, 0.78), 3),
    }


def _wallet_score(task: str) -> dict:
    rng    = _seed_from(task)
    score  = rng.randint(380, 920)
    style  = rng.choice(["Diamond Hands 💎", "Active Trader ⚡", "DeFi Power User 🏦", "Long-term Holder 🌙"])
    txs    = rng.randint(12, 1800)
    return {
        "prediction": f"Wallet Score: {score}/1000 — {style} | {txs} on-chain txs analyzed",
        "confidence":  round(rng.uniform(0.72, 0.90), 3),
    }


def _liquidation_alert(task: str) -> dict:
    rng = _seed_from(task)
    hf  = round(rng.uniform(0.95, 2.80), 2)
    if hf < 1.05:
        pred = f"🚨 CRITICAL: Health Factor={hf} — Liquidation Imminent!"
    elif hf < 1.25:
        pred = f"⚠️ WARNING: Health Factor={hf} — Add Collateral Now"
    elif hf < 1.60:
        pred = f"🟡 MODERATE Risk: Health Factor={hf} — Monitor Position"
    else:
        pred = f"✅ SAFE: Health Factor={hf} — No Immediate Risk"
    return {"prediction": pred, "confidence": round(rng.uniform(0.78, 0.95), 3)}


def _macro_regime(task: str) -> dict:
    rng   = _seed_from(task)
    regimes = [("Risk-On 🟢", 0.38), ("Risk-Off 🔴", 0.32), ("Neutral / Transitioning ⚪", 0.30)]
    regime = rng.choices([r[0] for r in regimes], weights=[r[1] for r in regimes])[0]
    vix    = round(rng.uniform(12.0, 42.0), 1)
    return {
        "prediction": f"Macro Regime: {regime} | VIX-equiv: {vix} | Rate cycle: {rng.choice(['Hiking', 'Pausing', 'Cutting'])}",
        "confidence":  round(rng.uniform(0.65, 0.82), 3),
    }


# ─── Public interface ─────────────────────────────────────────────────────────

def select_model(task: str) -> str:
    """
    Keyword-based model selection (simple fallback).
    The SmartRouter service provides the full multi-criteria version.
    """
    task_lower = task.lower()
    scores: dict[str, int] = {}
    for key, meta in MODEL_REGISTRY.items():
        score = sum(1 for kw in meta["keywords"] if kw in task_lower)
        scores[key] = score
    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else "btc_price_predictor"


def run_inference(model_key: str, input_data: dict[str, Any]) -> dict[str, Any]:
    """Run task-aware inference for a given model key."""
    model = MODEL_REGISTRY.get(model_key)
    if not model:
        raise ValueError(f"Unknown model: {model_key}")
    result = model["output_fn"](input_data)
    return {
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "model":      model["name"],
        "category":   model["category"],
        "price_sol":  model["price_sol"],
    }
