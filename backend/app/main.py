"""
main.py — FastAPI application entry point (v3.0)
Registers all routes: models, predict, agent, datasets, competition, dashboard, router, deploy, workflows
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    _SLOWAPI = True
except ImportError:
    _SLOWAPI = False

from app.core.config import settings
from app.db.database import engine, SessionLocal
from app.db import models as db_models
from app.api import models, agent, deploy


# ─── Startup / Shutdown ────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all DB tables
    db_models.Base.metadata.create_all(bind=engine)

    # Seed initial data
    db = SessionLocal()
    try:
        from app.services.model_seeder import seed_marketplace_models
        seed_marketplace_models(db)
    finally:
        db.close()

    print("[Success] NEURAL Backend v3.0 started")
    print(f"   Environment : {settings.ENVIRONMENT}")
    print(f"   Solana RPC  : {settings.SOLANA_RPC}")
    print(f"   Platform    : {settings.PLATFORM_WALLET[:12]}...")
    print("   Routes      : /models, /deploy, /agent")
    yield
    print("[Shutdown] NEURAL Backend shutting down")


# ─── Rate Limiter (60 req/min per IP) ─────────────────────────────────────────
if _SLOWAPI:
    limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

# ─── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="NEURAL — AI × Solana Marketplace",
    description=(
        "Production-grade AI inference API powered by Solana micropayments.\n"
        "Features: Marketplace, Creator Deploy, Datasets, and ChatGPT Assistant."
    ),
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

if _SLOWAPI:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=512)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ─── Routes ────────────────────────────────────────────────────────────────────
API_PREFIX = "/api"
app.include_router(models.router,                    prefix=API_PREFIX)
app.include_router(agent.router,                     prefix=API_PREFIX)
app.include_router(deploy.router,                    prefix=API_PREFIX)


# ─── Health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "service":  "NEURAL Backend",
        "version":  "3.0.0",
        "status":   "running",
        "network":  "solana-devnet",
        "features": [
            "smart_router",
            "multi_agent",
            "creator_deploy",
        ],
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "environment": settings.ENVIRONMENT, "version": "3.0.0"}
