"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { StudentSummary, Concern, ROLE_LABELS } from "@/lib/types";
import Badge from "@/components/Badge";

function DashboardContent() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get<StudentSummary[]>("/api/students"), api.get<Concern[]>("/api/concerns")])
      .then(([s, c]) => {
        setStudents(s);
        setConcerns(c);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading...</p>;

  const openConcerns = concerns.filter((c) => c.status !== "resolved");
  const highSeverity = openConcerns.filter((c) => c.severity === "high");
  const atRiskStudents = students.filter((s) => s.at_risk_milestone_count > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome, {user?.name}
        </h1>
        <p className="text-sm text-slate-500">
          Signed in as {user && ROLE_LABELS[user.role]}. You are seeing the students, concerns,
          and milestones your role is scoped to.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/students" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-teal-300">
          <p className="text-sm text-slate-500">Students in view</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{students.length}</p>
        </Link>
        <Link href="/concerns" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-teal-300">
          <p className="text-sm text-slate-500">Open concerns</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{openConcerns.length}</p>
          {highSeverity.length > 0 && (
            <p className="mt-1 text-xs text-rose-600">{highSeverity.length} high severity</p>
          )}
        </Link>
        <Link href="/students" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-teal-300">
          <p className="text-sm text-slate-500">Students with at-risk milestones</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{atRiskStudents.length}</p>
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-medium text-slate-900">Most recent open concerns</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {openConcerns.slice(0, 6).map((c) => {
            const student = students.find((s) => s.id === c.student_id);
            return (
              <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <Link href={`/students/${c.student_id}`} className="font-medium text-slate-800 hover:text-teal-700">
                    {student ? `${student.first_name} ${student.last_name}` : `Student #${c.student_id}`}
                  </Link>
                  <p className="text-slate-500">{c.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge value={c.severity} label={c.severity} />
                  <Badge value={c.status} label={c.status.replace("_", " ")} />
                </div>
              </li>
            );
          })}
          {openConcerns.length === 0 && (
            <li className="px-5 py-4 text-sm text-slate-500">No open concerns in view.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
