"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/types";

export default function RequireAuth({
  children,
  allow,
}: {
  children: ReactNode;
  allow?: Role[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className="p-8 text-slate-500">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (allow && !allow.includes(user.role)) {
    return (
      <div className="p-8">
        <p className="text-slate-700">
          Your role ({user.role}) does not have access to this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
