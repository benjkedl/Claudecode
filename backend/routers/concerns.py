from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, Student, Concern, AuditLog, ConcernStatus, Role
from auth import get_current_user
from permissions import can_view_student, can_create_concern, can_edit_concern, visible_student_ids
from schemas import ConcernOut, ConcernCreate, ConcernUpdate

router = APIRouter(prefix="/api/concerns", tags=["concerns"])


def _get_student_or_404(db: Session, student_id: int) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


def _get_concern_or_404(db: Session, concern_id: int) -> Concern:
    c = db.query(Concern).filter(Concern.id == concern_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concern not found")
    return c


@router.get("", response_model=list[ConcernOut])
def list_concerns(
    student_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = db.query(Concern)
    if student_id:
        student = _get_student_or_404(db, student_id)
        if not can_view_student(db, user, student):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to view this student")
        query = query.filter(Concern.student_id == student_id)
    else:
        scope = visible_student_ids(db, user)
        if scope is not None:
            if not scope:
                return []
            query = query.filter(Concern.student_id.in_(scope))
    if status_filter:
        query = query.filter(Concern.status == status_filter)
    return query.order_by(Concern.created_at.desc()).all()


@router.post("", response_model=ConcernOut, status_code=status.HTTP_201_CREATED)
def create_concern(payload: ConcernCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    student = _get_student_or_404(db, payload.student_id)
    if not can_create_concern(db, user, student):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to raise a concern for this student")

    concern = Concern(**payload.model_dump(), raised_by_id=user.id)
    db.add(concern)
    db.commit()
    db.refresh(concern)
    return concern


@router.patch("/{concern_id}", response_model=ConcernOut)
def update_concern(
    concern_id: int,
    payload: ConcernUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    concern = _get_concern_or_404(db, concern_id)
    student = _get_student_or_404(db, concern.student_id)
    if not can_edit_concern(db, user, concern, student):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to edit this concern")

    updates = payload.model_dump(exclude_unset=True)
    for field, new_value in updates.items():
        old_value = getattr(concern, field)
        if old_value != new_value:
            db.add(AuditLog(
                entity_type="concern",
                entity_id=concern.id,
                field=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(new_value) if new_value is not None else None,
                changed_by_id=user.id,
            ))
        setattr(concern, field, new_value)

    if payload.status == ConcernStatus.RESOLVED and concern.resolved_at is None:
        concern.resolved_at = datetime.utcnow()
    elif payload.status is not None and payload.status != ConcernStatus.RESOLVED:
        concern.resolved_at = None

    db.commit()
    db.refresh(concern)
    return concern


@router.delete("/{concern_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_concern(concern_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    concern = _get_concern_or_404(db, concern_id)
    if user.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admin may delete a concern record")
    db.delete(concern)
    db.commit()
