import Link from "next/link";
import { BookOpen, BarChart2, MessageCircle, ArrowRight, Zap, Brain, Target } from "lucide-react";

const services = [
  {
    href: "/learn",
    icon: BookOpen,
    color: "from-blue-500/20 to-indigo-500/10",
    iconColor: "text-blue-400",
    borderColor: "hover:border-blue-500/50",
    title: "Content Generator",
    description: "Create personalized lessons, quizzes, flashcards, and summaries on any topic using Claude AI.",
    features: ["Custom lessons by level", "Auto-generated quizzes", "Flashcard sets", "Study summaries"],
  },
  {
    href: "/analyze",
    icon: BarChart2,
    color: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
    borderColor: "hover:border-emerald-500/50",
    title: "Data Analyzer",
    description: "Ask questions about your learning data in plain English. Claude queries your SQL database and surfaces actionable insights.",
    features: ["Natural language SQL queries", "Progress analytics", "Pattern detection", "Personalized insights"],
  },
  {
    href: "/coach",
    icon: MessageCircle,
    color: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
    borderColor: "hover:border-violet-500/50",
    title: "Learning Coach",
    description: "Get personalized coaching, structured learning plans, and progress analysis from an AI mentor.",
    features: ["Conversational coaching", "Learning plan builder", "Progress reviews", "Motivation strategies"],
  },
];

const features = [
  { icon: Zap, title: "Real-time Streaming", description: "See AI responses appear word by word for a natural, engaging experience." },
  { icon: Brain, title: "Adaptive Thinking", description: "Claude uses extended reasoning for complex analysis and coaching decisions." },
  { icon: Target, title: "SQL Intelligence", description: "The analyzer uses AI-driven tool use to write and execute SQL queries on your data." },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--background)]">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-500">
            <Zap size={14} /> Powered by Claude claude-opus-4-6 with Adaptive Thinking
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-[var(--text-primary)]">
            Your AI Learning Platform
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-[var(--text-secondary)]">
            Three specialized AI services that generate learning content, analyze your progress data,
            and coach you toward your goals — all powered by Claude.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/learn" className="btn-primary flex items-center gap-2 px-6 py-3 text-base">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link href="/analyze" className="btn-secondary px-6 py-3 text-base">
              View Analytics
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Services */}
        <h2 className="mb-8 text-2xl font-bold text-[var(--text-primary)]">Choose a Service</h2>
        <div className="mb-16 grid gap-6 md:grid-cols-3">
          {services.map(({ href, icon: Icon, color, iconColor, borderColor, title, description, features }) => (
            <Link
              key={href}
              href={href}
              className={`card group cursor-pointer border border-[var(--border)] bg-gradient-to-br ${color} transition-all duration-200 ${borderColor} hover:shadow-lg hover:shadow-black/20`}
            >
              <div className={`mb-4 inline-flex rounded-xl bg-[var(--surface)] p-3 ${iconColor}`}>
                <Icon size={24} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">{description}</p>
              <ul className="space-y-1.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-500 opacity-0 transition group-hover:opacity-100">
                Open service <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>

        {/* Platform features */}
        <div className="border-t border-[var(--border)] pt-12">
          <h2 className="mb-8 text-2xl font-bold text-[var(--text-primary)]">Platform Capabilities</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-[var(--text-primary)]">{title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
