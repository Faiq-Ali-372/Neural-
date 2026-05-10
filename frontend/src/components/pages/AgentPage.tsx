'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '@/lib/constants';

interface Props {
  addLog: (m: string, t?: any) => void;
  onNavigate?: (p: string) => void;
}

interface Message {
  role: 'user' | 'agent';
  content: string;
  action?: string;
  action_label?: string;
}

const SUGGESTIONS = [
  'Explain the Neural.AI smart contract',
  'How does pay-per-inference work?',
  'What models are available?',
  'How do I deploy a model?',
];

// Fallback Knowledge Base for Hackathon Stability
const KNOWLEDGE_BASE = [
  {
    keywords: ["deploy", "publish", "create", "upload model"],
    answer: "To deploy a custom AI model, please navigate to the Deploy Model section. There, you can specify your model's parameters and category. A standard network fee of 0.02 SOL is required via your connected Solana wallet to finalize the deployment to the blockchain.",
    action: "deploy",
    action_label: "Go to Deploy Model"
  },
  {
    keywords: ["smart contract", "neural.ai contract", "explain the neural.ai smart contract", "blockchain logic", "escrow"],
    answer: "The Neural.AI protocol operates via a sophisticated Solana smart contract. It handles secure escrow of model access, automates 95/5 fee splits between creators and the platform, and verifies on-chain signatures to grant instant access to model weights and SDKs.",
  },
  {
    keywords: ["available models", "what models", "what models are available", "model list", "market", "marketplace", "browse", "find models"],
    answer: "We currently host 9+ production-ready AI models including BTC Price Predictors, Sentiment Analyzers, and Risk Scoring agents. You can browse the full collection in the Marketplace, where you can filter by category and view accuracy metrics before purchasing access.",
    action: "marketplace",
    action_label: "Explore Marketplace"
  },
  {
    keywords: ["pay-per-inference", "how does pay-per-inference work", "fee", "cost", "price", "sol", "inference", "pay"],
    answer: "Neural.AI uses a transparent pay-per-inference model. Instead of monthly subscriptions, you pay a small SOL fee (set by the creator) for each specific API call. This fee is settled instantly on the Solana blockchain, with 95% going directly to the model creator's wallet.",
  },
  {
    keywords: ["wallet", "phantom", "connect", "solana wallet", "web3"],
    answer: "Neural.AI leverages the Solana network for high-speed, low-cost transactions. You will need a compatible Web3 wallet, such as Phantom, to interact with our smart contracts. Please use the 'Connect Wallet' button located in the top navigation bar to authenticate your session.",
  },
  {
    keywords: ["dataset", "data", "csv", "json", "train"],
    answer: "You can explore community-provided data or upload your own structured files (CSV/JSON) in the Datasets section. Publishing a new dataset requires a nominal listing fee of 0.01 SOL, after which you may set a custom price for users wishing to download your data.",
    action: "datasets",
    action_label: "Browse Datasets"
  },
];

export default function AgentPage({ addLog, onNavigate }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'agent', content: 'Hello. I\'m Neural.AI — your autonomous agent on Solana. Ask me about models, smart contracts, deployment, or anything about the platform.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, displayedText, loading]);

  const simulateStreaming = (text: string) => {
    setIsStreaming(true);
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 12);
  };

  const getFallbackReply = (text: string) => {
    const userText = text.toLowerCase();
    let bestMatch: any = null;
    let maxMatches = 0;

    for (const entry of KNOWLEDGE_BASE) {
      const matches = entry.keywords.filter(kw => userText.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = entry;
      }
    }

    if (bestMatch) return { reply: bestMatch.answer, action: bestMatch.action, action_label: bestMatch.action_label };
    return {
      reply: "I apologize, I'm having trouble connecting to my neural core. Please make sure the backend is running, or ask me about deployment, models, or fees.",
    };
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!res.ok) throw new Error('API down');
      const data = await res.json();

      setMessages(prev => [...prev, { role: 'agent', content: data.reply, action: data.action, action_label: data.action_label }]);
      simulateStreaming(data.reply);
      addLog('Agent response received', 'success');
    } catch (err: any) {
      const fallback = getFallbackReply(msg);
      setMessages(prev => [...prev, { role: 'agent', content: fallback.reply, action: fallback.action, action_label: fallback.action_label }]);
      simulateStreaming(fallback.reply);
      addLog('Backend offline — using smart fallback', 'warn');
    } finally {
      setLoading(false);
    }
  };

  const lastAgentIdx = messages.length - 1;
  const isLastAgent = messages[lastAgentIdx]?.role === 'agent';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 112px)',
      maxWidth: 900,
      margin: '0 auto',
      position: 'relative',
    }}>
      {/* Background Decor */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Header with Pulse Sphere */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        padding: '32px 0',
        marginBottom: 20,
        zIndex: 1
      }}>
        <div style={{ position: 'relative' }}>
          {/* Outer glow */}
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: -12, left: -12, right: -12, bottom: -12,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(129,140,248,0.5) 0%, transparent 70%)',
              filter: 'blur(10px)',
              zIndex: 0
            }}
          />
          {/* Outer rotating orbit */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: -8, left: -8, right: -8, bottom: -8,
              borderRadius: '50%',
              border: '1px solid rgba(129,140,248,0.12)',
              borderTopColor: 'rgba(129,140,248,0.5)',
              borderRightColor: 'rgba(52,211,153,0.3)',
              zIndex: 0
            }}
          />
          {/* The Core — N Logo */}
          <div style={{
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="agentLogoGrad" x1="5" y1="4" x2="19" y2="20">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <motion.path 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
                d="M5 20V4L19 20V4" 
                stroke="url(#agentLogoGrad)" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.6))' }}
              />
              <motion.circle 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: 'backOut' }}
                cx="5" cy="4" r="2.5" fill="#818cf8"
                style={{ filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.9))' }}
              />
              <motion.circle 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6, ease: 'backOut' }}
                cx="19" cy="4" r="1.5" fill="#34d399"
                style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.7))' }}
              />
            </svg>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f5f5f5', letterSpacing: '-0.02em' }}>
            Neural<span style={{ color: '#818cf8' }}>.AI</span> Assistant
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Cognitive Link Active
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          zIndex: 1
        }}
        className="custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}
            >
              <div style={{
                padding: '18px 24px',
                borderRadius: m.role === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                background: m.role === 'user' ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
                border: m.role === 'user' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)',
                color: m.role === 'user' ? '#f1f5f9' : '#cbd5e1',
                fontSize: 14.5,
                lineHeight: 1.6,
                boxShadow: m.role === 'user' ? '0 8px 32px rgba(99,102,241,0.05)' : 'none',
                position: 'relative'
              }}>
                {(idx === lastAgentIdx && isLastAgent && isStreaming) ? displayedText : m.content}
                
                {m.action && !isStreaming && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: 20 }}
                  >
                    <button
                      onClick={() => onNavigate?.(m.action!)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                        color: 'white',
                        fontSize: 12.5,
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
                      }}
                    >
                      {m.action_label || 'Execute Command'}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '12px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: '#818cf8' }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input / Suggestions Area */}
      <div style={{ 
        padding: '32px 20px',
        background: 'rgba(5,5,10,0.4)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '24px 24px 0 0',
        zIndex: 10
      }}>
        {messages.length === 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
            {SUGGESTIONS.map(s => (
              <motion.button
                key={s}
                whileHover={{ y: -2, scale: 1.02, background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSend(s)}
                style={{
                  padding: '12px 20px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#94a3b8',
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {s}
              </motion.button>
            ))}
          </div>
        )}

        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Query the Neural Network..."
            style={{
              width: '100%',
              padding: '20px 80px 20px 28px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f5f5f5',
              fontSize: 15,
              outline: 'none',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
              fontFamily: 'var(--font)'
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '10px 20px',
              borderRadius: 12,
              background: input.trim() ? 'linear-gradient(135deg, #818cf8, #6366f1)' : 'rgba(255,255,255,0.05)',
              color: input.trim() ? 'white' : '#64748B',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: input.trim() ? 'pointer' : 'default',
              transition: 'all 0.3s'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
