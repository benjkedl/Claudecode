from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from seed import seed_db
from routers import auth as auth_router
from routers import students as students_router
from routers import milestones as milestones_router
from routers import concerns as concerns_router
from routers import faculty as faculty_router
from routers import users as users_router
from routers import cusis as cusis_router

app = FastAPI(title="Student Data Source of Truth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    seed_db()


app.include_router(auth_router.router)
app.include_router(students_router.router)
app.include_router(milestones_router.router)
app.include_router(concerns_router.router)
app.include_router(faculty_router.router)
app.include_router(users_router.router)
app.include_router(cusis_router.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
