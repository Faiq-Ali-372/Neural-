'use client';

/**
 * solana.ts
 * Helper functions for Solana devnet interactions:
 *  - fetchBalance: fetches SOL balance for any public key
 *  - sendSolPayment: builds and sends a SOL transfer via Phantom
 *  - fetchSolPrice: fetches current SOL/USD price from CoinGecko
 *  - fetchBlockHeight: fetches current devnet block height
 */

import { SOLANA_RPC, PLATFORM_WALLET } from './constants';

/** Shorten a wallet address: first 4 + last 4 chars */
export function truncAddr(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 4)}\u2026${address.slice(-4)}`;
}

/**
 * Wraps Solana RPC fetch with a 5s AbortController timeout.
 * Prevents balance/blockhash requests from hanging on a throttled public RPC.
 */
async function fetchRPC(body: object, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(tid);
  }
}

/** Fetch SOL balance (in SOL, not lamports) for a given address */
export async function fetchBalance(walletAddress: string): Promise<string> {
  try {
    const res = await fetchRPC({
      jsonrpc: '2.0', id: 1, method: 'getBalance', params: [walletAddress],
    });
    const data = await res.json();
    if (data.result?.value !== undefined) {
      return (data.result.value / 1e9).toFixed(4);
    }
    return '0.0000';
  } catch {
    return '0.0000';
  }
}

/** Fetch current Solana devnet block height */
export async function fetchBlockHeight(): Promise<string> {
  try {
    const res = await fetchRPC({ jsonrpc: '2.0', id: 1, method: 'getBlockHeight', params: [] });
    const data = await res.json();
    return data.result ? data.result.toLocaleString() : '\u2014';
  } catch {
    return '\u2014';
  }
}

/** Fetch SOL price in USD from CoinGecko */
export async function fetchSolPrice(): Promise<string> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    );
    const data = await res.json();
    return `$${data.solana.usd.toFixed(2)}`;
  } catch {
    return '$~155';
  }
}

/**
 * Send SOL to the platform wallet via Phantom.
 * Returns the confirmed transaction signature string.
 * THROWS on any failure — no demo fallbacks.
 */
export async function sendSolPayment(
  amountSol: number,
  walletPublicKey: string,
  signTransaction: (tx: unknown) => Promise<unknown>
): Promise<string> {
  if (!walletPublicKey || walletPublicKey === 'demo') {
    throw new Error('Wallet not connected. Please connect Phantom first.');
  }

  const lamports = Math.round(amountSol * 1e9);

  // Get latest blockhash
  const bhRes = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getLatestBlockhash', params: [] }),
  });
  const bhData = await bhRes.json();
  if (!bhData.result?.value?.blockhash) {
    throw new Error('Failed to fetch blockhash from Solana RPC.');
  }
  const blockhash = bhData.result.value.blockhash;

  // Dynamically import @solana/web3.js to avoid SSR issues
  const { Connection, Transaction, SystemProgram, PublicKey } = await import('@solana/web3.js');
  const conn = new Connection(SOLANA_RPC, 'confirmed');

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(walletPublicKey),
      toPubkey: new PublicKey(PLATFORM_WALLET),
      lamports,
    })
  );
  tx.recentBlockhash = blockhash;
  tx.feePayer = new PublicKey(walletPublicKey);

  // This will throw if user rejects in Phantom
  const signed = await signTransaction(tx);
  const raw = (signed as { serialize: () => Uint8Array }).serialize();

  const srRes = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: [Buffer.from(raw).toString('base64'), { encoding: 'base64' }],
    }),
  });
  const srData = await srRes.json();
  if (srData.error) {
    throw new Error(srData.error.message ?? 'Transaction rejected by network.');
  }

  // Confirm on-chain
  await conn.confirmTransaction(srData.result, 'confirmed');
  return srData.result as string;
}
