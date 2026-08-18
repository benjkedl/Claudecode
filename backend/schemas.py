from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from database import (
    Role,
    StudentStatus,
    MilestoneStatus,
    ConcernCategory,
    ConcernSeverity,
    ConcernStatus,
    SyncStatus,
)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: Role
    is_active: bool


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Role


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None


# ---------------------------------------------------------------------------
# Students
# ---------------------------------------------------------------------------

class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: str
    first_name: str
    last_name: str
    preferred_name: Optional[str] = None
    dob: Optional[date] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    program: str
    cohort_year: int
    status: StudentStatus
    advisor_id: Optional[int] = None
    cusis_synced_at: Optional[datetime] = None
    manually_overridden: bool


class StudentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: str
    first_name: str
    last_name: str
    program: str
    cohort_year: int
    status: StudentStatus
    advisor_id: Optional[int] = None
    open_concern_count: int = 0
    at_risk_milestone_count: int = 0


class StudentOverride(BaseModel):
    """Manual correction of a CUSIS-sourced field. Always audit-logged."""
    field: str
    value: str
    reason: str


class StudentAdvisorAssign(BaseModel):
    advisor_id: Optional[int] = None


# ---------------------------------------------------------------------------
# Milestones
# ---------------------------------------------------------------------------

class MilestoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    milestone_type: str
    status: MilestoneStatus
    target_date: Optional[date] = None
    completed_date: Optional[date] = None
    notes: Optional[str] = None
    recorded_by_id: Optional[int] = None
    updated_at: datetime


class MilestoneCreate(BaseModel):
    student_id: int
    milestone_type: str
    status: MilestoneStatus = MilestoneStatus.NOT_STARTED
    target_date: Optional[date] = None
    completed_date: Optional[date] = None
    notes: Optional[str] = None


class MilestoneUpdate(BaseModel):
    status: Optional[MilestoneStatus] = None
    target_date: Optional[date] = None
    completed_date: Optional[date] = None
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Concerns
# ---------------------------------------------------------------------------

class ConcernOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    category: ConcernCategory
    severity: ConcernSeverity
    status: ConcernStatus
    description: str
    resolution_notes: Optional[str] = None
    raised_by_id: int
    assigned_to_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None


class ConcernCreate(BaseModel):
    student_id: int
    category: ConcernCategory
    severity: ConcernSeverity = ConcernSeverity.LOW
    description: str
    assigned_to_id: Optional[int] = None


class ConcernUpdate(BaseModel):
    category: Optional[ConcernCategory] = None
    severity: Optional[ConcernSeverity] = None
    status: Optional[ConcernStatus] = None
    description: Optional[str] = None
    resolution_notes: Optional[str] = None
    assigned_to_id: Optional[int] = None


# ---------------------------------------------------------------------------
# Faculty appointments
# ---------------------------------------------------------------------------

class FacultyAppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    role_title: str
    program: str
    site: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    notes: Optional[str] = None
    is_active: bool


class FacultyAppointmentCreate(BaseModel):
    user_id: int
    role_title: str
    program: str
    site: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    notes: Optional[str] = None


class FacultyAppointmentUpdate(BaseModel):
    role_title: Optional[str] = None
    program: Optional[str] = None
    site: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# CUSIS sync + audit
# ---------------------------------------------------------------------------

class CusisSyncLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: SyncStatus
    records_processed: int
    records_created: int
    records_updated: int
    triggered_by_id: Optional[int] = None
    notes: Optional[str] = None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_type: str
    entity_id: int
    field: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by_id: Optional[int] = None
    changed_at: datetime
