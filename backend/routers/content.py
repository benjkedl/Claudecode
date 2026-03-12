from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.content_service import generate_lesson, generate_quiz, generate_flashcards, generate_summary

router = APIRouter(prefix="/content", tags=["content"])


class LessonRequest(BaseModel):
    topic: str
    level: str = "intermediate"  # beginner, intermediate, advanced
    style: str = "balanced"  # visual, conceptual, practical, balanced


class QuizRequest(BaseModel):
    topic: str
    num_questions: int = 5
    difficulty: str = "medium"  # easy, medium, hard


class FlashcardRequest(BaseModel):
    topic: str
    count: int = 10


class SummaryRequest(BaseModel):
    topic: str
    depth: str = "medium"  # quick, medium, deep


@router.post("/lesson")
async def create_lesson(request: LessonRequest):
    return StreamingResponse(
        generate_lesson(request.topic, request.level, request.style),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )


@router.post("/quiz")
async def create_quiz(request: QuizRequest):
    return StreamingResponse(
        generate_quiz(request.topic, request.num_questions, request.difficulty),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )


@router.post("/flashcards")
async def create_flashcards(request: FlashcardRequest):
    return StreamingResponse(
        generate_flashcards(request.topic, request.count),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )


@router.post("/summary")
async def create_summary(request: SummaryRequest):
    return StreamingResponse(
        generate_summary(request.topic, request.depth),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )
