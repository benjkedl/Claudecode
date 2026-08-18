from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, FacultyAppointment, User, AuditLog
from auth import get_current_user
from permissions import can_manage_faculty_appointments
from schemas import FacultyAppointmentOut, FacultyAppointmentCreate, FacultyAppointmentUpdate

router = APIRouter(prefix="/api/faculty-appointments", tags=["faculty"])


def _get_or_404(db: Session, appointment_id: int) -> FacultyAppointment:
    a = db.query(FacultyAppointment).filter(FacultyAppointment.id == appointment_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return a


@router.get("", response_model=list[FacultyAppointmentOut])
def list_appointments(program: str | None = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Visible to everyone (it's org-chart information), editable by Admin only.
    query = db.query(FacultyAppointment)
    if program:
        query = query.filter(FacultyAppointment.program == program)
    return query.order_by(FacultyAppointment.program, FacultyAppointment.role_title).all()


@router.post("", response_model=FacultyAppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: FacultyAppointmentCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if not can_manage_faculty_appointments(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admin may create faculty appointments")

    target_user = db.query(User).filter(User.id == payload.user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No such user")

    appointment = FacultyAppointment(**payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    db.add(AuditLog(
        entity_type="faculty_appointment",
        entity_id=appointment.id,
        field="created",
        old_value=None,
        new_value=f"{payload.role_title} / {payload.program} -> user {payload.user_id}",
        changed_by_id=user.id,
    ))
    db.commit()
    return appointment


@router.patch("/{appointment_id}", response_model=FacultyAppointmentOut)
def update_appointment(
    appointment_id: int,
    payload: FacultyAppointmentUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if not can_manage_faculty_appointments(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admin may edit faculty appointments")
    appointment = _get_or_404(db, appointment_id)

    updates = payload.model_dump(exclude_unset=True)
    for field, new_value in updates.items():
        old_value = getattr(appointment, field)
        if old_value != new_value:
            db.add(AuditLog(
                entity_type="faculty_appointment",
                entity_id=appointment.id,
                field=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(new_value) if new_value is not None else None,
                changed_by_id=user.id,
            ))
        setattr(appointment, field, new_value)

    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(appointment_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not can_manage_faculty_appointments(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admin may remove faculty appointments")
    appointment = _get_or_404(db, appointment_id)
    db.delete(appointment)
    db.commit()
