"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { useParams } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import Badge from "@/components/Badge";
import { useAuth, isApiError } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  Student,
  Milestone,
  Concern,
  User,
  AuditLogEntry,
  STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
  CONCERN_CATEGORY_LABELS,
} from "@/lib/types";

const EDITABLE_FIELDS: { key: string; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "preferred_name", label: "Preferred Name" },
];

function userName(users: User[], id?: number | null) {
  if (!id) return "Unassigned";
  return users.find((u) => u.id === id)?.name ?? `User #${id}`;
}

function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [audit, setAudit] = useState<AuditLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      api.get<Student>(`/api/students/${id}`),
      api.get<Milestone[]>(`/api/milestones?student_id=${id}`),
      api.get<Concern[]>(`/api/concerns?student_id=${id}`),
      api.get<User[]>("/api/users"),
    ])
      .then(([s, m, c, u]) => {
        setStudent(s);
        setMilestones(m);
        setConcerns(c);
        setUsers(u);
      })
      .catch((e) => setError(isApiError(e) ? e.message : "Failed to load student"));

    api
      .get<AuditLogEntry[]>(`/api/students/${id}/audit`)
      .then(setAudit)
      .catch(() => setAudit(null));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction<T>(fn: () => Promise<T>) {
    setActionError(null);
    try {
      await fn();
      load();
    } catch (e) {
      setActionError(isApiError(e) ? e.message : "Action failed");
    }
  }

  if (error) return <p className="text-rose-600">{error}</p>;
  if (!student || !user) return <p className="text-slate-500">Loading...</p>;

  const canEditPersonalInfo = user.role === "admin" || user.role === "registrar";
  const canAssignAdvisor = user.role === "admin" || user.role === "registrar" || user.role === "program_director";
  const canActOnRecords = user.role !== "viewer";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {student.first_name} {student.last_name}
        </h1>
        <p className="text-sm text-slate-500">
          {student.student_id} · {student.program} · Class of {student.cohort_year}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Badge value={student.status} label={STATUS_LABELS[student.status]} />
          {student.manually_overridden && (
            <Badge value="medium" label="Manually overridden since last CUSIS sync" />
          )}
        </div>
      </div>

      {actionError && (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</p>
      )}

      <PersonalInfoCard
        student={student}
        canEdit={canEditPersonalInfo}
        onOverride={(field, value, reason) =>
          runAction(() => api.patch(`/api/students/${id}/override`, { field, value, reason }))
        }
      />

      <AdvisorCard
        student={student}
        users={users}
        canAssign={canAssignAdvisor}
        onAssign={(advisorId) => runAction(() => api.patch(`/api/students/${id}/advisor`, { advisor_id: advisorId }))}
      />

      <MilestonesCard
        milestones={milestones}
        users={users}
        canAct={canActOnRecords}
        studentId={student.id}
        onCreate={(payload) => runAction(() => api.post("/api/milestones", payload))}
        onUpdate={(mid, payload) => runAction(() => api.patch(`/api/milestones/${mid}`, payload))}
      />

      <ConcernsCard
        concerns={concerns}
        users={users}
        canAct={canActOnRecords}
        studentId={student.id}
        onCreate={(payload) => runAction(() => api.post("/api/concerns", payload))}
        onUpdate={(cid, payload) => runAction(() => api.patch(`/api/concerns/${cid}`, payload))}
      />

      {audit && audit.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-medium text-slate-900">CUSIS / edit audit trail</h2>
          </div>
          <ul className="divide-y divide-slate-100 text-sm">
            {audit.map((a) => (
              <li key={a.id} className="px-5 py-2">
                <span className="text-slate-500">{new Date(a.changed_at).toLocaleString()}</span>{" "}
                — <span className="font-medium">{a.field}</span> changed from{" "}
                <span className="text-slate-500">{a.old_value ?? "—"}</span> to{" "}
                <span className="text-slate-700">{a.new_value ?? "—"}</span>{" "}
                {a.changed_by_id ? `by ${userName(users, a.changed_by_id)}` : "via CUSIS sync"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PersonalInfoCard({
  student,
  canEdit,
  onOverride,
}: {
  student: Student;
  canEdit: boolean;
  onOverride: (field: string, value: string, reason: string) => void;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");

  function startEdit(field: string, current: string) {
    setEditingField(field);
    setValue(current);
    setReason("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!editingField) return;
    onOverride(editingField, value, reason);
    setEditingField(null);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <h2 className="font-medium text-slate-900">Personal information (CUSIS source of truth)</h2>
        <span className="text-xs text-slate-400">
          {student.cusis_synced_at ? `Last synced ${new Date(student.cusis_synced_at).toLocaleString()}` : "Never synced"}
        </span>
      </div>
      <dl className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2">
        {EDITABLE_FIELDS.map(({ key, label }) => {
          const current = (student as unknown as Record<string, string | null | undefined>)[key] ?? "";
          return (
            <div key={key}>
              <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
              {editingField === key ? (
                <form onSubmit={submit} className="mt-1 space-y-1">
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    placeholder="Reason for override (audit-logged)"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="rounded bg-teal-700 px-2 py-1 text-xs text-white">Save</button>
                    <button type="button" onClick={() => setEditingField(null)} className="rounded border px-2 py-1 text-xs">Cancel</button>
                  </div>
                </form>
              ) : (
                <dd className="mt-1 flex items-center justify-between text-sm text-slate-800">
                  <span>{current || "—"}</span>
                  {canEdit && (
                    <button onClick={() => startEdit(key, current)} className="ml-2 text-xs text-teal-700 hover:underline">
                      Override
                    </button>
                  )}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </div>
  );
}

function AdvisorCard({
  student,
  users,
  canAssign,
  onAssign,
}: {
  student: Student;
  users: User[];
  canAssign: boolean;
  onAssign: (advisorId: number | null) => void;
}) {
  const advisors = users.filter((u) => u.role === "advisor");
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
      <h2 className="mb-2 font-medium text-slate-900">Assigned advisor</h2>
      {canAssign ? (
        <select
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          value={student.advisor_id ?? ""}
          onChange={(e) => onAssign(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Unassigned</option>
          {advisors.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      ) : (
        <p className="text-sm text-slate-700">{userName(users, student.advisor_id)}</p>
      )}
    </div>
  );
}

function MilestonesCard({
  milestones,
  users,
  canAct,
  studentId,
  onCreate,
  onUpdate,
}: {
  milestones: Milestone[];
  users: User[];
  canAct: boolean;
  studentId: number;
  onCreate: (payload: Record<string, unknown>) => void;
  onUpdate: (id: number, payload: Record<string, unknown>) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState("");
  const [targetDate, setTargetDate] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onCreate({ student_id: studentId, milestone_type: type, target_date: targetDate || null });
    setType("");
    setTargetDate("");
    setAdding(false);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <h2 className="font-medium text-slate-900">Progress & milestones</h2>
        {canAct && (
          <button onClick={() => setAdding((v) => !v)} className="text-xs text-teal-700 hover:underline">
            {adding ? "Cancel" : "+ Add milestone"}
          </button>
        )}
      </div>
      {adding && (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-2 border-b border-slate-100 px-5 py-3">
          <div>
            <label className="block text-xs text-slate-500">Milestone</label>
            <input required value={type} onChange={(e) => setType(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Target date</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <button type="submit" className="rounded bg-teal-700 px-3 py-1 text-xs text-white">Add</button>
        </form>
      )}
      <ul className="divide-y divide-slate-100 text-sm">
        {milestones.map((m) => (
          <li key={m.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="font-medium text-slate-800">{m.milestone_type}</p>
              <p className="text-xs text-slate-500">
                {m.target_date ? `Target: ${m.target_date}` : "No target date"}
                {m.completed_date ? ` · Completed: ${m.completed_date}` : ""}
                {m.notes ? ` · ${m.notes}` : ""}
                {m.recorded_by_id ? ` · Recorded by ${userName(users, m.recorded_by_id)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge value={m.status} label={MILESTONE_STATUS_LABELS[m.status]} />
              {canAct && (
                <select
                  value={m.status}
                  onChange={(e) => onUpdate(m.id, { status: e.target.value })}
                  className="rounded border border-slate-300 px-1 py-0.5 text-xs"
                >
                  {Object.entries(MILESTONE_STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              )}
            </div>
          </li>
        ))}
        {milestones.length === 0 && <li className="px-5 py-4 text-slate-500">No milestones recorded.</li>}
      </ul>
    </div>
  );
}

function ConcernsCard({
  concerns,
  users,
  canAct,
  studentId,
  onCreate,
  onUpdate,
}: {
  concerns: Concern[];
  users: User[];
  canAct: boolean;
  studentId: number;
  onCreate: (payload: Record<string, unknown>) => void;
  onUpdate: (id: number, payload: Record<string, unknown>) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState("academic");
  const [severity, setSeverity] = useState("low");
  const [description, setDescription] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onCreate({ student_id: studentId, category, severity, description });
    setDescription("");
    setAdding(false);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <h2 className="font-medium text-slate-900">Concerns</h2>
        {canAct && (
          <button onClick={() => setAdding((v) => !v)} className="text-xs text-teal-700 hover:underline">
            {adding ? "Cancel" : "+ Raise concern"}
          </button>
        )}
      </div>
      {adding && (
        <form onSubmit={submit} className="space-y-2 border-b border-slate-100 px-5 py-3">
          <div className="flex gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm">
              {Object.entries(CONCERN_CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the concern"
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
            rows={2}
          />
          <button type="submit" className="rounded bg-teal-700 px-3 py-1 text-xs text-white">Submit</button>
        </form>
      )}
      <ul className="divide-y divide-slate-100 text-sm">
        {concerns.map((c) => (
          <li key={c.id} className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge value={c.category} label={CONCERN_CATEGORY_LABELS[c.category]} />
                <Badge value={c.severity} label={c.severity} />
                <Badge value={c.status} label={c.status.replace("_", " ")} />
              </div>
              {canAct && c.status !== "resolved" && (
                <select
                  value={c.status}
                  onChange={(e) => onUpdate(c.id, { status: e.target.value })}
                  className="rounded border border-slate-300 px-1 py-0.5 text-xs"
                >
                  <option value="open">Open</option>
                  <option value="in_review">In review</option>
                  <option value="resolved">Resolved</option>
                </select>
              )}
            </div>
            <p className="mt-1 text-slate-700">{c.description}</p>
            <p className="mt-1 text-xs text-slate-400">
              Raised by {userName(users, c.raised_by_id)}
              {c.assigned_to_id ? ` · Assigned to ${userName(users, c.assigned_to_id)}` : ""}
              {" · "}
              {new Date(c.created_at).toLocaleDateString()}
            </p>
            {c.resolution_notes && <p className="mt-1 text-xs text-slate-500">Resolution: {c.resolution_notes}</p>}
          </li>
        ))}
        {concerns.length === 0 && <li className="px-5 py-4 text-slate-500">No concerns on file.</li>}
      </ul>
    </div>
  );
}

export default function StudentDetailPage() {
  return (
    <RequireAuth>
      <StudentDetail />
    </RequireAuth>
  );
}
