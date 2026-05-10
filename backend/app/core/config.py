"""
core/config.py — App settings loaded from .env
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL:     str = "sqlite:///./neuralsol.db"
    SOLANA_RPC:       str = "https://api.devnet.solana.com"
    PLATFORM_WALLET:  str = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
    ENVIRONMENT:      str = "development"
    SECRET_KEY:       str = "change-me-in-production"

    # Solana Program (set this after `anchor deploy`)
    # Run: solana address -k contracts/neuralsol/target/deploy/neuralsol-keypair.json
    PROGRAM_ID:       str = "PLACEHOLDER_PROGRAM_ID"
    
    OPENAI_API_KEY:   str = ""

    class Config:
        env_file = ".env"


settings = Settings()
