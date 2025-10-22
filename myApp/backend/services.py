from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from models import User, Message, HealthMetric, Feedback, Achievement

class UserService:
    @staticmethod
    def get_or_create_user(db: Session, handle: str = "demo") -> User:
        user = db.query(User).filter(User.handle == handle).first()
        if not user:
            user = User(handle=handle)
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

class MessageService:
    @staticmethod
    def add_message(db: Session, user_id: int, content: str, role: str, flagged_crisis: bool = False) -> Message:
        message = Message(
            user_id=user_id,
            content=content,
            role=role,
            flagged_crisis=flagged_crisis
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message
    
    @staticmethod
    def get_recent_messages(db: Session, user_id: int, limit: int = 5) -> List[Message]:
        return db.query(Message)\
            .filter(Message.user_id == user_id)\
            .order_by(Message.created_at.desc())\
            .limit(limit)\
            .all()

class HealthService:
    @staticmethod
    def add_health_metric(
        db: Session, 
        user_id: int, 
        date: str,
        mood: int,
        sleep_hours: float = 0,
        steps: int = 0,
        exercise_minutes: int = 0,
        notes: str = ""
    ) -> HealthMetric:
        metric = HealthMetric(
            user_id=user_id,
            date=date,
            mood=mood,
            sleep_hours=sleep_hours,
            steps=steps,
            exercise_minutes=exercise_minutes,
            notes=notes
        )
        db.add(metric)
        db.commit()
        db.refresh(metric)
        return metric
    
    @staticmethod
    def check_streak(db: Session, user_id: int, days: int = 3) -> bool:
        today = datetime.now().date()
        dates = {
            r.date for r in db.query(HealthMetric)
            .filter(HealthMetric.user_id == user_id)
            .all()
        }
        return all(
            (today - timedelta(days=i)).strftime("%Y-%m-%d") in dates 
            for i in range(days)
        )

class AchievementService:
    @staticmethod
    def unlock_achievement(
        db: Session,
        user_id: int,
        code: str,
        title: str,
        description: str
    ) -> Optional[Achievement]:
        exists = db.query(Achievement)\
            .filter(Achievement.user_id == user_id, Achievement.code == code)\
            .first()
        
        if not exists:
            achievement = Achievement(
                user_id=user_id,
                code=code,
                title=title,
                description=description
            )
            db.add(achievement)
            db.commit()
            db.refresh(achievement)
            return achievement
        return None

class FeedbackService:
    @staticmethod
    def add_feedback(
        db: Session,
        user_id: int,
        rating: int,
        comment: str = "",
        meta: dict = None
    ) -> Feedback:
        feedback = Feedback(
            user_id=user_id,
            rating=rating,
            comment=comment,
            meta=meta or {}
        )
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        return feedback