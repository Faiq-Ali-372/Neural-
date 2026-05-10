"""
schemas/ — Pydantic request/response models
"""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel


# ─── Inference ──────────────────────────────────────────────────────────────
class InferenceRequest(BaseModel):
    input: dict[str, Any]

class InferenceResult(BaseModel):
    prediction: str
    confidence: float
    detail: Optional[dict] = None

class InferenceResponse(BaseModel):
    result: InferenceResult
    model: str
    cost_sol: float
    signature: str
    tx_verified: bool


# ─── Agent ──────────────────────────────────────────────────────────────────
class AgentRequest(BaseModel):
    task: str

class AgentResponse(BaseModel):
    answer: str
    steps: list[str]
    model_used: str
    cost_sol: float
    confidence: float


# ─── Router ─────────────────────────────────────────────────────────────────
class RouterRequest(BaseModel):
    task: str
    payload: Optional[dict[str, Any]] = None

class RouterResponse(BaseModel):
    result: InferenceResult
    model: str
    cost_sol: float


# ─── Dataset ────────────────────────────────────────────────────────────────
class DatasetRow(BaseModel):
    id: int
    name: str
    description: str
    category: str
    price_sol: float
    row_count: str
    size_label: str
    downloads: int
    owner_wallet: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Competition ─────────────────────────────────────────────────────────────
class CompetitionOut(BaseModel):
    id: int
    title: str
    description: str
    prize_sol: float
    metric: str
    dataset_name: str
    is_active: bool
    ends_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SubmitRequest(BaseModel):
    competition_id: int
    model_name: str

class SubmitResponse(BaseModel):
    score: float
    rank: int
    competition_id: int
    model_name: str

