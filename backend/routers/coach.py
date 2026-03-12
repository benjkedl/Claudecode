from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, User, LearningSession, LearningGoal
from services.coach_service import coach_conversation, generate_learning_plan, analyze_progress

router = APIRouter(prefix="/coach", tags=["coach"])


class Message(BaseModel):
    role: str  # user or assistant
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    user_id: int | None = None


class LearningPlanRequest(BaseModel):
    goal: str
    timeline: str = "3 months"
    current_level: str = "beginner"
    available_hours: int = 10


class ProgressAnalysisRequest(BaseModel):
    user_id: int
    goal_id: int | None = None


@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    user_context = None

    if request.user_id:
        user = db.query(User).filter(User.id == request.user_id).first()
        if user:
            sessions = db.query(LearningSession).filter(
                LearningSession.user_id == request.user_id
            ).order_by(LearningSession.completed_at.desc()).limit(5).all()

            goals = db.query(LearningGoal).filter(
                LearningGoal.user_id == request.user_id,
                LearningGoal.status == "active"
            ).all()

            avg_score = sum(s.score for s in sessions if s.score) / len(sessions) if sessions else 0

            user_context = {
                "name": user.name,
                "goals": [g.title for g in goals],
                "recent_topics": [s.topic for s in sessions],
                "avg_score": avg_score,
            }

    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    return StreamingResponse(
        coach_conversation(messages, user_context),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )


@router.post("/learning-plan")
async def create_learning_plan(request: LearningPlanRequest):
    return StreamingResponse(
        generate_learning_plan(
            request.goal,
            request.timeline,
            request.current_level,
            request.available_hours,
        ),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )


@router.post("/analyze-progress")
async def analyze_user_progress(request: ProgressAnalysisRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        return {"error": "User not found"}

    sessions = db.query(LearningSession).filter(
        LearningSession.user_id == request.user_id
    ).all()

    goals = db.query(LearningGoal).filter(
        LearningGoal.user_id == request.user_id
    ).all()

    goal = None
    if request.goal_id:
        goal = db.query(LearningGoal).filter(
            LearningGoal.id == request.goal_id,
            LearningGoal.user_id == request.user_id
        ).first()

    goal_title = goal.title if goal else "Overall Learning Progress"
    progress_percent = goal.progress_percent if goal else (
        sum(g.progress_percent for g in goals) / len(goals) if goals else 0
    )

    avg_score = sum(s.score for s in sessions if s.score) / len(sessions) if sessions else 0
    total_hours = sum(s.duration_minutes for s in sessions if s.duration_minutes) / 60

    progress_data = {
        "sessions": len(sessions),
        "hours": total_hours,
        "avg_score": avg_score,
        "topics": list(set(s.topic for s in sessions)),
        "progress_percent": progress_percent,
        "days_active": len(set(s.completed_at.date() for s in sessions if s.completed_at)),
    }

    return StreamingResponse(
        analyze_progress(goal_title, progress_data),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )


@router.get("/starter-prompts")
def get_starter_prompts():
    return {
        "prompts": [
            "Help me create a study schedule for learning machine learning in 3 months",
            "I've been procrastinating on my learning goals. How can I stay motivated?",
            "What are the best techniques for memorizing complex technical concepts?",
            "I want to switch careers to software engineering. Where should I start?",
            "How do I know if I'm learning effectively or just going through the motions?",
            "I struggle with imposter syndrome. How do I build confidence while learning?",
        ]
    }
