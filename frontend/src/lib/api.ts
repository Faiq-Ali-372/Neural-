/**
 * api.ts — Typed API client for the NEURAL FastAPI backend (v3.0).
 * All paid endpoints send X-Solana-Signature + X-Wallet-Address headers.
 * A 402 response triggers the PaymentModal flow.
 */
import { API_BASE } from './constants';

// ─── Shared types ─────────────────────────────────────────────────────────────
export interface InferenceResult   { prediction: string; confidence: number; }
export interface InferenceResponse { result: InferenceResult; model: string; cost_sol: number; signature: string; tx_verified: boolean; }

export interface AgentResponse {
  answer:     string;
  steps:      string[];
  model_used: string;
  cost_sol:   number;
  confidence: number;
}

export interface BackendModel {
  key: string; name: string; category: string; price_sol: number;
  accuracy: number; keywords: string[];
}

export interface DeployedModel {
  model_key:     string; name: string; description: string; category: string;
  price_sol:     number; accuracy: number; is_active: boolean; is_approved: boolean;
  total_uses:    number; total_revenue: number; created_at: string;
}

export interface PaymentRequiredError {
  status: 402; platform_wallet: string; amount_sol: number;
  amount_lamports: number; service: string;
}

// ─── Core fetch helper ────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  opts: RequestInit & { sig?: string; wallet?: string } = {}
): Promise<T> {
  const { sig, wallet, ...rest } = opts;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  if (sig)    headers['X-Solana-Signature'] = sig;
  if (wallet) headers['X-Wallet-Address']   = wallet;
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  if (res.status === 402) throw { status: 402, ...(await res.json()) } as PaymentRequiredError;
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ─── Inference ────────────────────────────────────────────────────────────────
export const fetchModels     = () => apiFetch<BackendModel[]>('/models');

export const runModel = (key: string, input: Record<string, unknown>, sig: string, wallet: string) =>
  apiFetch<InferenceResponse>(`/model/${key}`, {
    method: 'POST', body: JSON.stringify({ input }), sig, wallet,
  });

export const runAgent = (task: string, sig: string, wallet: string) =>
  apiFetch<AgentResponse>('/agent/run', {
    method: 'POST', body: JSON.stringify({ task }), sig, wallet,
  });

// ─── Deploy ───────────────────────────────────────────────────────────────────
export const deployModel = (
  payload: {
    name: string; description: string; category: string;
    price_sol: number; accuracy: number; endpoint_url?: string;
  },
  wallet: string,
) =>
  apiFetch<{ model_key: string; name: string; message: string }>('/deploy/model', {
    method: 'POST', body: JSON.stringify(payload), wallet,
  });

export const fetchMyModels = (wallet: string) =>
  apiFetch<DeployedModel[]>('/deploy/models', { wallet });
