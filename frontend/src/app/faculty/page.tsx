"use client";

import { useEffect, useState, FormEvent } from "react";
import RequireAuth from "@/components/RequireAuth";
import { useAuth, isApiError } from "@/lib/auth";
import { api } from "@/lib/api";
import { FacultyAppointment, User } from "@/lib/types";

function FacultyContent() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<FacultyAppointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<number | "">("");
  const [roleTitle, setRoleTitle] = useState("");
  const [program, setProgram] = useState("");
  const [site, setSite] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const load = () => {
    Promise.all([api.get<FacultyAppointment[]>("/api/faculty-appointments"), api.get<User[]>("/api/users")]).then(
      ([a, u]) => {
        setAppointments(a);
        setUsers(u);
      }
    );
  };

  useEffect(load, []);

  const canManage = user?.role === "admin";

  function userName(id: number) {
    return users.find((u) => u.id === id)?.name ?? `User #${id}`;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/api/faculty-appointments", {
        user_id: userId,
        role_title: roleTitle,
        program,
        site: site || null,
        start_date: startDate,
      });
      setAdding(false);
      setRoleTitle("");
      setProgram("");
      setSite("");
      load();
    } catch (e) {
      setError(isApiError(e) ? e.message : "Failed to create appointment");
    }
  }

  async function removeAppointment(id: number) {
    try {
      await api.del(`/api/faculty-appointments/${id}`);
      load();
    } catch (e) {
      setError(isApiError(e) ? e.message : "Failed to remove appointment");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Faculty appointments</h1>
          <p className="text-sm text-slate-500">
            LIC Directors, Clerkship Directors, Associate Deans, and other named roles, each scoped
            to a program. These scopes drive who can edit which students&apos; progress and concerns.
          </p>
        </div>
        {canManage && (
          <button onClick={() => setAdding((v) => !v)} className="rounded bg-teal-700 px-3 py-2 text-sm text-white">
            {adding ? "Cancel" : "+ New appointment"}
          </button>
        )}
      </div>

      {error && <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {adding && (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <label className="block text-xs text-slate-500">Person</label>
            <select required value={userId} onChange={(e) => setUserId(Number(e.target.value))} className="rounded border border-slate-300 px-2 py-1 text-sm">
              <option value="">Select...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500">Role title</label>
            <input required value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="LIC Director" className="rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Program</label>
            <input required value={program} onChange={(e) => setProgram(e.target.value)} placeholder="MD Program" className="rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Site</label>
            <input value={site} onChange={(e) => setSite(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Start date</label>
            <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <button type="submit" className="rounded bg-teal-700 px-3 py-1 text-sm text-white">Save</button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Person</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Program</th>
              <th className="px-4 py-2">Site</th>
              <th className="px-4 py-2">Start</th>
              <th className="px-4 py-2">Status</th>
              {canManage && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-800">{userName(a.user_id)}</td>
                <td className="px-4 py-2">{a.role_title}</td>
                <td className="px-4 py-2">{a.program}</td>
                <td className="px-4 py-2 text-slate-500">{a.site || "—"}</td>
                <td className="px-4 py-2 text-slate-500">{a.start_date}</td>
                <td className="px-4 py-2">{a.is_active ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2">
                    <button onClick={() => removeAppointment(a.id)} className="text-xs text-rose-600 hover:underline">
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">No appointments recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FacultyPage() {
  return (
    <RequireAuth>
      <FacultyContent />
    </RequireAuth>
  );
}
