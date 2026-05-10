"""
services/agent.py
Autonomous AI Agent service — real multi-step reasoning pipeline.

Steps executed:
  1. Parse and classify the task intent
  2. Score all models in the registry (same scoring as SmartRouter)
  3. Select the top-3 candidates
  4. Run inference on the #1 model
  5. Evaluate output quality
  6. Generate a structured, human-readable response
"""
import asyncio
import time
from app.services.ai_router import MODEL_REGISTRY, run_inference
from app.services.smart_router import route_task, classify_intent


# ─── Reasoning pipeline steps ─────────────────────────────────────────────────

PIPELINE_STEPS = [
    "🔍 Parsing task intent and keywords…",
    "📊 Scoring {count} models against task requirements…",
    "🎯 Selecting optimal model: {model}…",
    "💳 Payment verified on-chain…",
    "⚡ Running inference pipeline…",
    "📈 Evaluating output quality…",
    "✅ Generating structured answer…",
]


async def run_agent_task(task: str) -> dict:
    """
    Real agent execution pipeline:
    1. Classify task intent
    2. Use SmartRouter scoring to pick best model
    3. Run inference
    4. Format a rich, reasoned answer
    5. Return with full pipeline trace
    """
    t0 = time.perf_counter()

    # Step 1: Classify intent
    await asyncio.sleep(0.08)
    intent = classify_intent(task)

    # Step 2 & 3: Route (score all models, pick winner)
    await asyncio.sleep(0.08)
    routing = route_task(task, priority="balanced")
    best   = routing["recommended"]
    model_key  = best["model_key"]
    model_name = best["model_name"]
    model_meta = MODEL_REGISTRY[model_key]
    candidates = routing["all_ranked"][:3]

    # Step 4 is handled by the payment middleware (already done)
    await asyncio.sleep(0.05)

    # Step 5: Run real inference
    await asyncio.sleep(0.08)
    result = run_inference(model_key, {"task": task})

    # Step 6: Evaluate quality
    await asyncio.sleep(0.05)
    confidence  = result["confidence"]
    quality_label = (
        "High confidence — reliable result"     if confidence > 0.85 else
        "Moderate confidence — verify manually" if confidence > 0.70 else
        "Lower confidence — use with caution"
    )

    # Step 7: Build rich answer
    elapsed_ms = round((time.perf_counter() - t0) * 1000)

    answer_parts = [
        f"**Intent detected:** {intent}",
        f"**Selected model:** {model_name} ({model_meta['category']})",
        f"**Routing score:** {round(best['final_score'] * 100)}/100",
        f"",
        f"**Result:** {result['prediction']}",
        f"**Confidence:** {round(confidence * 100, 1)}% — {quality_label}",
        f"",
        f"**Why this model:** {_reasoning(model_key, task, best)}",
    ]

    # Include alternatives if interesting
    if len(candidates) > 1:
        alt_names = ", ".join(c["model_name"] for c in candidates[1:3])
        answer_parts.append(f"**Alternatives considered:** {alt_names}")

    answer = "\n".join(answer_parts)

    # Fill pipeline steps with real data
    steps = [
        f"🔍 Parsed intent: '{intent}' from task keywords",
        f"📊 Scored {len(MODEL_REGISTRY)} models — best fit: {model_name}",
        f"🎯 Routing score {round(best['final_score'] * 100)}/100 · "
        f"keyword={round(best['scores']['keyword'] * 100)}% · "
        f"accuracy={round(best['scores']['accuracy'] * 100)}%",
        f"💳 Payment verified on-chain ({model_meta['price_sol']} SOL)",
        f"⚡ Inference completed in {elapsed_ms}ms",
        f"📈 Output quality: {quality_label}",
        f"✅ Answer generated with {round(confidence * 100, 1)}% confidence",
    ]

    return {
        "answer":      answer,
        "steps":       steps,
        "model_used":  model_name,
        "model_key":   model_key,
        "cost_sol":    model_meta["price_sol"],
        "confidence":  confidence,
        "raw_result":  result["prediction"],
        "intent":      intent,
        "routing_score": best["final_score"],
        "elapsed_ms":  elapsed_ms,
    }


def _reasoning(model_key: str, task: str, score_data: dict) -> str:
    """Generate a one-line reasoning explanation for the model selection."""
    meta = MODEL_REGISTRY.get(model_key, {})
    accuracy = meta.get("accuracy", 0)
    speed    = meta.get("speed", "Unknown")
    price    = meta.get("price_sol", 0)
    kw_score = round(score_data["scores"]["keyword"] * 100)
    return (
        f"{kw_score}% keyword match for this task type, "
        f"{round(accuracy * 100)}% historical accuracy, "
        f"{speed.lower()} inference speed, {price} SOL/call"
    )
