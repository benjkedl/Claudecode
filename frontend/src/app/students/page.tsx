"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import Badge from "@/components/Badge";
import { api } from "@/lib/api";
import { StudentSummary, STATUS_LABELS } from "@/lib/types";

function StudentsContent() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [program, setProgram] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.get<string[]>("/api/students/programs").then(setPrograms);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (program) params.set("program", program);
    if (status) params.set("status_filter", status);
    api
      .get<StudentSummary[]>(`/api/students?${params.toString()}`)
      .then(setStudents)
      .finally(() => setLoading(false));
  }, [q, program, status]);

  const rows = useMemo(() => students, [students]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Students</h1>
        <p className="text-sm text-slate-500">
          Personal and enrollment data is sourced from CUSIS. This roster reflects only the
          students your role is permitted to see.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or student ID"
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Student ID</th>
              <th className="px-4 py-2">Program</th>
              <th className="px-4 py-2">Cohort</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Open Concerns</th>
              <th className="px-4 py-2">At-Risk Milestones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/students/${s.id}`} className="font-medium text-teal-700 hover:underline">
                    {s.first_name} {s.last_name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-500">{s.student_id}</td>
                <td className="px-4 py-2">{s.program}</td>
                <td className="px-4 py-2">{s.cohort_year}</td>
                <td className="px-4 py-2"><Badge value={s.status} label={STATUS_LABELS[s.status]} /></td>
                <td className="px-4 py-2">{s.open_concern_count > 0 ? s.open_concern_count : "—"}</td>
                <td className="px-4 py-2">{s.at_risk_milestone_count > 0 ? s.at_risk_milestone_count : "—"}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No students in view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <RequireAuth>
      <StudentsContent />
    </RequireAuth>
  );
}
