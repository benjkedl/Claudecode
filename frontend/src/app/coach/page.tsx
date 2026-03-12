"use client";
import { useState, useRef, useEffect } from "react";
import NavBar from "@/components/NavBar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamRequest } from "@/lib/api";
import { MessageCircle, Target, TrendingUp, Send, Plus, Loader2, Bot, User } from "lucide-react";

type Tab = "chat" | "plan" | "progress";

interface Message { role: "user" | "assistant"; content: string; }

const STARTER_PROMPTS = [
  "Help me create a 3-month study plan for machine learning",
  "I've been procrastinating on my goals. How do I stay motivated?",
  "What are the best techniques for memorizing technical concepts?",
  "How do I know if I'm learning effectively?",
  "I want to switch to software engineering. Where should I start?",
];

export default function CoachPage() {
  const [tab, setTab] = useState<Tab>("chat");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Plan state
  const [planGoal, setPlanGoal] = useState("");
  const [planTimeline, setPlanTimeline] = useState("3 months");
  const [planLevel, setPlanLevel] = useState("beginner");
  const [planHours, setPlanHours] = useState(10);
  const [planOutput, setPlanOutput] = useState("");
  const [isPlanStreaming, setIsPlanStreaming] = useState(false);

  // Progress state
  const [progressGoal, setProgressGoal] = useState("");
  const [progressSessions, setProgressSessions] = useState(10);
  const [progressHours, setProgressHours] = useState(15);
  const [progressScore, setProgressScore] = useState(78);
  const [progressPercent, setProgressPercent] = useState(45);
  const [progressTopics, setProgressTopics] = useState("Python, Data Structures, Algorithms");
  const [progressOutput, setProgressOutput] = useState("");
  const [isProgressStreaming, setIsProgressStreaming] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isChatStreaming) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setIsChatStreaming(true);

    // Add placeholder for assistant response
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamRequest(
      "/coach/chat",
      { messages: newMessages },
      (chunk) => setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: updated[updated.length - 1].content + chunk,
        };
        return updated;
      }),
      () => setIsChatStreaming(false),
      (err) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: `Error: ${err}` };
          return updated;
        });
        setIsChatStreaming(false);
      }
    );
  };

  const generatePlan = async () => {
    if (!planGoal.trim()) return;
    setPlanOutput("");
    setIsPlanStreaming(true);

    await streamRequest(
      "/coach/learning-plan",
      { goal: planGoal, timeline: planTimeline, current_level: planLevel, available_hours: planHours },
      (chunk) => setPlanOutput((prev) => prev + chunk),
      () => setIsPlanStreaming(false),
      (err) => { setPlanOutput(`Error: ${err}`); setIsPlanStreaming(false); }
    );
  };

  const analyzeProgress = async () => {
    if (!progressGoal.trim()) return;
    setProgressOutput("");
    setIsProgressStreaming(true);

    const progressData = {
      goal: progressGoal,
      progress_data: {
        sessions: progressSessions,
        hours: progressHours,
        avg_score: progressScore,
        topics: progressTopics.split(",").map((t) => t.trim()),
        progress_percent: progressPercent,
        days_active: Math.floor(progressSessions * 1.5),
      },
    };

    // Use the chat endpoint for progress analysis
    await streamRequest(
      "/coach/chat",
      {
        messages: [{
          role: "user",
          content: `Please analyze my learning progress and provide coaching feedback.

Goal: ${progressGoal}
Sessions completed: ${progressSessions}
Total study hours: ${progressHours}
Average score: ${progressScore}%
Topics covered: ${progressTopics}
Overall progress: ${progressPercent}%

Please give me an honest assessment, what's working, what to adjust, and my 3 most important next steps.`
        }]
      },
      (chunk) => setProgressOutput((prev) => prev + chunk),
      () => setIsProgressStreaming(false),
      (err) => { setProgressOutput(`Error: ${err}`); setIsProgressStreaming(false); }
    );
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-[var(--text-primary)]">Learning Coach</h1>
          <p className="text-[var(--text-secondary)]">
            Get personalized coaching, structured learning plans, and progress analysis from your AI mentor.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
          {[
            { id: "chat" as Tab, label: "Coach Chat", icon: MessageCircle },
            { id: "plan" as Tab, label: "Learning Plan", icon: Target },
            { id: "progress" as Tab, label: "Progress Review", icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                tab === id
                  ? "bg-violet-500/10 text-violet-400"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Chat Tab */}
        {tab === "chat" && (
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="card">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                    <Bot size={28} />
                  </div>
                  <h3 className="mb-1 font-semibold text-[var(--text-primary)]">Your AI Learning Coach</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Ask me anything about learning, study strategies, or your goals.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="rounded-lg border border-[var(--border)] px-3 py-2.5 text-left text-sm text-[var(--text-secondary)] transition hover:border-violet-500/50 hover:text-[var(--text-primary)]"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="card space-y-4 max-h-[500px] overflow-y-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      msg.role === "assistant" ? "bg-violet-500/10 text-violet-400" : "bg-primary-500/10 text-primary-500"
                    }`}>
                      {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary-500/10 text-[var(--text-primary)]"
                        : "bg-[var(--surface-2)] text-[var(--text-primary)]"
                    } ${msg.role === "assistant" && isChatStreaming && i === messages.length - 1 && msg.content === "" ? "streaming-cursor" : ""}`}>
                      {msg.role === "assistant" ? (
                        <div className={`prose prose-sm prose-invert max-w-none ${isChatStreaming && i === messages.length - 1 && !msg.content ? "streaming-cursor" : ""}`}>
                          {msg.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown> : (
                            <span className="streaming-cursor" />
                          )}
                        </div>
                      ) : msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            <div className="flex gap-3">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="btn-secondary flex items-center gap-2"
                  title="New conversation"
                >
                  <Plus size={16} />
                </button>
              )}
              <input
                className="input flex-1"
                placeholder="Ask your coach anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                disabled={isChatStreaming}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isChatStreaming || !input.trim()}
                className="btn-primary flex items-center gap-2 px-5"
                style={{ background: "#8b5cf6" }}
              >
                {isChatStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* Learning Plan Tab */}
        {tab === "plan" && (
          <div className="space-y-4">
            <div className="card space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Learning Goal</label>
                <input
                  className="input"
                  placeholder="e.g., Become a proficient machine learning engineer"
                  value={planGoal}
                  onChange={(e) => setPlanGoal(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Timeline</label>
                  <select className="select" value={planTimeline} onChange={(e) => setPlanTimeline(e.target.value)}>
                    {["1 month", "3 months", "6 months", "1 year"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Current Level</label>
                  <select className="select" value={planLevel} onChange={(e) => setPlanLevel(e.target.value)}>
                    {["beginner", "intermediate", "advanced"].map((l) => (
                      <option key={l} value={l} className="capitalize">{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                    Hours/Week: {planHours}
                  </label>
                  <input
                    type="range" min={2} max={40} value={planHours}
                    onChange={(e) => setPlanHours(Number(e.target.value))}
                    className="w-full accent-violet-500 mt-2"
                  />
                </div>
              </div>
              <button
                onClick={generatePlan}
                disabled={isPlanStreaming || !planGoal.trim()}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3"
                style={{ background: "#8b5cf6" }}
              >
                {isPlanStreaming ? (
                  <><Loader2 size={18} className="animate-spin" /> Building your plan...</>
                ) : (
                  <><Target size={18} /> Generate Learning Plan</>
                )}
              </button>
            </div>
            {planOutput && (
              <div className={`card streaming-text ${isPlanStreaming ? "streaming-cursor" : ""}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{planOutput}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Progress Review Tab */}
        {tab === "progress" && (
          <div className="space-y-4">
            <div className="card space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Your Learning Goal</label>
                <input
                  className="input"
                  placeholder="e.g., Master Python for data science"
                  value={progressGoal}
                  onChange={(e) => setProgressGoal(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Topics Studied</label>
                  <input
                    className="input"
                    placeholder="Python, Data Structures, Algorithms"
                    value={progressTopics}
                    onChange={(e) => setProgressTopics(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                    Overall Progress: {progressPercent}%
                  </label>
                  <input
                    type="range" min={0} max={100} value={progressPercent}
                    onChange={(e) => setProgressPercent(Number(e.target.value))}
                    className="w-full accent-violet-500 mt-2"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Sessions", value: progressSessions, setter: setProgressSessions, min: 1, max: 200 },
                  { label: `Study Hours: ${progressHours}`, value: progressHours, setter: setProgressHours, min: 1, max: 500 },
                  { label: `Avg Score: ${progressScore}%`, value: progressScore, setter: setProgressScore, min: 0, max: 100 },
                ].map(({ label, value, setter, min, max }) => (
                  <div key={label}>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">{label}</label>
                    <input
                      type="range" min={min} max={max} value={value}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="w-full accent-violet-500"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={analyzeProgress}
                disabled={isProgressStreaming || !progressGoal.trim()}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3"
                style={{ background: "#8b5cf6" }}
              >
                {isProgressStreaming ? (
                  <><Loader2 size={18} className="animate-spin" /> Analyzing progress...</>
                ) : (
                  <><TrendingUp size={18} /> Get Progress Review</>
                )}
              </button>
            </div>
            {progressOutput && (
              <div className={`card streaming-text ${isProgressStreaming ? "streaming-cursor" : ""}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{progressOutput}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
