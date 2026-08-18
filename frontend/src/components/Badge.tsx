const COLORS: Record<string, string> = {
  // student status
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  leave_of_absence: "bg-amber-50 text-amber-700 ring-amber-600/20",
  withdrawn: "bg-slate-100 text-slate-600 ring-slate-500/20",
  graduated: "bg-sky-50 text-sky-700 ring-sky-600/20",
  // milestone status
  not_started: "bg-slate-100 text-slate-600 ring-slate-500/20",
  in_progress: "bg-sky-50 text-sky-700 ring-sky-600/20",
  at_risk: "bg-rose-50 text-rose-700 ring-rose-600/20",
  complete: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  // concern status
  open: "bg-rose-50 text-rose-700 ring-rose-600/20",
  in_review: "bg-amber-50 text-amber-700 ring-amber-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  // severity
  low: "bg-slate-100 text-slate-600 ring-slate-500/20",
  medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
  high: "bg-rose-50 text-rose-700 ring-rose-600/20",
  // sync status
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  partial: "bg-amber-50 text-amber-700 ring-amber-600/20",
  failed: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export default function Badge({ value, label }: { value: string; label: string }) {
  const cls = COLORS[value] || "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}
