from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, User, LearningSession, LearningGoal
from services.analyzer_service import analyze_learning_data

router = APIRouter(prefix="/analyzer", tags=["analyzer"])


class AnalysisRequest(BaseModel):
    query: str
    user_id: int | None = None


class UserStats(BaseModel):
    user_id: int


@router.post("/analyze")
async def analyze(request: AnalysisRequest):
    return StreamingResponse(
        analyze_learning_data(request.query, request.user_id),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )


@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "name": u.name, "email": u.email} for u in users]


@router.get("/users/{user_id}/stats")
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}

    sessions = db.query(LearningSession).filter(LearningSession.user_id == user_id).all()
    goals = db.query(LearningGoal).filter(LearningGoal.user_id == user_id).all()

    avg_score = sum(s.score for s in sessions if s.score) / len(sessions) if sessions else 0
    total_hours = sum(s.duration_minutes for s in sessions if s.duration_minutes) / 60

    return {
        "user": {"id": user.id, "name": user.name},
        "total_sessions": len(sessions),
        "total_hours": round(total_hours, 1),
        "avg_score": round(avg_score, 1),
        "topics_studied": list(set(s.topic for s in sessions)),
        "active_goals": len([g for g in goals if g.status == "active"]),
        "goals": [{"title": g.title, "progress": g.progress_percent} for g in goals],
    }


@router.get("/sample-queries")
def get_sample_queries():
    return {
        "queries": [
            "Which topics have the highest average scores across all users?",
            "Who are the most consistent learners based on session frequency?",
            "What is the correlation between study duration and scores?",
            "Which goals have the least progress and might need attention?",
            "Show me learning trends over time for all users",
            "Which user has the most diverse learning topics?",
            "What are the top performing users and what do they have in common?",
        ]
    }
