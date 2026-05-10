# NEURAL — AI × Solana Marketplace

> **Production-grade AI infrastructure platform powered by autonomous AI systems and Solana micropayments.**

---

## 🎥 Live Demo & Presentation
- **Live Demo Link:** [Insert Vercel/Netlify URL here]
- **Demo Video (Under 3 mins):** [Insert YouTube/Loom Link here]

---

## 🔗 Solana Program (On-Chain Contract)

| Network    | Program ID                                    | Explorer                                                                                                       |
|------------|-----------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| **Devnet** | `FcpyF36Lcve7QwvejkB62RiBA2NReYxQE2rp3VoDHUQW`| [View on Explorer](https://explorer.solana.com/address/FcpyF36Lcve7QwvejkB62RiBA2NReYxQE2rp3VoDHUQW?cluster=devnet) |

### Contract Details

| Property     | Value                                                          |
|--------------|----------------------------------------------------------------|
| **Language** | Rust                                                           |
| **Framework**| [Anchor](https://anchor-lang.com) v0.30.1                      |
| **Source**   | `solana_contract_reference/lib.rs`            |
| **Network**  | Solana Devnet                                                  |

### Program Instructions

| Instruction              | Signer        | Description                                                              |
|--------------------------|---------------|--------------------------------------------------------------------------|
| `initialize_platform`    | Admin         | One-time setup — creates platform config PDA with fee % and admin wallet |
| `register_model`         | Creator       | Lists an AI model on-chain with key, name, price (lamports)              |
| `pay_inference`          | User          | Pays for inference — auto-splits **95% → creator vault, 5% → platform** |
| `withdraw_earnings`      | Creator       | Creator withdraws accumulated SOL from their vault PDA                   |
| `deactivate_model`       | Creator/Admin | Marks a model inactive — blocks future payments                          |
| `update_platform_fee`    | Admin         | Adjusts platform fee in basis points (e.g. 500 = 5%)                    |

### On-Chain Accounts (PDAs)

```
PlatformConfig  seeds=["platform_config"]           → admin, fee_bps, total_volume, total_inferences
ModelAccount    seeds=["model", model_key]           → creator, price, total_uses, total_earned
CreatorVault    seeds=["vault", creator_pubkey]      → SOL accumulator for creator earnings
```

---

## 🚀 Features

### Core Platform
- **AI Model Marketplace** — Browse, filter, and pay-per-use 9+ production AI models
- **Smart Router** — Multi-criteria model selection (accuracy, speed, cost, keywords)
- **Multi-Agent Orchestration** — 4 parallel AI agents synthesize answers
- **Workflow Builder** — Node-based pipeline editor with topological execution
- **AI Battle Arena** — Run 3 models head-to-head on the same task

### Creator Economy
- **Deploy Models** — Any wallet can submit an AI model for review
- **Admin Governance** — Admin approves/rejects models before marketplace listing
- **On-Chain Revenue** — Smart contract automatically splits payments (95/5)
- **Creator Dashboard** — Real earnings, model stats, usage charts

### Infrastructure
- **Rate Limiting** — 60 req/min via `slowapi`
- **GZip Compression** — Payloads ≥512 bytes compressed automatically
- **Devnet Integration** — Phantom wallet, real SOL transfers, on-chain verification
- **WebSocket Streaming** — Real-time workflow execution progress

---

## 📁 Project Structure

```
Web3 Project/
├── solana_contract_reference/    ← Solana Rust program
│   └── lib.rs                    ← Smart contract source
│
├── backend/                      ← FastAPI Python backend
│   ├── app/
│   │   ├── api/                  ← Route handlers (9 modules)
│   │   ├── services/             ← Business logic (AI router, Solana, agents)
│   │   ├── db/                   ← SQLAlchemy models + seeding
│   │   └── core/config.py        ← Settings (reads .env)
│   └── requirements.txt
│
├── frontend/                     ← Next.js 16 frontend
│   ├── src/
│   │   ├── app/page.tsx          ← Root layout + routing
│   │   ├── components/pages/     ← 12 full page components
│   │   ├── lib/
│   │   │   ├── api.ts            ← Typed API client
│   │   │   ├── program.ts        ← Solana program SDK
│   │   │   └── constants.ts      ← Design tokens + model data
│   │   └── components/wallet/    ← Phantom wallet + PaymentModal
│   └── package.json
│
├── docker-compose.yml            ← One-command dev environment
└── README.md
```

---

## 🛠️ Local Development

### Prerequisites

| Tool             | Version    | Install                                             |
|------------------|------------|-----------------------------------------------------|
| Node.js          | ≥18        | https://nodejs.org                                  |
| Python           | ≥3.11      | https://python.org                                  |
| Rust             | stable     | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Solana CLI       | ≥1.18      | https://docs.solana.com/cli/install-solana-cli-tools |
| Anchor CLI       | 0.30.1     | `cargo install --git https://github.com/coral-xyz/anchor avm --locked && avm install latest` |

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API runs at: http://localhost:8000  
Docs at: http://localhost:8000/docs

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at: http://localhost:3000

### 3. Configure Environment

**`backend/.env`**
```env
SOLANA_RPC=https://api.devnet.solana.com
PLATFORM_WALLET=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
PROGRAM_ID=<YOUR_DEPLOYED_PROGRAM_ID>
SECRET_KEY=your-secret-key-here
ENVIRONMENT=development
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_PROGRAM_ID=<YOUR_DEPLOYED_PROGRAM_ID>
NEXT_PUBLIC_PLATFORM_WALLET=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

---

## 📦 Deployment

#   - frontend/.env.local   → NEXT_PUBLIC_PROGRAM_ID=<YOUR_PROGRAM_ID>
#   - README.md             → Update the table at the top
```

### Initialize the Platform On-Chain (first time only)

After deployment, call `initialize_platform` once to set up the PDA:

```typescript
// Run from contracts/neural/
// Edit tests/neural.ts — or call via frontend Admin Panel
anchor run initialize --provider.cluster devnet
```

---

## 🔐 Security

| Layer         | Implementation                                                              |
|---------------|-----------------------------------------------------------------------------|
| **Auth**      | Wallet address headers (`X-Wallet-Address`) — JWT-ready architecture        |
| **Admin**     | `ADMIN_OVERRIDE` key gating (replace with JWT in production)                |
| **Payments**  | On-chain verification via Solana RPC + program instruction check             |
| **Rate limit**| 60 req/min per IP via `slowapi`                                             |
| **CORS**      | Configurable origins via env var                                            |

---

## 🏗️ Architecture

```
User Browser (Next.js 16)
    │
    ├── Phantom Wallet ──► Solana Devnet ──► NEURAL Program (Rust/Anchor)
    │                                              │
    │                                         pay_inference()
    │                                         95% → creator vault PDA
    │                                         5%  → platform wallet
    │
    └── HTTP/WS ──► FastAPI Backend (Python)
                         │
                    ┌────┴────┐
                    │  SQLite │  (dev) / PostgreSQL (prod)
                    └─────────┘
                    AI Router ─► MODEL_REGISTRY (9 models)
                    Multi-Agent ─► 4 parallel agents
                    Workflows ─► Topological execution engine
```

---

## 📊 API Reference

| Method | Endpoint                          | Description                          |
|--------|-----------------------------------|--------------------------------------|
| GET    | `/`                               | Health + feature list                |
| GET    | `/api/models`                     | List all marketplace models          |
| POST   | `/api/model/{key}`                | Run inference on a model             |
| POST   | `/api/agent/orchestrate`          | Multi-agent task execution           |
| POST   | `/api/router/analyze`             | Smart model recommendation           |
| POST   | `/api/router/battle`              | Model vs model comparison            |
| POST   | `/api/workflows/execute`          | Execute a node pipeline              |
| POST   | `/api/deploy/model`               | Submit a model for review            |
| GET    | `/api/deploy/marketplace`         | List all approved creator models     |
| POST   | `/api/deploy/approve/{key}`       | Admin: approve a pending model       |
| GET    | `/api/deploy/program-info`        | On-chain program deployment status   |
| GET    | `/api/dashboard`                  | Creator earnings + model stats       |
| GET    | `/docs`                           | Interactive Swagger UI               |

---

## 🧪 Running Tests

### Backend
```bash
cd backend
pip install pytest httpx
pytest
```

### Frontend (TypeScript)
```bash
cd frontend
npx tsc --noEmit    # 0 errors expected
```



---

## 📜 License

MIT © 2026 NeuralSOL Team
