from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, Student, Milestone, AuditLog
from auth import get_current_user
from permissions import can_view_student, can_edit_milestone, visible_student_ids
from schemas import MilestoneOut, MilestoneCreate, MilestoneUpdate

router = APIRouter(prefix="/api/milestones", tags=["milestones"])


def _get_student_or_404(db: Session, student_id: int) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


def _get_milestone_or_404(db: Session, milestone_id: int) -> Milestone:
    m = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    return m


@router.get("", response_model=list[MilestoneOut])
def list_milestones(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = db.query(Milestone)
    if student_id:
        student = _get_student_or_404(db, student_id)
        if not can_view_student(db, user, student):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to view this student")
        query = query.filter(Milestone.student_id == student_id)
    else:
        scope = visible_student_ids(db, user)
        if scope is not None:
            if not scope:
                return []
            query = query.filter(Milestone.student_id.in_(scope))
    return query.order_by(Milestone.target_date).all()


@router.post("", response_model=MilestoneOut, status_code=status.HTTP_201_CREATED)
def create_milestone(payload: MilestoneCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    student = _get_student_or_404(db, payload.student_id)
    if not can_edit_milestone(db, user, student):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to add milestones for this student")

    milestone = Milestone(**payload.model_dump(), recorded_by_id=user.id)
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.patch("/{milestone_id}", response_model=MilestoneOut)
def update_milestone(
    milestone_id: int,
    payload: MilestoneUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    milestone = _get_milestone_or_404(db, milestone_id)
    student = _get_student_or_404(db, milestone.student_id)
    if not can_edit_milestone(db, user, student):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to edit milestones for this student")

    updates = payload.model_dump(exclude_unset=True)
    for field, new_value in updates.items():
        old_value = getattr(milestone, field)
        if old_value != new_value:
            db.add(AuditLog(
                entity_type="milestone",
                entity_id=milestone.id,
                field=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(new_value) if new_value is not None else None,
                changed_by_id=user.id,
            ))
        setattr(milestone, field, new_value)

    db.commit()
    db.refresh(milestone)
    return milestone


@router.delete("/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(milestone_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    milestone = _get_milestone_or_404(db, milestone_id)
    student = _get_student_or_404(db, milestone.student_id)
    if not can_edit_milestone(db, user, student):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to remove milestones for this student")
    db.delete(milestone)
    db.commit()
