"use client";

import { useEffect, useState, FormEvent } from "react";
import RequireAuth from "@/components/RequireAuth";
import { isApiError } from "@/lib/auth";
import { api } from "@/lib/api";
import { User, Role, ROLE_LABELS } from "@/lib/types";

const ROLES: Role[] = ["admin", "registrar", "program_director", "advisor", "faculty", "viewer"];

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("viewer");

  const load = () => api.get<User[]>("/api/users").then(setUsers);
  useEffect(() => {
    load();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/api/users", { name, email, password, role });
      setAdding(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("viewer");
      load();
    } catch (e) {
      setError(isApiError(e) ? e.message : "Failed to create user");
    }
  }

  async function changeRole(id: number, newRole: Role) {
    try {
      await api.patch(`/api/users/${id}`, { role: newRole });
      load();
    } catch (e) {
      setError(isApiError(e) ? e.message : "Failed to update user");
    }
  }

  async function toggleActive(u: User) {
    try {
      await api.patch(`/api/users/${u.id}`, { is_active: !u.is_active });
      load();
    } catch (e) {
      setError(isApiError(e) ? e.message : "Failed to update user");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users & roles</h1>
          <p className="text-sm text-slate-500">Tiered access is enforced by role. Admin only.</p>
        </div>
        <button onClick={() => setAdding((v) => !v)} className="rounded bg-teal-700 px-3 py-2 text-sm text-white">
          {adding ? "Cancel" : "+ New user"}
        </button>
      </div>

      {error && <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {adding && (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <label className="block text-xs text-slate-500">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded border border-slate-300 px-2 py-1 text-sm">
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded bg-teal-700 px-3 py-1 text-sm text-white">Create</button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-2 text-slate-500">{u.email}</td>
                <td className="px-4 py-2">
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value as Role)} className="rounded border border-slate-300 px-2 py-1 text-xs">
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => toggleActive(u)} className={u.is_active ? "text-xs text-slate-600 hover:underline" : "text-xs text-rose-600 hover:underline"}>
                    {u.is_active ? "Active" : "Deactivated"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <RequireAuth allow={["admin"]}>
      <UsersContent />
    </RequireAuth>
  );
}
