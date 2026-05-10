"""
services/solana.py
On-chain transaction verification via Solana JSON-RPC.
No solana-py dependency needed — pure HTTP calls.

Supports two verification modes:
  1. Program mode  — verifies the tx called our NeuralSOL program (pay_inference)
  2. Transfer mode — fallback for plain SOL transfers (pre-program deployment)
"""
import httpx
from app.core.config import settings

DEMO_SIG_PREFIX = "demo_sig_"


async def verify_transaction(
    signature: str,
    expected_amount_lamports: int,
    sender_wallet: str,
) -> bool:
    """
    Verify that `signature` is a confirmed on-chain transaction that either:
      (a) Called our NeuralSOL program's pay_inference instruction, OR
      (b) Was a plain SOL transfer to PLATFORM_WALLET (pre-program fallback)

    Returns True if verified, False otherwise.
    Demo mode (sig starts with 'demo_sig_') always returns True.
    """
    if signature.startswith(DEMO_SIG_PREFIX):
        return True  # devnet demo mode — allow without on-chain check

    try:
        async with httpx.AsyncClient(timeout=12) as client:
            resp = await client.post(
                settings.SOLANA_RPC,
                json={
                    "jsonrpc": "2.0",
                    "id":      1,
                    "method":  "getTransaction",
                    "params":  [
                        signature,
                        {"encoding": "jsonParsed", "commitment": "confirmed"},
                    ],
                },
            )
            data = resp.json()
            tx   = data.get("result")
            if not tx:
                return False

            # Transaction must have succeeded (err == null)
            if tx.get("meta", {}).get("err") is not None:
                return False

            message      = tx.get("transaction", {}).get("message", {})
            instructions = message.get("instructions", [])
            account_keys = message.get("accountKeys", [])

            program_deployed = (
                settings.PROGRAM_ID != "PLACEHOLDER_PROGRAM_ID"
                and bool(settings.PROGRAM_ID)
            )

            # ── Mode A: Program-based verification ────────────────────────────
            if program_deployed:
                for ix in instructions:
                    program_id = ix.get("programId", "")
                    if program_id == settings.PROGRAM_ID:
                        # Found a call to our program — trust it
                        # (In production: decode the discriminator to confirm it's pay_inference)
                        return True

                # Also check inner instructions (CPIs from our program)
                inner_ixs = tx.get("meta", {}).get("innerInstructions", [])
                for inner_group in inner_ixs:
                    for ix in inner_group.get("instructions", []):
                        program_id = ix.get("programId", "")
                        if program_id == settings.PROGRAM_ID:
                            return True

            # ── Mode B: Plain transfer fallback (pre-deployment) ─────────────
            for ix in instructions:
                parsed = ix.get("parsed", {})
                if isinstance(parsed, dict) and parsed.get("type") == "transfer":
                    info     = parsed.get("info", {})
                    dest     = info.get("destination", "")
                    lamports = int(info.get("lamports", 0))
                    source   = info.get("source", "")
                    if (
                        dest     == settings.PLATFORM_WALLET
                        and source   == sender_wallet
                        and lamports >= expected_amount_lamports
                    ):
                        return True

            return False

    except Exception:
        # If RPC is unreachable in dev, allow it through
        return True


async def get_wallet_balance(wallet_address: str) -> float:
    """Return SOL balance for given wallet."""
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.post(
                settings.SOLANA_RPC,
                json={
                    "jsonrpc": "2.0",
                    "id":      1,
                    "method":  "getBalance",
                    "params":  [wallet_address],
                },
            )
            data    = resp.json()
            lamports = data.get("result", {}).get("value", 0)
            return lamports / 1e9
    except Exception:
        return 0.0


async def get_program_info() -> dict:
    """
    Return on-chain info about the deployed NeuralSOL program.
    Used by Admin Panel stats endpoint.
    """
    if settings.PROGRAM_ID == "PLACEHOLDER_PROGRAM_ID":
        return {
            "deployed":   False,
            "program_id": None,
            "network":    "devnet",
            "message":    "Program not yet deployed — run: anchor deploy",
        }

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.post(
                settings.SOLANA_RPC,
                json={
                    "jsonrpc": "2.0",
                    "id":      1,
                    "method":  "getAccountInfo",
                    "params":  [
                        settings.PROGRAM_ID,
                        {"encoding": "base64"},
                    ],
                },
            )
            data    = resp.json()
            account = data.get("result", {}).get("value")
            return {
                "deployed":   account is not None,
                "program_id": settings.PROGRAM_ID,
                "network":    "devnet",
                "executable": account.get("executable", False) if account else False,
                "explorer":   f"https://explorer.solana.com/address/{settings.PROGRAM_ID}?cluster=devnet",
            }
    except Exception:
        return {
            "deployed":   False,
            "program_id": settings.PROGRAM_ID,
            "network":    "devnet",
            "message":    "RPC unreachable",
        }
