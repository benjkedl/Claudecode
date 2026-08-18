"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { isApiError } from "@/lib/auth";

const DEMO_ACCOUNTS = [
  { email: "admin@sot.edu", role: "Admin" },
  { email: "registrar@sot.edu", role: "Registrar" },
  { email: "director@sot.edu", role: "Program Director (LIC Director)" },
  { email: "advisor@sot.edu", role: "Advisor" },
  { email: "faculty@sot.edu", role: "Faculty" },
  { email: "viewer@sot.edu", role: "Viewer" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(isApiError(err) ? err.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Student Data Source of Truth</h1>
      <p className="mb-8 text-sm text-slate-500">Sign in to continue.</p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="you@sot.edu"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <p className="mb-2 font-medium text-slate-700">Demo accounts (password: password123)</p>
        <ul className="space-y-1">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button
                type="button"
                className="text-teal-700 hover:underline"
                onClick={() => setEmail(a.email)}
              >
                {a.email}
              </button>{" "}
              <span className="text-slate-400">— {a.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
