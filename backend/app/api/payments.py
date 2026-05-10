"""
api/payments.py — Payment verification middleware helper
"""
from fastapi import Header, HTTPException
from app.services.solana import verify_transaction
from app.core.config import settings


def payment_required_response(amount_sol: float, service: str) -> dict:
    """Standard 402 response body."""
    return {
        "detail": "Payment required",
        "platform_wallet": settings.PLATFORM_WALLET,
        "amount_sol": amount_sol,
        "amount_lamports": int(amount_sol * 1e9),
        "service": service,
    }


async def require_payment(
    x_solana_signature: str | None,
    amount_sol: float,
    service: str,
    wallet_address: str = "",
) -> str:
    """
    Dependency-style helper: raises 402 if no signature provided,
    raises 402 if signature is invalid, returns verified signature.
    """
    if not x_solana_signature:
        raise HTTPException(
            status_code=402,
            detail=payment_required_response(amount_sol, service),
        )
    verified = await verify_transaction(
        signature=x_solana_signature,
        expected_amount_lamports=int(amount_sol * 1e9),
        sender_wallet=wallet_address,
    )
    if not verified:
        raise HTTPException(
            status_code=402,
            detail={**payment_required_response(amount_sol, service), "error": "Transaction not verified"},
        )
    return x_solana_signature
