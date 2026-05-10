# NeuralSOL — AI × Solana Marketplace

> Pay-per-use AI inference marketplace powered by Solana Devnet

---

## Quick Start (Run Everything)

You need **2 terminals** open — one for the backend, one for the frontend.

---

## Terminal 1 — Backend (FastAPI)

```powershell
cd "d:\Bs-AI\BS AI (6th Semester)\Web3 Project\backend"
$env:PYTHONIOENCODING = "utf-8"
D:\Python\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
[OK] NeuralSOL Backend started
   Environment : development
   Solana RPC  : https://api.devnet.solana.com
```

Backend URLs:
- **API Root** → http://localhost:8000
- **Swagger Docs** → http://localhost:8000/docs
- **Health Check** → http://localhost:8000/health

---

## Terminal 2 — Frontend (Next.js)

```powershell
cd "d:\Bs-AI\BS AI (6th Semester)\Web3 Project\frontend"
$env:PATH = "D:\node js;" + $env:PATH
npm run dev
```

**Expected output:**
```
▲ Next.js 16.2.5 (Turbopack)
- Local: http://localhost:3000
✓ Ready in 665ms
```

Open → **http://localhost:3000**

---

## How They Connect

```
Browser (localhost:3000)
    │
    │  User clicks "Run Inference" or "Join Competition"
    ▼
PaymentModal (frontend)
    │  Phantom wallet signs a SOL transfer
    │  Gets transaction signature
    ▼
FastAPI Backend (localhost:8000)
    │  Receives request with X-Solana-Signature header
    │  Verifies signature on Solana Devnet RPC
    │  Runs AI model inference / processes request
    ▼
Returns result → Frontend displays it
```

The `.env.local` in the frontend already points to the backend:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Testing Without Phantom Wallet

All payment verification accepts signatures starting with `demo_sig_`.

The frontend **automatically** generates these when no wallet is connected,
so you can test every feature without installing Phantom:

1. Open http://localhost:3000
2. Click any **"Use →"** or **"Join Competition"** button
3. The Payment Modal opens — click **"Confirm"**
4. A demo signature is generated and accepted by the backend
5. The AI result appears ✅

---

## Testing With Phantom Wallet (Real Devnet)

1. Install the [Phantom browser extension](https://phantom.app)
2. Create a wallet and switch to **Devnet** network:
   - Phantom → Settings → Developer Settings → Testnet Mode ON
3. Get free devnet SOL from the faucet:
   ```
   https://faucet.solana.com
   ```
   Paste your wallet address and request 2 SOL
4. Open http://localhost:3000 → click **"Connect Wallet"**
5. Approve the connection in Phantom
6. Your balance appears in the topbar and sidebar
7. Run any inference — Phantom will prompt you to sign a real transaction

---

## API Endpoints Reference

### Public (no payment)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | Service info |
| GET | `/health` | Health check |
| GET | `/api/models` | List all 9 AI models |
| GET | `/api/datasets` | List all datasets |
| GET | `/api/competition` | List all competitions |
| GET | `/api/dataset/sol_metrics` | Free dataset (no payment) |
| GET | `/docs` | Swagger interactive docs |

### Payment-Gated (require X-Solana-Signature header)
| Method | URL | Cost | Description |
|--------|-----|------|-------------|
| POST | `/api/model/btc_price_predictor` | 0.001 SOL | BTC price inference |
| POST | `/api/model/sentiment_analyzer` | 0.0005 SOL | Sentiment analysis |
| POST | `/api/model/anomaly_detector` | 0.002 SOL | Anomaly detection |
| POST | `/api/predict` | varies | Smart AI Router |
| POST | `/api/agent/run` | 0.001 SOL | Autonomous agent |
| GET | `/api/dataset/crypto_sentiment` | 0.05 SOL | Paid dataset access |
| POST | `/api/competition/submit` | 0.05 SOL | Competition entry |

### Testing payment endpoints via curl (demo mode):
```powershell
# Run inference with demo signature (no real SOL needed)
curl -X POST http://localhost:8000/api/model/btc_price_predictor `
  -H "Content-Type: application/json" `
  -H "X-Solana-Signature: demo_sig_test123" `
  -H "X-Wallet-Address: demo_wallet" `
  -d '{"input": {"query": "predict BTC price"}}'

# Run the AI agent
curl -X POST http://localhost:8000/api/agent/run `
  -H "Content-Type: application/json" `
  -H "X-Solana-Signature: demo_sig_test456" `
  -d '{"task": "Predict BTC price for next 24 hours"}'

# Smart router
curl -X POST http://localhost:8000/api/predict `
  -H "Content-Type: application/json" `
  -H "X-Solana-Signature: demo_sig_test789" `
  -d '{"task": "analyze DeFi protocol risk"}'
```

---

## Project Structure

```
Web3 Project/
├── frontend/                    ← Next.js 16 + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       ← Root layout + Solana providers
│   │   │   ├── page.tsx         ← App shell + SPA routing
│   │   │   └── globals.css      ← Design system (Space Grotesk/Syne fonts)
│   │   ├── components/
│   │   │   ├── ui/              ← Sidebar, Topbar, Hero, RightPanel
│   │   │   ├── marketplace/     ← ModelCard, DatasetCard
│   │   │   ├── competitions/    ← Leaderboard
│   │   │   ├── wallet/          ← WalletButton, PaymentModal
│   │   │   └── pages/           ← HomePage, WorkspacePage, AgentPage...
│   │   ├── context/
│   │   │   └── WalletContext.tsx ← Phantom + Devnet provider
│   │   └── lib/
│   │       ├── constants.ts     ← All design tokens + mock data
│   │       ├── solana.ts        ← Balance, price, payment helpers
│   │       └── api.ts           ← Typed backend API client
│   └── .env.local               ← NEXT_PUBLIC_API_URL=http://localhost:8000/api
│
└── backend/                     ← FastAPI + SQLite + Solana RPC
    ├── app/
    │   ├── main.py              ← App entry, CORS, routes, DB seed
    │   ├── core/config.py       ← Settings from .env
    │   ├── db/
    │   │   ├── database.py      ← SQLAlchemy session
    │   │   └── models.py        ← ORM tables
    │   ├── schemas/schemas.py   ← Pydantic models
    │   ├── services/
    │   │   ├── ai_router.py     ← 9-model registry + smart routing
    │   │   ├── agent.py         ← Autonomous agent logic
    │   │   ├── solana.py        ← On-chain tx verification
    │   │   ├── datasets.py      ← Dataset service + seed
    │   │   └── competition.py   ← Competition service + scoring
    │   └── api/
    │       ├── models.py        ← /api/model/* routes
    │       ├── predict.py       ← /api/predict route
    │       ├── agent.py         ← /api/agent/run route
    │       ├── datasets.py      ← /api/dataset/* routes
    │       ├── competition.py   ← /api/competition/* routes
    │       └── payments.py      ← 402 payment gate helper
    ├── .env                     ← DB URL, Solana RPC, platform wallet
    └── requirements.txt         ← Python dependencies
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `npx not found` | Run `$env:PATH = "D:\node js;" + $env:PATH` first |
| Backend emoji error | Add `$env:PYTHONIOENCODING = "utf-8"` |
| Phantom not connecting | Make sure it's on Devnet, not Mainnet |
| CORS error in browser | Make sure backend is running on port 8000 |
| Database error | Delete `backend/neuralsol.db` and restart backend |
