import enum
from datetime import datetime, date

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
    Enum as SAEnum,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DATABASE_URL = "sqlite:///./student_sot.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class Role(str, enum.Enum):
    ADMIN = "admin"                        # Full access, user/role management, CUSIS sync
    REGISTRAR = "registrar"                # CUSIS sync + personal-info corrections, read all
    PROGRAM_DIRECTOR = "program_director"  # LIC/clerkship directors etc. Full edit within their program
    ADVISOR = "advisor"                    # Edit progress/concerns for their assigned students only
    FACULTY = "faculty"                    # Can view assigned students, raise (not resolve) concerns
    VIEWER = "viewer"                      # Read-only access across the board


class StudentStatus(str, enum.Enum):
    ACTIVE = "active"
    LEAVE_OF_ABSENCE = "leave_of_absence"
    WITHDRAWN = "withdrawn"
    GRADUATED = "graduated"


class MilestoneStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    AT_RISK = "at_risk"
    COMPLETE = "complete"


class ConcernCategory(str, enum.Enum):
    ACADEMIC = "academic"
    PROFESSIONALISM = "professionalism"
    WELLBEING = "wellbeing"
    CLINICAL_PERFORMANCE = "clinical_performance"


class ConcernSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ConcernStatus(str, enum.Enum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"


class SyncStatus(str, enum.Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(Role), nullable=False, default=Role.VIEWER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    advisees = relationship("Student", back_populates="advisor")
    appointments = relationship("FacultyAppointment", back_populates="user")


class Student(Base):
    """
    Personal/enrollment fields on this record are authoritative from CUSIS.
    They are only ever written by the CUSIS sync job (backend/routers/cusis.py)
    or, in rare cases, an audited manual override by Admin/Registrar.
    Downstream data (milestones, concerns, faculty scope) hangs off this record
    so every consuming view reads the same canonical student.
    """

    __tablename__ = "students"

    id = Column(Integer, primary_key=True)
    student_id = Column(String, unique=True, nullable=False, index=True)  # CUSIS ID
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    preferred_name = Column(String, nullable=True)
    dob = Column(Date, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    program = Column(String, nullable=False)       # e.g. "MD Program"
    cohort_year = Column(Integer, nullable=False)   # expected graduation year
    status = Column(SAEnum(StudentStatus), nullable=False, default=StudentStatus.ACTIVE)

    advisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    cusis_synced_at = Column(DateTime, nullable=True)
    manually_overridden = Column(Boolean, default=False)

    advisor = relationship("User", back_populates="advisees")
    milestones = relationship("Milestone", back_populates="student", cascade="all, delete-orphan")
    concerns = relationship("Concern", back_populates="student", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class FacultyAppointment(Base):
    """Tracks named administrative/faculty roles such as LIC Director, Clerkship
    Director, Associate Dean, or Academic Advisor, scoped to a program (and
    optionally a site). Only Admins may create/edit appointments."""

    __tablename__ = "faculty_appointments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_title = Column(String, nullable=False)   # e.g. "LIC Director"
    program = Column(String, nullable=False)       # scope: which program this appointment governs
    site = Column(String, nullable=True)
    start_date = Column(Date, nullable=False, default=date.today)
    end_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="appointments")

    @property
    def is_active(self) -> bool:
        today = date.today()
        if self.end_date is None:
            return self.start_date <= today
        return self.start_date <= today <= self.end_date


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    milestone_type = Column(String, nullable=False)  # e.g. "USMLE Step 1", "Clerkship: Internal Medicine"
    status = Column(SAEnum(MilestoneStatus), nullable=False, default=MilestoneStatus.NOT_STARTED)
    target_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="milestones")
    recorded_by = relationship("User")


class Concern(Base):
    __tablename__ = "concerns"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    category = Column(SAEnum(ConcernCategory), nullable=False)
    severity = Column(SAEnum(ConcernSeverity), nullable=False, default=ConcernSeverity.LOW)
    status = Column(SAEnum(ConcernStatus), nullable=False, default=ConcernStatus.OPEN)
    description = Column(Text, nullable=False)
    resolution_notes = Column(Text, nullable=True)

    raised_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="concerns")
    raised_by = relationship("User", foreign_keys=[raised_by_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])


class AuditLog(Base):
    """Every write to a Student's source-of-truth fields, or to a milestone /
    concern record, is appended here so tiered-access changes stay traceable."""

    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True)
    entity_type = Column(String, nullable=False)  # "student" | "milestone" | "concern" | "faculty_appointment"
    entity_id = Column(Integer, nullable=False)
    field = Column(String, nullable=False)
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)

    changed_by = relationship("User")


class CusisSyncLog(Base):
    """Record of each simulated nightly pull from CUSIS. Real integrations
    would replace routers/cusis.py's mock-file reader with a CUSIS API/SFTP
    client; everything downstream of that read stays the same."""

    __tablename__ = "cusis_sync_log"

    id = Column(Integer, primary_key=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(SAEnum(SyncStatus), nullable=False, default=SyncStatus.SUCCESS)
    records_processed = Column(Integer, default=0)
    records_created = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    triggered_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)

    triggered_by = relationship("User")


def init_db():
    Base.metadata.create_all(bind=engine)
