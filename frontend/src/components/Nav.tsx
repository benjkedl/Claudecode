"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/types";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/students", label: "Students" },
  { href: "/concerns", label: "Concerns" },
  { href: "/faculty", label: "Faculty Appointments" },
];

export default function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-slate-900">Student Source of Truth</span>
          <div className="flex gap-4 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  pathname === l.href
                    ? "font-medium text-teal-700"
                    : "text-slate-600 hover:text-teal-700"
                }
              >
                {l.label}
              </Link>
            ))}
            {user.role === "admin" && (
              <Link
                href="/admin/users"
                className={
                  pathname === "/admin/users"
                    ? "font-medium text-teal-700"
                    : "text-slate-600 hover:text-teal-700"
                }
              >
                Users
              </Link>
            )}
            {(user.role === "admin" || user.role === "registrar") && (
              <Link
                href="/admin/cusis"
                className={
                  pathname === "/admin/cusis"
                    ? "font-medium text-teal-700"
                    : "text-slate-600 hover:text-teal-700"
                }
              >
                CUSIS Sync
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-600">
            {user.name} · <span className="text-slate-400">{ROLE_LABELS[user.role]}</span>
          </span>
          <button
            onClick={logout}
            className="rounded border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
