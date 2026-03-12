from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, create_engine
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./learning_platform.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    learning_sessions = relationship("LearningSession", back_populates="user")
    goals = relationship("LearningGoal", back_populates="user")


class LearningSession(Base):
    __tablename__ = "learning_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic = Column(String, nullable=False)
    duration_minutes = Column(Integer)
    score = Column(Float)
    completed_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)
    user = relationship("User", back_populates="learning_sessions")


class LearningGoal(Base):
    __tablename__ = "learning_goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    target_date = Column(DateTime)
    progress_percent = Column(Float, default=0.0)
    status = Column(String, default="active")  # active, completed, paused
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="goals")


class ContentItem(Base):
    __tablename__ = "content_items"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, nullable=False)
    content_type = Column(String)  # lesson, quiz, summary, flashcard
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_demo_data():
    """Seed database with demo data for the analyzer service."""
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        # Demo users
        users = [
            User(name="Alice Chen", email="alice@example.com"),
            User(name="Bob Martinez", email="bob@example.com"),
            User(name="Carol Kim", email="carol@example.com"),
        ]
        db.add_all(users)
        db.flush()

        # Demo learning sessions
        sessions = [
            LearningSession(user_id=users[0].id, topic="Python Basics", duration_minutes=45, score=88.5, notes="Covered variables and loops"),
            LearningSession(user_id=users[0].id, topic="Data Structures", duration_minutes=60, score=92.0, notes="Lists, dicts, sets"),
            LearningSession(user_id=users[0].id, topic="Algorithms", duration_minutes=90, score=76.0, notes="Sorting algorithms"),
            LearningSession(user_id=users[0].id, topic="Python Advanced", duration_minutes=75, score=95.0, notes="Decorators and generators"),
            LearningSession(user_id=users[1].id, topic="JavaScript", duration_minutes=50, score=82.0, notes="ES6+ features"),
            LearningSession(user_id=users[1].id, topic="React Basics", duration_minutes=120, score=78.5, notes="Components and hooks"),
            LearningSession(user_id=users[1].id, topic="Node.js", duration_minutes=80, score=85.0, notes="Express and APIs"),
            LearningSession(user_id=users[2].id, topic="Machine Learning", duration_minutes=150, score=70.0, notes="Linear regression"),
            LearningSession(user_id=users[2].id, topic="Deep Learning", duration_minutes=180, score=65.5, notes="Neural networks"),
            LearningSession(user_id=users[2].id, topic="NLP Basics", duration_minutes=90, score=80.0, notes="Tokenization and embeddings"),
        ]
        db.add_all(sessions)

        # Demo goals
        goals = [
            LearningGoal(user_id=users[0].id, title="Master Python", description="Complete Python from basics to advanced", progress_percent=75.0, status="active"),
            LearningGoal(user_id=users[0].id, title="Get Data Science Cert", description="Complete data science certification", progress_percent=40.0, status="active"),
            LearningGoal(user_id=users[1].id, title="Full-Stack Developer", description="Build complete web applications", progress_percent=60.0, status="active"),
            LearningGoal(user_id=users[2].id, title="ML Engineer", description="Master machine learning concepts", progress_percent=35.0, status="active"),
        ]
        db.add_all(goals)
        db.commit()
    finally:
        db.close()
