"""
Simulated CUSIS integration.

In production this module would call the real CUSIS export/API (or read the
nightly SFTP drop) instead of a local JSON fixture. Everything downstream —
the upsert logic, the audit trail, the sync log — stays the same either way,
which is the point: point-to-point fixes into OASIS/Excel/Smartsheet get
replaced by one authoritative sync into this app, and every other view reads
from here.
"""

import json
from datetime import datetime, date
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, Student, CusisSyncLog, AuditLog, SyncStatus
from auth import get_current_user
from permissions import can_trigger_cusis_sync
from schemas import CusisSyncLogOut

router = APIRouter(prefix="/api/cusis", tags=["cusis"])

FEED_PATH = Path(__file__).resolve().parent.parent / "cusis_mock_feed.json"

TRACKED_FIELDS = [
    "first_name", "last_name", "preferred_name", "dob", "email", "phone",
    "address", "program", "cohort_year", "status",
]


@router.get("/sync-log", response_model=list[CusisSyncLogOut])
def get_sync_log(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not can_trigger_cusis_sync(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to view CUSIS sync history")
    return db.query(CusisSyncLog).order_by(CusisSyncLog.started_at.desc()).all()


@router.post("/sync", response_model=CusisSyncLogOut)
def run_sync(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not can_trigger_cusis_sync(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admin or Registrar may trigger a CUSIS sync")

    sync_log = CusisSyncLog(started_at=datetime.utcnow(), triggered_by_id=user.id)
    db.add(sync_log)
    db.flush()

    try:
        with open(FEED_PATH) as f:
            feed = json.load(f)
    except FileNotFoundError:
        sync_log.status = SyncStatus.FAILED
        sync_log.completed_at = datetime.utcnow()
        sync_log.notes = f"Feed file not found at {FEED_PATH}"
        db.commit()
        db.refresh(sync_log)
        return sync_log

    created = 0
    updated = 0

    for record in feed:
        student = db.query(Student).filter(Student.student_id == record["student_id"]).first()

        if student is None:
            student = Student(student_id=record["student_id"])
            db.add(student)
            created += 1
            is_new = True
        else:
            is_new = False

        changed_any = False
        for field in TRACKED_FIELDS:
            if field not in record:
                continue
            new_value = record[field]
            if field == "dob" and new_value:
                new_value = date.fromisoformat(new_value)

            old_value = getattr(student, field, None)
            if old_value != new_value:
                if not is_new:
                    db.add(AuditLog(
                        entity_type="student",
                        entity_id=student.id,
                        field=field,
                        old_value=str(old_value) if old_value is not None else None,
                        new_value=str(new_value) if new_value is not None else None,
                        changed_by_id=None,  # system-originated, not a user edit
                    ))
                setattr(student, field, new_value)
                changed_any = True

        student.cusis_synced_at = datetime.utcnow()
        if not is_new:
            student.manually_overridden = False
            if changed_any:
                updated += 1

    sync_log.status = SyncStatus.SUCCESS
    sync_log.completed_at = datetime.utcnow()
    sync_log.records_processed = len(feed)
    sync_log.records_created = created
    sync_log.records_updated = updated
    sync_log.notes = f"Synced {len(feed)} records from mock CUSIS feed ({created} new, {updated} updated)."

    db.commit()
    db.refresh(sync_log)
    return sync_log
