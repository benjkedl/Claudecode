"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import Badge from "@/components/Badge";
import { api } from "@/lib/api";
import { Concern, StudentSummary, CONCERN_CATEGORY_LABELS } from "@/lib/types";

function ConcernsContent() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Concern[]>(`/api/concerns${statusFilter ? `?status_filter=${statusFilter}` : ""}`),
      api.get<StudentSummary[]>("/api/students"),
    ])
      .then(([c, s]) => {
        setConcerns(c);
        setStudents(s);
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Concerns</h1>
        <p className="text-sm text-slate-500">Every concern raised for a student in your view.</p>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="in_review">In review</option>
        <option value="resolved">Resolved</option>
      </select>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Severity</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Raised</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {concerns.map((c) => {
              const student = students.find((s) => s.id === c.student_id);
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/students/${c.student_id}`} className="font-medium text-teal-700 hover:underline">
                      {student ? `${student.first_name} ${student.last_name}` : `#${c.student_id}`}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{CONCERN_CATEGORY_LABELS[c.category]}</td>
                  <td className="px-4 py-2"><Badge value={c.severity} label={c.severity} /></td>
                  <td className="px-4 py-2"><Badge value={c.status} label={c.status.replace("_", " ")} /></td>
                  <td className="max-w-sm truncate px-4 py-2 text-slate-600">{c.description}</td>
                  <td className="px-4 py-2 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
            {!loading && concerns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">No concerns in view.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ConcernsPage() {
  return (
    <RequireAuth>
      <ConcernsContent />
    </RequireAuth>
  );
}
