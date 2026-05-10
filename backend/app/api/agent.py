"""
api/agent.py — Neural.AI Smart Assistant
Provides a completely custom, offline keyword-matching AI assistant tailored exactly to the Neural.AI Solana platform. No OpenAI API keys required!
"""
import re
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/agent", tags=["Agent"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]

# The Knowledge Base of the Smart Assistant
KNOWLEDGE_BASE = [
    {
        "keywords": ["deploy", "publish", "create", "upload model"],
        "answer": "To deploy a custom AI model, please navigate to the Deploy Model section. There, you can specify your model's parameters and category. A standard network fee of 0.02 SOL is required via your connected Solana wallet to finalize the deployment to the blockchain.",
        "action": "deploy",
        "action_label": "Go to Deploy Model"
    },
    {
        "keywords": ["wallet", "phantom", "connect", "solana wallet", "web3"],
        "answer": "Neural.AI leverages the Solana network for high-speed, low-cost transactions. You will need a compatible Web3 wallet, such as Phantom, to interact with our smart contracts. Please use the 'Connect Wallet' button located in the top navigation bar to authenticate your session.",
        "action": None
    },
    {
        "keywords": ["earn", "money", "profit", "monetize", "get paid", "revenue"],
        "answer": "Our platform empowers creators to monetize their intellectual property. By deploying AI models or providing high-quality datasets, you can set a custom Access Price. Each time a user utilizes your asset, the specified SOL amount is autonomously routed directly to your wallet via our smart contract.",
        "action": None
    },
    {
        "keywords": ["dataset", "data", "csv", "json", "train"],
        "answer": "You can explore community-provided data or upload your own structured files (CSV/JSON) in the Datasets section. Publishing a new dataset requires a nominal listing fee of 0.01 SOL, after which you may set a custom price for users wishing to download your data.",
        "action": "datasets",
        "action_label": "Browse Datasets"
    },
    {
        "keywords": ["fee", "cost", "price", "expensive", "sol", "inference", "pay-per-inference", "pay"],
        "answer": "Our protocol maintains minimal overhead fees: Model Deployment requires 0.02 SOL, and Dataset Publishing requires 0.01 SOL. Inference pricing is determined entirely by the individual asset creators. Notably, 100% of all inference and download fees are transferred directly to the creator.",
        "action": None
    },
    {
        "keywords": ["agent", "ai agent", "eliza", "framework"],
        "answer": "The AI Agent framework enables you to interact with autonomous AI agents operating on the edge network. Currently, you can configure agent parameters and deploy them for specialized tasks such as portfolio management or automated moderation.",
        "action": "agent",
        "action_label": "View AI Agents"
    },
    {
        "keywords": ["who are you", "what are you", "your name", "creator", "who made you"],
        "answer": "I am the Neural.AI Smart Assistant, a dedicated intelligence protocol built natively into this platform. My purpose is to assist you in navigating our Web3 ecosystem, deploying AI models, and optimizing your earnings.",
        "action": None
    },
    {
        "keywords": ["hello", "hi", "hey", "greetings", "sup"],
        "answer": "Greetings. Welcome to the Neural.AI platform. I am your intelligent assistant. Please let me know if you require guidance on deploying models, browsing datasets, or understanding our smart contract integrations.",
        "action": None
    },
    {
        "keywords": ["smart contract", "neural.ai contract", "explain the neural.ai smart contract", "blockchain logic", "escrow"],
        "answer": "The Neural.AI protocol operates via a sophisticated Solana smart contract. It handles secure escrow of model access, automates 95/5 fee splits between creators and the platform, and verifies on-chain signatures to grant instant access to model weights and SDKs.",
        "action": None
    },
    {
        "keywords": ["available models", "what models", "what models are available", "model list", "market", "marketplace", "browse", "find models"],
        "answer": "We currently host 9+ production-ready AI models including BTC Price Predictors, Sentiment Analyzers, and Risk Scoring agents. You can browse the full collection in the Marketplace, where you can filter by category and view accuracy metrics before purchasing access.",
        "action": "marketplace",
        "action_label": "Explore Marketplace"
    },
    {
        "keywords": ["pay-per-inference", "how does pay-per-inference work", "fee", "cost", "price"],
        "answer": "Neural.AI uses a transparent pay-per-inference model. Instead of monthly subscriptions, you pay a small SOL fee (set by the creator) for each specific API call. This fee is settled instantly on the Solana blockchain, with 95% going directly to the model creator's wallet.",
        "action": None
    }
]

DEFAULT_ANSWER = "I apologize, but I did not fully understand your request. Could you please rephrase or specify if you need assistance with Model Deployment, the Marketplace, Datasets, or Wallet integration?"
DEFAULT_ACTION = None
DEFAULT_LABEL = None

def generate_smart_reply(user_message: str):
    """Matches the user's message against the knowledge base."""
    user_text = user_message.lower()
    
    # Sort knowledge base by the number of keywords matched to find the most relevant answer
    best_match = None
    best_action = None
    best_label = None
    max_matches = 0
    
    for entry in KNOWLEDGE_BASE:
        matches = sum(1 for kw in entry["keywords"] if re.search(r'\b' + re.escape(kw) + r'\b', user_text) or kw in user_text)
        if matches > max_matches:
            max_matches = matches
            best_match = entry["answer"]
            best_action = entry.get("action")
            best_label = entry.get("action_label")
            
    if best_match:
        return {"reply": best_match, "action": best_action, "action_label": best_label}
        
    return {"reply": DEFAULT_ANSWER, "action": DEFAULT_ACTION, "action_label": DEFAULT_LABEL}

@router.post("/chat", summary="Chat with the Custom Neural.AI Assistant")
async def chat_with_agent(req: ChatRequest):
    # Get the last message from the user
    user_msg = next((msg.content for msg in reversed(req.messages) if msg.role == "user"), "")
    
    if not user_msg:
        return {"reply": "How may I assist you today?", "action": None, "action_label": None}
        
    # Generate reply using our offline NLP keyword matcher
    response_data = generate_smart_reply(user_msg)
    
    return response_data
