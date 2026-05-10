"""
services/smart_router.py
=========================
The AI Orchestration Engine — real multi-criteria model selection.

Scoring formula:
  score = 0.4 × accuracy + 0.3 × keyword_match + 0.2 × speed_bonus + 0.1 × cost_bonus

Returns ranked candidates with confidence, reasoning, and fallback chain.
No random selection. Every decision is explainable.
"""
import re
import time
from typing import Any
from app.services.ai_router import MODEL_REGISTRY

# Speed tier bonuses (normalized 0-1)
SPEED_BONUS = {"Fast": 1.0, "Medium": 0.55, "Slow": 0.1}

# Cost bonus: cheaper = higher bonus (normalized against max price)
MAX_PRICE = max(m["price_sol"] for m in MODEL_REGISTRY.values())

# Intent patterns — maps regex patterns to categories
INTENT_PATTERNS = [
    (r"\b(btc|bitcoin|sats)\b",                          "BTC Analysis"),
    (r"\b(eth|ethereum|ether)\b",                         "ETH Analysis"),
    (r"\b(sentiment|bullish|bearish|mood|social|tweet)\b","Sentiment Analysis"),
    (r"\b(anomal|spike|unusual|outlier|detect)\b",        "Anomaly Detection"),
    (r"\b(defi|protocol|tvl|aave|compound|liquidity)\b",  "DeFi Risk"),
    (r"\b(nft|floor|collection|jpeg|opensea)\b",          "NFT Trends"),
    (r"\b(wallet|address|history|behavior|on.chain)\b",   "Wallet Analysis"),
    (r"\b(liquidat|margin|collateral|health.factor)\b",   "Liquidation Risk"),
    (r"\b(macro|fed|inflation|interest.rate|regime)\b",   "Macro Analysis"),
    (r"\b(predict|forecast|price|target)\b",              "Price Prediction"),
    (r"\b(risk|danger|exposure|position)\b",              "Risk Assessment"),
]


def classify_intent(task: str) -> str:
    """Extract the primary intent category from a task string."""
    task_lower = task.lower()
    for pattern, label in INTENT_PATTERNS:
        if re.search(pattern, task_lower):
            return label
    return "General AI Query"


def _keyword_score(model_key: str, task: str) -> float:
    """
    TF-IDF-inspired keyword scoring.
    Returns 0.0–1.0 based on fraction of model keywords present in task.
    """
    meta = MODEL_REGISTRY[model_key]
    task_lower = task.lower()
    keywords = meta["keywords"]
    if not keywords:
        return 0.0
    matches = sum(1 for kw in keywords if kw in task_lower)
    # Bonus for exact phrase matches
    exact_bonus = sum(0.3 for kw in keywords if f" {kw} " in f" {task_lower} ")
    raw = (matches + exact_bonus) / len(keywords)
    return min(raw, 1.0)


def _speed_score(model_key: str) -> float:
    meta = MODEL_REGISTRY[model_key]
    return SPEED_BONUS.get(meta.get("speed", "Medium"), 0.55)


def _cost_score(model_key: str) -> float:
    """Lower cost = higher score."""
    price = MODEL_REGISTRY[model_key]["price_sol"]
    return 1.0 - (price / MAX_PRICE)


def _accuracy_score(model_key: str) -> float:
    return MODEL_REGISTRY[model_key]["accuracy"]  # already 0-1


def score_model(
    model_key: str,
    task: str,
    priority: str = "balanced",  # "speed" | "accuracy" | "cost" | "balanced"
) -> dict[str, Any]:
    """
    Compute a composite score for a model given a task and user priority.
    Returns a dict with component scores and the final weighted score.
    """
    kw   = _keyword_score(model_key, task)
    acc  = _accuracy_score(model_key)
    spd  = _speed_score(model_key)
    cost = _cost_score(model_key)

    # Priority-adjusted weights
    weights = {
        "balanced":  {"kw": 0.35, "acc": 0.35, "spd": 0.15, "cost": 0.15},
        "speed":     {"kw": 0.25, "acc": 0.20, "spd": 0.40, "cost": 0.15},
        "accuracy":  {"kw": 0.25, "acc": 0.50, "spd": 0.10, "cost": 0.15},
        "cost":      {"kw": 0.30, "acc": 0.20, "spd": 0.15, "cost": 0.35},
    }.get(priority, {"kw": 0.35, "acc": 0.35, "spd": 0.15, "cost": 0.15})

    final = (
        weights["kw"]   * kw  +
        weights["acc"]  * acc +
        weights["spd"]  * spd +
        weights["cost"] * cost
    )

    meta = MODEL_REGISTRY[model_key]
    return {
        "model_key":    model_key,
        "model_name":   meta["name"],
        "category":     meta["category"],
        "price_sol":    meta["price_sol"],
        "accuracy_pct": round(acc * 100),
        "speed":        meta.get("speed", "Medium"),
        "scores": {
            "keyword":  round(kw,   3),
            "accuracy": round(acc,  3),
            "speed":    round(spd,  3),
            "cost":     round(cost, 3),
        },
        "final_score": round(final, 4),
    }


def build_reasoning(ranked: list[dict], intent: str, priority: str) -> str:
    """Generate a human-readable explanation of the routing decision."""
    top = ranked[0]
    lines = [
        f"Detected intent: **{intent}**.",
        f"Priority mode: **{priority}**.",
        f"Selected **{top['model_name']}** with a composite score of {top['final_score']:.3f}.",
    ]
    if top["scores"]["keyword"] > 0.3:
        lines.append(f"Strong keyword alignment ({top['scores']['keyword']:.0%} match rate).")
    if top["scores"]["accuracy"] > 0.8:
        lines.append(f"High accuracy model ({top['accuracy_pct']}%).")
    if len(ranked) > 1:
        runner_up = ranked[1]
        delta = top["final_score"] - runner_up["final_score"]
        lines.append(
            f"Runner-up: {runner_up['model_name']} (score delta: {delta:.3f})."
        )
    return " ".join(lines)


def route_task(
    task: str,
    budget_sol: float | None = None,
    priority: str = "balanced",
) -> dict[str, Any]:
    """
    Main routing function. Returns full routing decision:
    - recommended model
    - ranked alternatives
    - confidence
    - intent
    - reasoning
    """
    t0 = time.perf_counter()
    intent = classify_intent(task)

    # Score all models
    all_scores = []
    for key in MODEL_REGISTRY:
        meta = MODEL_REGISTRY[key]
        # Budget filter: skip models that exceed budget
        if budget_sol is not None and meta["price_sol"] > budget_sol:
            continue
        s = score_model(key, task, priority)
        all_scores.append(s)

    # If budget filter removed everything, ignore budget
    if not all_scores:
        all_scores = [score_model(k, task, priority) for k in MODEL_REGISTRY]

    # Sort descending by final score
    ranked = sorted(all_scores, key=lambda x: x["final_score"], reverse=True)

    # Confidence: how much better is top-1 vs top-2?
    if len(ranked) >= 2:
        delta = ranked[0]["final_score"] - ranked[1]["final_score"]
        # Normalize: delta of 0.3+ = 100% confidence
        confidence = min(delta / 0.3, 1.0)
    else:
        confidence = 1.0

    reasoning = build_reasoning(ranked, intent, priority)
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

    return {
        "recommended":      ranked[0],
        "alternatives":     ranked[1:4],   # top 3 alternatives
        "all_ranked":       ranked,
        "intent":           intent,
        "reasoning":        reasoning,
        "confidence":       round(confidence, 3),
        "priority":         priority,
        "budget_sol":       budget_sol,
        "candidates_count": len(all_scores),
        "routing_ms":       elapsed_ms,
    }
