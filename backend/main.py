import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import create_tables, seed_demo_data
from routers import content, analyzer, coach

load_dotenv()

app = FastAPI(
    title="LLM Learning Platform API",
    description="AI-powered learning platform with content generation, data analysis, and coaching",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(content.router)
app.include_router(analyzer.router)
app.include_router(coach.router)


@app.on_event("startup")
async def startup():
    create_tables()
    seed_demo_data()


@app.get("/")
def root():
    return {
        "name": "LLM Learning Platform",
        "version": "1.0.0",
        "services": {
            "content": "/content — Generate lessons, quizzes, flashcards, and summaries",
            "analyzer": "/analyzer — Analyze personal learning data with SQL + AI",
            "coach": "/coach — AI coaching, learning plans, and progress analysis",
        },
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
