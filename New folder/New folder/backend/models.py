from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    handle = Column(String(64), unique=True, index=True, default="demo")
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String(16))       # "user" | "assistant" | "system"
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    flagged_crisis = Column(Boolean, default=False)
    user = relationship("User")

class HealthMetric(Base):
    __tablename__ = "health_metrics"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String(10))  # YYYY-MM-DD
    mood = Column(Integer)     # 1-5
    sleep_hours = Column(Float)
    steps = Column(Integer)
    exercise_minutes = Column(Integer)
    notes = Column(Text, default="")
    user = relationship("User")

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Integer)  # 1-5
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    meta = Column(JSON, default={})
    user = relationship("User")

class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    code = Column(String(64))      # e.g., "FIRST_CHAT", "MOOD_STREAK_3"
    title = Column(String(128))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User")
