"use client";
import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import StreamingOutput from "@/components/StreamingOutput";
import { streamRequest, getRequest } from "@/lib/api";
import { BarChart2, Database, Loader2, Lightbulb } from "lucide-react";

interface User { id: number; name: string; email: string; }
interface UserStats {
  user: { id: number; name: string };
  total_sessions: number;
  total_hours: number;
  avg_score: number;
  topics_studied: string[];
  active_goals: number;
  goals: { title: string; progress: number }[];
}

const SAMPLE_QUERIES = [
  "Which topics have the highest average scores across all users?",
  "Who are the most consistent learners based on session frequency?",
  "What is the correlation between study duration and scores?",
  "Which goals have the least progress and might need attention?",
  "Show me a comparison of all users' learning performance",
  "What topics should each user focus on to improve their weakest areas?",
];

export default function AnalyzePage() {
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserStats, setSelectedUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    getRequest<User[]>("/analyzer/users").then(setUsers).catch(console.error);
  }, []);

  const handleUserSelect = async (id: number | null) => {
    setUserId(id);
    setSelectedUserStats(null);
    if (id) {
      const stats = await getRequest<UserStats>(`/analyzer/users/${id}/stats`).catch(() => null);
      setSelectedUserStats(stats);
    }
  };

  const handleAnalyze = async () => {
    if (!query.trim()) { setError("Please enter a question"); return; }
    setOutput("");
    setError("");
    setIsStreaming(true);

    await streamRequest(
      "/analyzer/analyze",
      { query, user_id: userId },
      (chunk) => setOutput((prev) => prev + chunk),
      () => setIsStreaming(false),
      (err) => { setError(err); setIsStreaming(false); }
    );
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-[var(--text-primary)]">Data Analyzer</h1>
          <p className="text-[var(--text-secondary)]">
            Ask questions in plain English. Claude uses tool use to write SQL queries and surface insights from your learning database.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <Database size={18} className="text-emerald-400 flex-shrink-0" />
          <div className="text-sm text-[var(--text-secondary)]">
            Connected to <span className="font-medium text-[var(--text-primary)]">learning_platform.db</span>
            {" — "}Tables: users, learning_sessions, learning_goals, content_items
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left panel: controls */}
          <div className="space-y-4 lg:col-span-1">
            {/* User filter */}
            <div className="card">
              <h3 className="mb-3 font-semibold text-[var(--text-primary)]">Filter by User</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleUserSelect(null)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    userId === null
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-emerald-500/50"
                  }`}
                >
                  All Users
                </button>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleUserSelect(u.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      userId === u.id
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-emerald-500/50"
                    }`}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

            {/* User stats preview */}
            {selectedUserStats && (
              <div className="card space-y-3 text-sm">
                <h3 className="font-semibold text-[var(--text-primary)]">{selectedUserStats.user.name}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Sessions", value: selectedUserStats.total_sessions },
                    { label: "Hours", value: selectedUserStats.total_hours },
                    { label: "Avg Score", value: `${selectedUserStats.avg_score}%` },
                    { label: "Goals", value: selectedUserStats.active_goals },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-[var(--surface-2)] p-2 text-center">
                      <div className="font-bold text-[var(--text-primary)]">{value}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{label}</div>
                    </div>
                  ))}
                </div>
                {selectedUserStats.goals.map((g) => (
                  <div key={g.title}>
                    <div className="mb-1 flex justify-between text-xs text-[var(--text-secondary)]">
                      <span>{g.title}</span><span>{g.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: query */}
          <div className="space-y-4 lg:col-span-2">
            <div className="card space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                  Ask a question about your learning data
                </label>
                <textarea
                  className="input min-h-[100px] resize-y"
                  placeholder="e.g., Which topics should I focus on to improve my weakest areas?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {error && <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>}

              <button
                onClick={handleAnalyze}
                disabled={isStreaming || !query.trim()}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3"
                style={{ background: isStreaming ? undefined : "#10b981" }}
              >
                {isStreaming ? (
                  <><Loader2 size={18} className="animate-spin" /> Analyzing data...</>
                ) : (
                  <><BarChart2 size={18} /> Analyze</>
                )}
              </button>
            </div>

            {/* Sample queries */}
            <div className="card">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                <Lightbulb size={16} /> Sample Questions
              </div>
              <div className="space-y-2">
                {SAMPLE_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuery(q)}
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition hover:border-emerald-500/50 hover:text-[var(--text-primary)]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <StreamingOutput text={output} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
