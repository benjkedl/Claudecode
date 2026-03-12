"use client";
import { useState } from "react";
import NavBar from "@/components/NavBar";
import StreamingOutput from "@/components/StreamingOutput";
import { streamRequest } from "@/lib/api";
import { BookOpen, FileQuestion, CreditCard, FileText, Loader2 } from "lucide-react";

type ContentType = "lesson" | "quiz" | "flashcards" | "summary";

const contentTypes = [
  { id: "lesson" as ContentType, label: "Lesson", icon: BookOpen, description: "Full structured lesson with examples and exercises" },
  { id: "quiz" as ContentType, label: "Quiz", icon: FileQuestion, description: "Multiple choice and open-ended questions" },
  { id: "flashcards" as ContentType, label: "Flashcards", icon: CreditCard, description: "Study cards with hints and tags" },
  { id: "summary" as ContentType, label: "Summary", icon: FileText, description: "Concise study reference" },
];

export default function LearnPage() {
  const [contentType, setContentType] = useState<ContentType>("lesson");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("intermediate");
  const [style, setStyle] = useState("balanced");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [depth, setDepth] = useState("medium");
  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) { setError("Please enter a topic"); return; }
    setOutput("");
    setError("");
    setIsStreaming(true);

    const endpoints: Record<ContentType, string> = {
      lesson: "/content/lesson",
      quiz: "/content/quiz",
      flashcards: "/content/flashcards",
      summary: "/content/summary",
    };

    const bodies: Record<ContentType, Record<string, unknown>> = {
      lesson: { topic, level, style },
      quiz: { topic, num_questions: numQuestions, difficulty },
      flashcards: { topic, count: flashcardCount },
      summary: { topic, depth },
    };

    await streamRequest(
      endpoints[contentType],
      bodies[contentType],
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
          <h1 className="mb-2 text-3xl font-bold text-[var(--text-primary)]">Content Generator</h1>
          <p className="text-[var(--text-secondary)]">
            Generate personalized learning materials on any topic using Claude AI with adaptive thinking.
          </p>
        </div>

        {/* Content type selector */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {contentTypes.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => setContentType(id)}
              className={`rounded-xl border p-4 text-left transition ${
                contentType === id
                  ? "border-primary-500 bg-primary-500/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-primary-500/50"
              }`}
            >
              <Icon size={20} className={contentType === id ? "text-primary-500" : "text-[var(--text-secondary)]"} />
              <div className="mt-2 font-medium text-[var(--text-primary)]">{label}</div>
              <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{description}</div>
            </button>
          ))}
        </div>

        {/* Configuration */}
        <div className="card space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Topic</label>
            <input
              className="input"
              placeholder="e.g., Quantum computing, Spanish subjunctive, React hooks..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </div>

          {contentType === "lesson" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Level</label>
                <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Learning Style</label>
                <select className="select" value={style} onChange={(e) => setStyle(e.target.value)}>
                  <option value="balanced">Balanced</option>
                  <option value="visual">Visual (diagrams & charts)</option>
                  <option value="conceptual">Conceptual (theory first)</option>
                  <option value="practical">Practical (hands-on)</option>
                </select>
              </div>
            </div>
          )}

          {contentType === "quiz" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                  Number of Questions: {numQuestions}
                </label>
                <input
                  type="range" min={3} max={15} value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Difficulty</label>
                <select className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          )}

          {contentType === "flashcards" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                Number of Cards: {flashcardCount}
              </label>
              <input
                type="range" min={5} max={30} value={flashcardCount}
                onChange={(e) => setFlashcardCount(Number(e.target.value))}
                className="w-full accent-primary-500"
              />
            </div>
          )}

          {contentType === "summary" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Depth</label>
              <select className="select" value={depth} onChange={(e) => setDepth(e.target.value)}>
                <option value="quick">Quick (1-page cheat sheet)</option>
                <option value="medium">Medium (structured overview)</option>
                <option value="deep">Deep (comprehensive reference)</option>
              </select>
            </div>
          )}

          {error && <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={isStreaming || !topic.trim()}
            className="btn-primary flex w-full items-center justify-center gap-2 py-3"
          >
            {isStreaming ? (
              <><Loader2 size={18} className="animate-spin" /> Generating...</>
            ) : (
              `Generate ${contentTypes.find((c) => c.id === contentType)?.label}`
            )}
          </button>
        </div>

        <StreamingOutput text={output} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
