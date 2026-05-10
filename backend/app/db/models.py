"""
db/models.py — SQLAlchemy ORM models
Tables: users, ai_models, datasets, transactions, competitions, submissions, workflows
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True)
    wallet_address  = Column(String(64), unique=True, nullable=False, index=True)
    total_earned_sol = Column(Float, default=0.0)
    total_spent_sol  = Column(Float, default=0.0)
    created_at      = Column(DateTime, default=datetime.utcnow)
    transactions    = relationship("Transaction", back_populates="user")
    submissions     = relationship("Submission", back_populates="user")


class AIModel(Base):
    __tablename__ = "ai_models"
    id               = Column(Integer, primary_key=True)
    key              = Column(String(64), unique=True, nullable=False, index=True)
    name             = Column(String(128), nullable=False)
    description      = Column(Text)
    category         = Column(String(32))
    price_sol        = Column(Float, nullable=False)
    accuracy         = Column(Float)
    owner_wallet     = Column(String(64))
    endpoint_url     = Column(String(512), nullable=True)   # real model endpoint
    is_active        = Column(Boolean, default=True)
    is_approved      = Column(Boolean, default=True)        # governance hook
    total_uses       = Column(Integer, default=0)
    total_revenue_sol = Column(Float, default=0.0)
    created_at       = Column(DateTime, default=datetime.utcnow)


class Dataset(Base):
    __tablename__ = "datasets"
    id           = Column(Integer, primary_key=True)
    name         = Column(String(128), unique=True, nullable=False)
    description  = Column(Text)
    category     = Column(String(32))
    price_sol    = Column(Float, default=0.0)
    row_count    = Column(String(16))
    size_label   = Column(String(16))
    owner_wallet = Column(String(64))
    downloads    = Column(Integer, default=0)
    created_at   = Column(DateTime, default=datetime.utcnow)


class Transaction(Base):
    __tablename__ = "transactions"
    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=True)
    wallet_address = Column(String(64), nullable=False)
    signature    = Column(String(128), unique=True, nullable=False)
    amount_sol   = Column(Float, nullable=False)
    service_type = Column(String(32))   # "inference" | "dataset" | "competition" | "agent" | "workflow"
    service_ref  = Column(String(64))   # model key, dataset name, comp id, etc.
    verified     = Column(Boolean, default=False)
    created_at   = Column(DateTime, default=datetime.utcnow)
    user         = relationship("User", back_populates="transactions")


class Competition(Base):
    __tablename__ = "competitions"
    id           = Column(Integer, primary_key=True)
    title        = Column(String(128), nullable=False)
    description  = Column(Text)
    prize_sol    = Column(Float, nullable=False)
    metric       = Column(String(32))
    dataset_name = Column(String(64))
    is_active    = Column(Boolean, default=True)
    ends_at      = Column(DateTime)
    created_at   = Column(DateTime, default=datetime.utcnow)
    submissions  = relationship("Submission", back_populates="competition")


class Submission(Base):
    __tablename__ = "submissions"
    id             = Column(Integer, primary_key=True)
    competition_id = Column(Integer, ForeignKey("competitions.id"))
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=True)
    wallet_address = Column(String(64))
    model_name     = Column(String(128))
    score          = Column(Float)
    rank           = Column(Integer)
    submitted_at   = Column(DateTime, default=datetime.utcnow)
    competition    = relationship("Competition", back_populates="submissions")
    user           = relationship("User", back_populates="submissions")


class Workflow(Base):
    __tablename__ = "workflows"
    id              = Column(Integer, primary_key=True)
    name            = Column(String(128), nullable=False)
    wallet_address  = Column(String(64), nullable=False, index=True)
    definition_json = Column(Text, nullable=False)  # JSON: {nodes, edges}
    status          = Column(String(32), default="saved")  # saved | running | done | error
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
