"""
api/models.py — AI model inference endpoints
POST /api/model/{model_key}   — Run inference (payment-gated, saves transaction)
GET  /api/models              — List all available models
"""
from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas.schemas import InferenceRequest, InferenceResponse, InferenceResult
from app.services.ai_router import MODEL_REGISTRY, run_inference
from app.api.payments import require_payment
from app.db.database import get_db
from app.db.models import Transaction

router = APIRouter(prefix="/model", tags=["Models"])


@router.get("s", summary="List all models")
async def list_models():
    return [
        {
            "key": key,
            "name": m["name"],
            "category": m["category"],
            "price_sol": m["price_sol"],
            "accuracy": m["accuracy"],
            "keywords": m["keywords"],
        }
        for key, m in MODEL_REGISTRY.items()
    ]


@router.post("/{model_key}", response_model=InferenceResponse, summary="Run model inference")
async def run_model(
    model_key: str,
    body: InferenceRequest,
    x_solana_signature: str | None = Header(default=None),
    x_wallet_address: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    model_meta = MODEL_REGISTRY.get(model_key)
    if not model_meta:
        raise HTTPException(status_code=404, detail=f"Model '{model_key}' not found")

    sig = await require_payment(
        x_solana_signature=x_solana_signature,
        amount_sol=model_meta["price_sol"],
        service=f"Inference: {model_meta['name']}",
        wallet_address=x_wallet_address or "",
    )

    result = run_inference(model_key, body.input)

    # Save transaction record
    tx = Transaction(
        wallet_address=x_wallet_address or "demo",
        signature=sig,
        amount_sol=model_meta["price_sol"],
        service_type="inference",
        service_ref=model_key,
        verified=True,
    )
    db.add(tx)
    db.commit()

    return InferenceResponse(
        result=InferenceResult(
            prediction=result["prediction"],
            confidence=result["confidence"],
        ),
        model=result["model"],
        cost_sol=result["price_sol"],
        signature=sig,
        tx_verified=True,
    )
