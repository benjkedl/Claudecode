from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import (
    get_db,
    Student,
    Concern,
    Milestone,
    AuditLog,
    ConcernStatus,
    MilestoneStatus,
    Role,
)
from auth import get_current_user
from permissions import visible_student_ids, can_view_student, is_registrar_or_admin, can_edit_milestone
from schemas import StudentOut, StudentSummary, StudentOverride, StudentAdvisorAssign, AuditLogOut

router = APIRouter(prefix="/api/students", tags=["students"])


def _get_student_or_404(db: Session, student_id: int) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


def _authorize_view(db: Session, user, student: Student) -> None:
    if not can_view_student(db, user, student):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to view this student")


@router.get("", response_model=list[StudentSummary])
def list_students(
    q: Optional[str] = None,
    program: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    scope = visible_student_ids(db, user)
    query = db.query(Student)
    if scope is not None:
        if not scope:
            return []
        query = query.filter(Student.id.in_(scope))
    if program:
        query = query.filter(Student.program == program)
    if status_filter:
        query = query.filter(Student.status == status_filter)
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(
            (Student.first_name + " " + Student.last_name).ilike(like)
            | Student.student_id.ilike(like)
        )
    students = query.order_by(Student.last_name).all()

    summaries = []
    for s in students:
        open_concerns = (
            db.query(Concern)
            .filter(Concern.student_id == s.id, Concern.status != ConcernStatus.RESOLVED)
            .count()
        )
        at_risk = (
            db.query(Milestone)
            .filter(Milestone.student_id == s.id, Milestone.status == MilestoneStatus.AT_RISK)
            .count()
        )
        summaries.append(
            StudentSummary(
                id=s.id,
                student_id=s.student_id,
                first_name=s.first_name,
                last_name=s.last_name,
                program=s.program,
                cohort_year=s.cohort_year,
                status=s.status,
                advisor_id=s.advisor_id,
                open_concern_count=open_concerns,
                at_risk_milestone_count=at_risk,
            )
        )
    return summaries


@router.get("/programs", response_model=list[str])
def list_programs(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(Student.program).distinct().all()
    return sorted({r[0] for r in rows})


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    student = _get_student_or_404(db, student_id)
    _authorize_view(db, user, student)
    return student


@router.get("/{student_id}/audit", response_model=list[AuditLogOut])
def get_student_audit(student_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    student = _get_student_or_404(db, student_id)
    _authorize_view(db, user, student)
    if user.role not in (Role.ADMIN, Role.REGISTRAR, Role.PROGRAM_DIRECTOR):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to view audit history")
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.entity_type == "student", AuditLog.entity_id == student_id)
        .order_by(AuditLog.changed_at.desc())
        .all()
    )
    return logs


@router.patch("/{student_id}/override", response_model=StudentOut)
def override_student_field(
    student_id: int,
    payload: StudentOverride,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Manually correct a CUSIS-sourced field. Restricted to Admin/Registrar
    since Student rows are otherwise only written by the CUSIS sync job."""
    if not is_registrar_or_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin or Registrar may override CUSIS-sourced student data",
        )
    student = _get_student_or_404(db, student_id)

    allowed_fields = {
        "first_name", "last_name", "preferred_name", "email", "phone", "address", "status",
    }
    if payload.field not in allowed_fields:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Field '{payload.field}' cannot be overridden")

    old_value = getattr(student, payload.field)
    setattr(student, payload.field, payload.value)
    student.manually_overridden = True

    db.add(AuditLog(
        entity_type="student",
        entity_id=student.id,
        field=payload.field,
        old_value=str(old_value) if old_value is not None else None,
        new_value=payload.value,
        changed_by_id=user.id,
    ))
    db.commit()
    db.refresh(student)
    return student


@router.patch("/{student_id}/advisor", response_model=StudentOut)
def assign_advisor(
    student_id: int,
    payload: StudentAdvisorAssign,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    student = _get_student_or_404(db, student_id)
    if not (is_registrar_or_admin(user) or (user.role == Role.PROGRAM_DIRECTOR and can_edit_milestone(db, user, student))):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to assign an advisor for this student")

    old_value = student.advisor_id
    student.advisor_id = payload.advisor_id

    db.add(AuditLog(
        entity_type="student",
        entity_id=student.id,
        field="advisor_id",
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(payload.advisor_id) if payload.advisor_id is not None else None,
        changed_by_id=user.id,
    ))
    db.commit()
    db.refresh(student)
    return student
