"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import Badge from "@/components/Badge";
import { isApiError } from "@/lib/auth";
import { api } from "@/lib/api";
import { CusisSyncLog, User } from "@/lib/types";

function CusisContent() {
  const [logs, setLogs] = useState<CusisSyncLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    Promise.all([api.get<CusisSyncLog[]>("/api/cusis/sync-log"), api.get<User[]>("/api/users")]).then(
      ([l, u]) => {
        setLogs(l);
        setUsers(u);
      }
    );
  };

  useEffect(load, []);

  async function runSync() {
    setSyncing(true);
    setError(null);
    try {
      await api.post("/api/cusis/sync");
      load();
    } catch (e) {
      setError(isApiError(e) ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  function userName(id?: number | null) {
    if (!id) return "System";
    return users.find((u) => u.id === id)?.name ?? `User #${id}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">CUSIS sync</h1>
          <p className="text-sm text-slate-500">
            CUSIS is the authoritative source for student personal and enrollment data. Every sync
            upserts students by CUSIS ID and logs any field that changed, so downstream views never
            drift the way they did in OASIS, Excel, and Smartsheet.
          </p>
        </div>
        <button
          onClick={runSync}
          disabled={syncing}
          className="rounded bg-teal-700 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Run sync now"}
        </button>
      </div>

      {error && <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Started</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Processed</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2">Updated</th>
              <th className="px-4 py-2">Triggered by</th>
              <th className="px-4 py-2">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-600">{new Date(l.started_at).toLocaleString()}</td>
                <td className="px-4 py-2"><Badge value={l.status} label={l.status} /></td>
                <td className="px-4 py-2">{l.records_processed}</td>
                <td className="px-4 py-2">{l.records_created}</td>
                <td className="px-4 py-2">{l.records_updated}</td>
                <td className="px-4 py-2">{userName(l.triggered_by_id)}</td>
                <td className="px-4 py-2 text-slate-500">{l.notes}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">No sync history yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CusisPage() {
  return (
    <RequireAuth allow={["admin", "registrar"]}>
      <CusisContent />
    </RequireAuth>
  );
}
