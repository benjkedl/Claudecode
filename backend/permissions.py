"""
Tiered-access rules for the Student Data Source of Truth app.

CUSIS is the system of record for a student's personal/enrollment fields
(database.py:Student). Those fields are only ever written by the sync job
in routers/cusis.py, or an audited manual override by Admin/Registrar -
never directly by Program Directors, Advisors, or Faculty. Everything else
(milestones, concerns, faculty appointments) is scoped by role so each
person can only act on the students they are actually responsible for.
"""

from typing import Optional, Set

from sqlalchemy.orm import Session

from database import User, Role, Student, Concern, FacultyAppointment


def _active_program_scopes(db: Session, user: User) -> Set[str]:
    appointments = (
        db.query(FacultyAppointment)
        .filter(FacultyAppointment.user_id == user.id)
        .all()
    )
    return {a.program for a in appointments if a.is_active}


def visible_student_ids(db: Session, user: User) -> Optional[Set[int]]:
    """Returns None to mean 'all students visible', otherwise the explicit
    set of student ids this user may see."""
    if user.role in (Role.ADMIN, Role.REGISTRAR, Role.VIEWER):
        return None

    ids: Set[int] = set()

    if user.role == Role.ADVISOR:
        ids |= {s.id for s in db.query(Student).filter(Student.advisor_id == user.id)}

    if user.role in (Role.PROGRAM_DIRECTOR, Role.FACULTY):
        scopes = _active_program_scopes(db, user)
        if scopes:
            ids |= {s.id for s in db.query(Student).filter(Student.program.in_(scopes))}

    return ids


def can_view_student(db: Session, user: User, student: Student) -> bool:
    scope = visible_student_ids(db, user)
    return scope is None or student.id in scope


def is_registrar_or_admin(user: User) -> bool:
    return user.role in (Role.ADMIN, Role.REGISTRAR)


def can_edit_milestone(db: Session, user: User, student: Student) -> bool:
    if user.role == Role.ADMIN:
        return True
    if user.role == Role.PROGRAM_DIRECTOR:
        return student.program in _active_program_scopes(db, user)
    if user.role == Role.ADVISOR:
        return student.advisor_id == user.id
    return False


def can_create_concern(db: Session, user: User, student: Student) -> bool:
    if user.role == Role.VIEWER:
        return False
    if user.role in (Role.ADMIN, Role.REGISTRAR):
        return True
    return can_view_student(db, user, student)


def can_edit_concern(db: Session, user: User, concern: Concern, student: Student) -> bool:
    if user.role == Role.ADMIN:
        return True
    if user.role == Role.PROGRAM_DIRECTOR:
        return student.program in _active_program_scopes(db, user)
    if user.role == Role.ADVISOR:
        return student.advisor_id == user.id
    if user.role == Role.FACULTY:
        # Faculty may only amend their own open concern report.
        return concern.raised_by_id == user.id and concern.status.value == "open"
    return False


def can_manage_faculty_appointments(user: User) -> bool:
    return user.role == Role.ADMIN


def can_manage_users(user: User) -> bool:
    return user.role == Role.ADMIN


def can_trigger_cusis_sync(user: User) -> bool:
    return user.role in (Role.ADMIN, Role.REGISTRAR)
