# Student Data Source of Truth

A full-stack demo of a canonical student-data application: CUSIS is treated as
the single authoritative source for student personal/enrollment data, and
everything else that currently lives in scattered spreadsheets and shadow
systems — progress milestones, concerns, and faculty role assignments (LIC
Directors, Clerkship Directors, etc.) — is built on top of that one canonical
student record, gated by tiered, role-based permissions.

## Why this exists

This is built directly off the "Student Data Source of Truth" cluster (intake
requests #34, #35, #39, #42, #59, #60, #93) identified in the SOM IT portfolio
relationship analysis: *"authoritative student data in CUSIS and the SCS is
not reliably reaching OASIS, Excel, and Smartsheet. Point fixes here tend to
create the next shadow system."* It also folds in the adjacent **Student
Progress & Concern Tracking** cluster (#15, #18, #19, #38, #63, #67) and the
**Faculty & Teaching Data** cluster (#62, #64, #66), since both depend on the
same canonical student record and the same governed access model rather than
their own point-to-point feeds.

The design choice that follows directly from that analysis: **student
personal/enrollment fields are never hand-edited by downstream consumers.**
They're written once, by a CUSIS sync job, and every other view (progress,
concerns, faculty scope) reads from that same table. Admin/Registrar can
apply an audited manual override for the rare CUSIS data-quality issue, but
that's the exception path, not the normal one — which is exactly the pattern
the analysis found missing across the 56-project intake list.

## Roles & tiered permissions

| Role | Personal info (CUSIS data) | Milestones | Concerns | Faculty appointments | Users |
|---|---|---|---|---|---|
| **Admin** | Audited manual override | Full | Full | Full | Full |
| **Registrar** | Audited manual override, triggers CUSIS sync | View | View | View | View |
| **Program Director** (LIC Director, etc.) | View | Edit, within their program | Edit, within their program | View | View |
| **Advisor** | View | Edit, for their assigned advisees only | Edit, for their assigned advisees only | View | View |
| **Faculty** | View, within their program | View | Can raise; can only edit their own open report | View | View |
| **Viewer** | View | View | View | View | View |

Scoping is enforced server-side (`backend/permissions.py`), not just hidden in
the UI: a Program Director's edit rights follow their active
`FacultyAppointment.program`, and an Advisor's rights follow
`Student.advisor_id`. Every write to CUSIS-sourced fields, and every CUSIS
sync delta, is appended to an audit log visible to Admin/Registrar/Program
Director on the student's page.

## Architecture

```
├── backend/                 # Python FastAPI + SQLAlchemy + SQLite
│   ├── database.py          # Models: User, Student, FacultyAppointment,
│   │                         #   Milestone, Concern, AuditLog, CusisSyncLog
│   ├── auth.py               # JWT auth, password hashing
│   ├── permissions.py        # Tiered access rules, program/advisor scoping
│   ├── schemas.py             # Pydantic request/response models
│   ├── seed.py                 # Demo users, students, milestones, concerns
│   ├── cusis_mock_feed.json     # Simulated nightly CUSIS export
│   └── routers/
│       ├── auth.py, students.py, milestones.py, concerns.py,
│       └── faculty.py, users.py, cusis.py
└── frontend/                # Next.js 14 + TypeScript + Tailwind
    └── src/app/
        ├── login/
        ├── students/, students/[id]/    # Roster + detail (info, milestones, concerns)
        ├── concerns/                     # Cross-student concern queue
        ├── faculty/                      # Faculty appointment / org-chart admin
        └── admin/users/, admin/cusis/    # User & role management, CUSIS sync console
```

### CUSIS sync

`backend/routers/cusis.py` reads `cusis_mock_feed.json` (standing in for a
real CUSIS API/SFTP export) and upserts `Student` rows by CUSIS ID, logging
every field that changed. In production, only the read at the top of
`run_sync()` would change — the upsert, audit trail, and downstream
consumers stay the same. This is what "one authoritative sync" looks like in
place of the five independent Epic/OASIS/CUSIS/Dashfolio access requests the
portfolio analysis flagged.

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+

### Quick start

```bash
chmod +x start.sh
./start.sh
```

### Manual setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. API docs at http://localhost:8000/docs.

### Demo accounts

The backend seeds one account per role on first run (password `password123`
for all):

| Email | Role |
|---|---|
| admin@sot.edu | Admin |
| registrar@sot.edu | Registrar |
| director@sot.edu | Program Director (LIC Director, MD Program) |
| advisor@sot.edu | Advisor (assigned to 3 of the demo students) |
| faculty@sot.edu | Faculty (Clerkship Director, MD Program) |
| viewer@sot.edu | Viewer |

Sign in as `advisor@sot.edu` vs. `admin@sot.edu` to see the roster scope
narrow to just that advisor's assignees. From `admin@sot.edu` or
`registrar@sot.edu`, visit **CUSIS Sync** and click **Run sync now** to see
two new students land and an existing student's phone number update, each
logged in the sync history.
