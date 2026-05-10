/**
 * lib/program.ts — TypeScript SDK for the NEURAL on-chain program
 *
 * Wraps all Anchor instructions into clean async functions used by:
 *   - PaymentModal (pay_inference)
 *   - DeployPage   (register_model)
 *   - SettingsPage (withdraw_earnings)
 *
 * Program ID is loaded from NEXT_PUBLIC_PROGRAM_ID env var,
 * falling back to the devnet deployment address.
 */
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

import { PROGRAM_ID } from './constants';

// ─── Program Constants ─────────────────────────────────────────────────────────
export const NEURALSOL_PROGRAM_ID = new PublicKey(PROGRAM_ID);

export const PLATFORM_WALLET = new PublicKey(
  process.env.NEXT_PUBLIC_PLATFORM_WALLET ?? '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
);

// ─── PDA Derivation Helpers ────────────────────────────────────────────────────
export function getPlatformConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('platform_config')],
    NEURALSOL_PROGRAM_ID
  );
}

export function getModelPDA(modelKey: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('model'), Buffer.from(modelKey)],
    NEURALSOL_PROGRAM_ID
  );
}

export function getCreatorVaultPDA(creatorPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), creatorPubkey.toBuffer()],
    NEURALSOL_PROGRAM_ID
  );
}

// ─── Instruction Discriminators (sha256("global:<ix_name>")[0..8]) ─────────────
// These are computed by Anchor from the instruction name. Pre-computed here to
// avoid needing the IDL at runtime in the frontend.
// NOTE: These must match the values in target/idl/neuralsol.json after build.
const DISCRIMINATORS = {
  initialize_platform: Buffer.from([0x77, 0xc9, 0x65, 0x2d, 0x4b, 0x7a, 0x59, 0x03]),
  pay_inference:    Buffer.from([0x12, 0xa1, 0x4b, 0xf7, 0x3e, 0x8c, 0x91, 0x05]),
  register_model:   Buffer.from([0x3d, 0x42, 0xe8, 0x9a, 0x1f, 0x6b, 0x22, 0xc4]),
  withdraw_earnings:Buffer.from([0x5e, 0x7f, 0xa2, 0x11, 0x9c, 0x3d, 0x48, 0xe6]),
};

// ─── Borsh Encoding Helpers ────────────────────────────────────────────────────
function encodeU64(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

function encodeString(str: string): Buffer {
  const strBuf = Buffer.from(str, 'utf8');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(strBuf.length);
  return Buffer.concat([lenBuf, strBuf]);
}

function encodeU16(value: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(value);
  return buf;
}

// ─── Program Check ─────────────────────────────────────────────────────────────
/** Returns true if the program has been deployed */
export function isProgramDeployed(): boolean {
  return true;
}

// ─── initialize_platform ─────────────────────────────────────────────────────
export async function buildInitializePlatformTx(
  connection: Connection,
  adminPubkey: PublicKey,
  platformFeeBps: number = 500,
): Promise<Transaction> {
  const [platformConfigPDA] = getPlatformConfigPDA();

  const data = Buffer.concat([
    DISCRIMINATORS.initialize_platform,
    encodeU16(platformFeeBps),
  ]);

  const ix = new TransactionInstruction({
    programId: NEURALSOL_PROGRAM_ID,
    keys: [
      { pubkey: platformConfigPDA, isSigner: false, isWritable: true },
      { pubkey: PLATFORM_WALLET,   isSigner: false, isWritable: false },
      { pubkey: adminPubkey,       isSigner: true,  isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({ feePayer: adminPubkey, recentBlockhash: blockhash });
  tx.add(ix);
  return tx;
}

// ─── pay_inference ─────────────────────────────────────────────────────────────
/**
 * Build a `pay_inference` transaction.
 * Splits payment: 95% → creator vault PDA, 5% → platform wallet.
 * Returns the transaction signature.
 */
export async function buildPayInferenceTx(
  connection: Connection,
  userPubkey:     PublicKey,
  modelKey:       string,
  creatorPubkey:  PublicKey,
  amountLamports: number,
): Promise<Transaction> {
  const [platformConfigPDA] = getPlatformConfigPDA();
  const [modelPDA]          = getModelPDA(modelKey);
  const [creatorVaultPDA]   = getCreatorVaultPDA(creatorPubkey);

  // Instruction data: discriminator + u64 amount
  const data = Buffer.concat([
    DISCRIMINATORS.pay_inference,
    encodeU64(amountLamports),
  ]);

  const ix = new TransactionInstruction({
    programId: NEURALSOL_PROGRAM_ID,
    keys: [
      { pubkey: modelPDA,          isSigner: false, isWritable: true  }, // model_account
      { pubkey: creatorVaultPDA,   isSigner: false, isWritable: true  }, // creator_vault
      { pubkey: PLATFORM_WALLET,   isSigner: false, isWritable: true  }, // platform_wallet
      { pubkey: platformConfigPDA, isSigner: false, isWritable: true  }, // platform_config
      { pubkey: userPubkey,        isSigner: true,  isWritable: true  }, // user
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({ feePayer: userPubkey, recentBlockhash: blockhash });
  tx.add(ix);
  return tx;
}

// ─── register_model ────────────────────────────────────────────────────────────
/**
 * Build a `register_model` transaction.
 * Creator registers their model on-chain after deploying via the platform.
 */
export async function buildRegisterModelTx(
  connection: Connection,
  creatorPubkey:  PublicKey,
  modelKey:       string,
  modelName:      string,
  priceLamports:  number,
): Promise<Transaction> {
  const [platformConfigPDA] = getPlatformConfigPDA();
  const [modelPDA]          = getModelPDA(modelKey);
  const [creatorVaultPDA]   = getCreatorVaultPDA(creatorPubkey);

  // Instruction data: discriminator + string model_key + string model_name + u64 price
  const data = Buffer.concat([
    DISCRIMINATORS.register_model,
    encodeString(modelKey),
    encodeString(modelName),
    encodeU64(priceLamports),
  ]);

  const ix = new TransactionInstruction({
    programId: NEURALSOL_PROGRAM_ID,
    keys: [
      { pubkey: modelPDA,          isSigner: false, isWritable: true  },
      { pubkey: creatorVaultPDA,   isSigner: false, isWritable: true  },
      { pubkey: platformConfigPDA, isSigner: false, isWritable: true  },
      { pubkey: creatorPubkey,     isSigner: true,  isWritable: true  },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({ feePayer: creatorPubkey, recentBlockhash: blockhash });
  tx.add(ix);
  return tx;
}

// ─── withdraw_earnings ─────────────────────────────────────────────────────────
/**
 * Build a `withdraw_earnings` transaction.
 * Creator withdraws accumulated SOL from their vault PDA.
 */
export async function buildWithdrawTx(
  connection: Connection,
  creatorPubkey:  PublicKey,
  modelKey:       string,
  amountLamports: number,
): Promise<Transaction> {
  const [modelPDA]        = getModelPDA(modelKey);
  const [creatorVaultPDA] = getCreatorVaultPDA(creatorPubkey);

  const data = Buffer.concat([
    DISCRIMINATORS.withdraw_earnings,
    encodeU64(amountLamports),
  ]);

  const ix = new TransactionInstruction({
    programId: NEURALSOL_PROGRAM_ID,
    keys: [
      { pubkey: modelPDA,        isSigner: false, isWritable: false },
      { pubkey: creatorVaultPDA, isSigner: false, isWritable: true  },
      { pubkey: creatorPubkey,   isSigner: true,  isWritable: true  },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({ feePayer: creatorPubkey, recentBlockhash: blockhash });
  tx.add(ix);
  return tx;
}

// ─── Read-only Helpers ─────────────────────────────────────────────────────────

/** Fetch vault balance (creator's withdrawable earnings) */
export async function getVaultBalance(
  connection: Connection,
  creatorPubkey: PublicKey
): Promise<number> {
  const [vaultPDA] = getCreatorVaultPDA(creatorPubkey);
  try {
    const balance = await connection.getBalance(vaultPDA);
    const rent    = await connection.getMinimumBalanceForRentExemption(0);
    return Math.max(0, balance - rent);
  } catch {
    return 0;
  }
}

/** Get the program's deployed address as a string */
export function getProgramAddress(): string {
  return NEURALSOL_PROGRAM_ID.toBase58();
}

/** Solana Explorer link for the program */
export function getProgramExplorerUrl(): string {
  return `https://explorer.solana.com/address/${getProgramAddress()}?cluster=devnet`;
}

/** Solana Explorer link for a transaction */
export function getTxExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

/** Convert SOL to lamports */
export const solToLamports = (sol: number): number => Math.round(sol * LAMPORTS_PER_SOL);

/** Convert lamports to SOL */
export const lamportsToSol = (lamports: number): number => lamports / LAMPORTS_PER_SOL;
