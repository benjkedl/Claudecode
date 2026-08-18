from datetime import date, datetime, timedelta

from database import (
    SessionLocal,
    User,
    Student,
    FacultyAppointment,
    Milestone,
    Concern,
    CusisSyncLog,
    Role,
    StudentStatus,
    MilestoneStatus,
    ConcernCategory,
    ConcernSeverity,
    ConcernStatus,
    SyncStatus,
)
from auth import hash_password

DEMO_PASSWORD = "password123"


def seed_db():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return  # already seeded

        admin = User(name="Alice Admin", email="admin@sot.edu", role=Role.ADMIN,
                     hashed_password=hash_password(DEMO_PASSWORD))
        registrar = User(name="Rhonda Registrar", email="registrar@sot.edu", role=Role.REGISTRAR,
                          hashed_password=hash_password(DEMO_PASSWORD))
        director = User(name="Diane Director", email="director@sot.edu", role=Role.PROGRAM_DIRECTOR,
                         hashed_password=hash_password(DEMO_PASSWORD))
        advisor = User(name="Aaron Advisor", email="advisor@sot.edu", role=Role.ADVISOR,
                       hashed_password=hash_password(DEMO_PASSWORD))
        faculty = User(name="Felix Faculty", email="faculty@sot.edu", role=Role.FACULTY,
                       hashed_password=hash_password(DEMO_PASSWORD))
        viewer = User(name="Vera Viewer", email="viewer@sot.edu", role=Role.VIEWER,
                     hashed_password=hash_password(DEMO_PASSWORD))
        db.add_all([admin, registrar, director, advisor, faculty, viewer])
        db.flush()

        db.add_all([
            FacultyAppointment(user_id=director.id, role_title="LIC Director", program="MD Program",
                                site="Main Campus", start_date=date(2023, 7, 1),
                                notes="Longitudinal Integrated Clerkship Director, oversees clinical year."),
            FacultyAppointment(user_id=faculty.id, role_title="Clerkship Director - Internal Medicine",
                                program="MD Program", site="Main Campus", start_date=date(2024, 7, 1)),
            FacultyAppointment(user_id=admin.id, role_title="Associate Dean for Student Affairs",
                                program="MD Program", site="Main Campus", start_date=date(2022, 7, 1)),
        ])

        students_data = [
            dict(student_id="S1001", first_name="Maria", last_name="Chen", program="MD Program",
                 cohort_year=2027, status=StudentStatus.ACTIVE, advisor_id=advisor.id,
                 email="maria.chen@students.sot.edu", phone="555-0101", dob=date(2000, 3, 14)),
            dict(student_id="S1002", first_name="James", last_name="Okafor", program="MD Program",
                 cohort_year=2027, status=StudentStatus.ACTIVE, advisor_id=advisor.id,
                 email="james.okafor@students.sot.edu", phone="555-0102", dob=date(1999, 11, 2)),
            dict(student_id="S1003", first_name="Priya", last_name="Natarajan", program="MD Program",
                 cohort_year=2027, status=StudentStatus.ACTIVE, advisor_id=None,
                 email="priya.natarajan@students.sot.edu", phone="555-0103", dob=date(2000, 6, 21)),
            dict(student_id="S1004", first_name="Lucas", last_name="Bennett", program="MD Program",
                 cohort_year=2028, status=StudentStatus.ACTIVE, advisor_id=advisor.id,
                 email="lucas.bennett@students.sot.edu", phone="555-0104", dob=date(2001, 1, 9)),
            dict(student_id="S1005", first_name="Sofia", last_name="Marin", program="MD Program",
                 cohort_year=2028, status=StudentStatus.LEAVE_OF_ABSENCE, advisor_id=None,
                 email="sofia.marin@students.sot.edu", phone="555-0105", dob=date(2000, 9, 30)),
            dict(student_id="S1006", first_name="Ethan", last_name="Wallace", program="MD Program",
                 cohort_year=2028, status=StudentStatus.ACTIVE, advisor_id=None,
                 email="ethan.wallace@students.sot.edu", phone="555-0106", dob=date(2001, 4, 17)),
            dict(student_id="S1007", first_name="Amara", last_name="Johnson", program="MD Program",
                 cohort_year=2029, status=StudentStatus.ACTIVE, advisor_id=None,
                 email="amara.johnson@students.sot.edu", phone="555-0107", dob=date(2002, 2, 5)),
            dict(student_id="S1008", first_name="Noah", last_name="Kim", program="PA Program",
                 cohort_year=2027, status=StudentStatus.ACTIVE, advisor_id=None,
                 email="noah.kim@students.sot.edu", phone="555-0108", dob=date(1999, 12, 19)),
            dict(student_id="S1009", first_name="Grace", last_name="Liu", program="PA Program",
                 cohort_year=2027, status=StudentStatus.ACTIVE, advisor_id=None,
                 email="grace.liu@students.sot.edu", phone="555-0109", dob=date(2000, 8, 8)),
            dict(student_id="S1010", first_name="Daniel", last_name="Foster", program="MD Program",
                 cohort_year=2027, status=StudentStatus.WITHDRAWN, advisor_id=None,
                 email="daniel.foster@students.sot.edu", phone="555-0110", dob=date(1999, 5, 27)),
        ]
        students = []
        for data in students_data:
            s = Student(**data, cusis_synced_at=datetime.utcnow() - timedelta(days=1))
            db.add(s)
            students.append(s)
        db.flush()

        by_sid = {s.student_id: s for s in students}

        db.add_all([
            Milestone(student_id=by_sid["S1001"].id, milestone_type="USMLE Step 1",
                      status=MilestoneStatus.COMPLETE, target_date=date(2026, 5, 1),
                      completed_date=date(2026, 4, 22), recorded_by_id=director.id,
                      notes="Passed on first attempt."),
            Milestone(student_id=by_sid["S1001"].id, milestone_type="Clerkship: Internal Medicine",
                      status=MilestoneStatus.IN_PROGRESS, target_date=date(2026, 9, 1),
                      recorded_by_id=faculty.id),
            Milestone(student_id=by_sid["S1002"].id, milestone_type="USMLE Step 1",
                      status=MilestoneStatus.AT_RISK, target_date=date(2026, 5, 1),
                      recorded_by_id=advisor.id,
                      notes="Requested a second NBME practice exam; scores trending below threshold."),
            Milestone(student_id=by_sid["S1004"].id, milestone_type="Longitudinal ILP Goal Setting",
                      status=MilestoneStatus.NOT_STARTED, target_date=date(2026, 10, 15),
                      recorded_by_id=advisor.id),
            Milestone(student_id=by_sid["S1005"].id, milestone_type="Clerkship: Internal Medicine",
                      status=MilestoneStatus.AT_RISK, target_date=date(2026, 6, 1),
                      recorded_by_id=director.id,
                      notes="Paused during leave of absence; will need a revised target date on return."),
            Milestone(student_id=by_sid["S1007"].id, milestone_type="Anatomy Practical",
                      status=MilestoneStatus.COMPLETE, target_date=date(2026, 1, 15),
                      completed_date=date(2026, 1, 15), recorded_by_id=director.id),
        ])

        db.add_all([
            Concern(student_id=by_sid["S1002"].id, category=ConcernCategory.ACADEMIC,
                    severity=ConcernSeverity.MEDIUM, status=ConcernStatus.IN_REVIEW,
                    description="NBME practice scores below Step 1 readiness threshold two exams in a row.",
                    raised_by_id=advisor.id, assigned_to_id=director.id),
            Concern(student_id=by_sid["S1005"].id, category=ConcernCategory.WELLBEING,
                    severity=ConcernSeverity.HIGH, status=ConcernStatus.OPEN,
                    description="Student on leave of absence for medical reasons; needs a return-to-clinic plan.",
                    raised_by_id=director.id, assigned_to_id=director.id),
            Concern(student_id=by_sid["S1010"].id, category=ConcernCategory.PROFESSIONALISM,
                    severity=ConcernSeverity.HIGH, status=ConcernStatus.RESOLVED,
                    description="Repeated unexcused absences from clerkship sessions prior to withdrawal.",
                    resolution_notes="Student withdrew from the program; case closed by the Dean's office.",
                    raised_by_id=faculty.id, assigned_to_id=admin.id,
                    resolved_at=datetime.utcnow() - timedelta(days=10)),
            Concern(student_id=by_sid["S1001"].id, category=ConcernCategory.CLINICAL_PERFORMANCE,
                    severity=ConcernSeverity.LOW, status=ConcernStatus.OPEN,
                    description="Preceptor noted inconsistent SOAP note documentation in week 1 of IM clerkship.",
                    raised_by_id=faculty.id, assigned_to_id=advisor.id),
        ])

        db.add(CusisSyncLog(
            started_at=datetime.utcnow() - timedelta(days=1),
            completed_at=datetime.utcnow() - timedelta(days=1),
            status=SyncStatus.SUCCESS,
            records_processed=len(students_data),
            records_created=len(students_data),
            records_updated=0,
            triggered_by_id=registrar.id,
            notes="Initial load from CUSIS.",
        ))

        db.commit()
    finally:
        db.close()
