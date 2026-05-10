"""
api/deploy.py — Creator model deployment endpoint

POST   /api/deploy/model              — Register a new AI model
GET    /api/deploy/models             — List models owned by a wallet
GET    /api/deploy/marketplace        — Public: list all approved+active models
PATCH  /api/deploy/model/{key}        — Update model metadata (owner only)
DELETE /api/deploy/model/{key}        — Deactivate a model (owner only)
POST   /api/deploy/approve/{key}      — Admin: approve a pending model
GET    /api/deploy/admin/all          — Admin: list ALL models (pending + approved)
GET    /api/deploy/program-info       — On-chain program deployment status
"""
import re
from fastapi import APIRouter, Header, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models import AIModel

router = APIRouter(prefix="/deploy", tags=["Deploy"])

# In production, use a proper admin auth system (JWT + role-based)
ADMIN_WALLET = "ADMIN_OVERRIDE"


# ─── Schemas ──────────────────────────────────────────────────────────────────

class DeployModelRequest(BaseModel):
    name:         str   = Field(..., min_length=2, max_length=128)
    description:  str   = Field(..., min_length=10, max_length=1000)
    category:     str   = Field(..., min_length=2, max_length=32)
    price_sol:    float = Field(..., gt=0, le=10.0)
    accuracy:     float = Field(..., ge=0.0, le=1.0)
    endpoint_url: Optional[str] = Field(default=None, max_length=512)
    keywords:     list[str] = Field(default=[], max_length=20)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        allowed = {"Finance", "NLP", "DeFi", "Anomaly", "Vision", "General", "Other"}
        if v not in allowed:
            raise ValueError(f"Category must be one of: {', '.join(sorted(allowed))}")
        return v


class UpdateModelRequest(BaseModel):
    description:  Optional[str]   = Field(default=None, max_length=1000)
    price_sol:    Optional[float] = Field(default=None, gt=0, le=10.0)
    accuracy:     Optional[float] = Field(default=None, ge=0.0, le=1.0)
    endpoint_url: Optional[str]   = Field(default=None, max_length=512)
    is_active:    Optional[bool]  = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _make_key(name: str) -> str:
    """Convert model name to a URL-safe unique key."""
    key = name.lower()
    key = re.sub(r"[^a-z0-9]+", "_", key).strip("_")
    return key[:64]


def _require_wallet(wallet: str | None) -> str:
    if not wallet:
        raise HTTPException(status_code=401, detail="X-Wallet-Address header required")
    return wallet


def _model_to_dict(m: AIModel) -> dict:
    return {
        "model_key":     m.key,
        "name":          m.name,
        "description":   m.description,
        "category":      m.category,
        "price_sol":     m.price_sol,
        "accuracy":      m.accuracy,
        "is_active":     m.is_active,
        "is_approved":   m.is_approved,
        "total_uses":    m.total_uses,
        "total_revenue": m.total_revenue_sol,
        "created_at":    m.created_at.isoformat(),
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/model", summary="Deploy (register) a new AI model")
async def deploy_model(
    body: DeployModelRequest,
    x_wallet_address: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    wallet   = _require_wallet(x_wallet_address)
    base_key = _make_key(body.name)

    existing = db.query(AIModel).filter(AIModel.key == base_key).first()
    if existing:
        count     = db.query(AIModel).filter(AIModel.key.startswith(base_key)).count()
        model_key = f"{base_key}_{count}"
    else:
        model_key = base_key

    model = AIModel(
        key=model_key,
        name=body.name,
        description=body.description,
        category=body.category,
        price_sol=body.price_sol,
        accuracy=body.accuracy,
        endpoint_url=body.endpoint_url,
        owner_wallet=wallet,
        is_active=True,
        is_approved=False,          # pending governance review by default
        total_uses=0,
        total_revenue_sol=0.0,
    )
    db.add(model)
    db.commit()
    db.refresh(model)

    return {
        **_model_to_dict(model),
        "owner_wallet": model.owner_wallet,
        "message": (
            f"Model '{model.name}' registered as '{model.key}'. "
            "Pending approval before appearing in the public marketplace."
        ),
    }


@router.get("/models", summary="List models owned by a wallet")
async def list_my_models(
    x_wallet_address: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    wallet = _require_wallet(x_wallet_address)
    models = db.query(AIModel).filter(AIModel.owner_wallet == wallet).all()
    return [_model_to_dict(m) for m in models]


@router.get("/marketplace", summary="Public marketplace: all approved + active models")
async def list_marketplace_models(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Return all approved + active creator-deployed models for the marketplace."""
    q = db.query(AIModel).filter(
        AIModel.is_active == True,
        AIModel.is_approved == True,
    )
    if category:
        q = q.filter(AIModel.category == category)
    models = q.order_by(AIModel.total_uses.desc()).all()
    return [_model_to_dict(m) for m in models]


@router.post("/approve/{key}", summary="Admin: approve a pending model for public listing")
async def approve_model(
    key: str,
    x_wallet_address: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Governance endpoint — approve a creator-deployed model for public visibility."""
    wallet = _require_wallet(x_wallet_address)
    if wallet != ADMIN_WALLET:
        raise HTTPException(status_code=403, detail="Admin access required")
    model = db.query(AIModel).filter(AIModel.key == key).first()
    if not model:
        raise HTTPException(status_code=404, detail=f"Model '{key}' not found")
    model.is_approved = True
    db.commit()
    return {"message": f"Model '{key}' approved and now visible in marketplace.", "model_key": key}


@router.get("/admin/all", summary="Admin: list ALL models regardless of approval status")
async def list_all_models_admin(
    x_wallet_address: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Returns every model in the DB (approved + pending + inactive).
    Used by the Admin Panel to review and approve submitted models.
    In production: lock this behind JWT admin role.
    """
    wallet = _require_wallet(x_wallet_address)
    if wallet != ADMIN_WALLET:
        raise HTTPException(status_code=403, detail="Admin access required")
    models = db.query(AIModel).order_by(AIModel.is_approved.asc(), AIModel.created_at.desc()).all()
    return [
        {**_model_to_dict(m), "owner_wallet": m.owner_wallet}
        for m in models
    ]


@router.patch("/model/{key}", summary="Update model metadata (owner only)")
async def update_model(
    key: str,
    body: UpdateModelRequest,
    x_wallet_address: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    wallet = _require_wallet(x_wallet_address)
    model  = db.query(AIModel).filter(AIModel.key == key, AIModel.owner_wallet == wallet).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found or not owned by this wallet")

    if body.description  is not None: model.description  = body.description
    if body.price_sol    is not None: model.price_sol    = body.price_sol
    if body.accuracy     is not None: model.accuracy     = body.accuracy
    if body.endpoint_url is not None: model.endpoint_url = body.endpoint_url
    if body.is_active    is not None: model.is_active    = body.is_active
    db.commit()
    return {"message": f"Model '{key}' updated.", "model_key": key}


@router.delete("/model/{key}", summary="Deactivate a model (owner only)")
async def deactivate_model(
    key: str,
    x_wallet_address: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    wallet = _require_wallet(x_wallet_address)
    model  = db.query(AIModel).filter(AIModel.key == key, AIModel.owner_wallet == wallet).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found or not owned by this wallet")
    model.is_active = False
    db.commit()
    return {"message": f"Model '{key}' deactivated."}


@router.get("/program-info", summary="On-chain program deployment status")
async def get_program_info_endpoint():
    """
    Returns whether the NeuralSOL Solana program is deployed,
    the program ID, and a Solana Explorer link.
    Used by the Admin Panel Stats tab.
    """
    from app.services.solana import get_program_info
    from app.core.config import settings
    info = await get_program_info()
    return {
        **info,
        "program_id":     settings.PROGRAM_ID,
        "framework":      "Anchor v0.30.1",
        "language":       "Rust",
        "instructions":   [
            "initialize_platform",
            "register_model",
            "pay_inference",
            "withdraw_earnings",
            "deactivate_model",
            "update_platform_fee",
        ],
        "revenue_split":  "95% creator / 5% platform",
        "source":         "contracts/neuralsol/programs/neuralsol/src/lib.rs",
    }
