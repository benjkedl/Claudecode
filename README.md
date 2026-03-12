# LLM Learning Platform

A full-stack AI-powered learning platform with three specialized services built with Claude claude-opus-4-6.

## Services

### 1. Content Generator (`/learn`)
Generate personalized learning materials on any topic:
- **Lessons** — Structured lessons with objectives, examples, and exercises
- **Quizzes** — Multiple choice and open-ended questions
- **Flashcards** — Study cards with hints and tags
- **Summaries** — Quick cheat sheets to deep references

### 2. Data Analyzer (`/analyze`)
Ask questions in plain English about your learning database:
- Claude uses **tool use** to write and execute SQL queries
- Analyzes learning sessions, scores, patterns, and goals
- Surfaces actionable insights with specific metrics
- Pre-seeded with demo data for 3 learners

### 3. Learning Coach (`/coach`)
Three coaching modes:
- **Chat** — Multi-turn conversational coaching with adaptive thinking
- **Learning Plan** — Personalized week-by-week study plans
- **Progress Review** — Honest assessment and next steps

## Architecture

```
├── backend/           # Python FastAPI
│   ├── main.py
│   ├── database.py    # SQLAlchemy + SQLite models
│   ├── services/
│   │   ├── content_service.py   # Streaming content generation
│   │   ├── analyzer_service.py  # SQL tool use + analysis
│   │   └── coach_service.py     # Coaching conversations
│   └── routers/
│       ├── content.py
│       ├── analyzer.py
│       └── coach.py
└── frontend/          # Next.js 14 + TypeScript + Tailwind
    └── src/app/
        ├── page.tsx       # Dashboard
        ├── learn/         # Content Generator
        ├── analyze/       # Data Analyzer
        └── coach/         # Learning Coach
```

## Claude Features Used

- **Streaming** — All LLM responses stream token by token via SSE
- **Adaptive Thinking** — Complex analysis uses `thinking: {type: "adaptive"}`
- **Tool Use** — Data Analyzer uses `execute_sql` and `get_schema` tools
- **Multi-turn Conversations** — Coach chat maintains full conversation history
- **System Prompts** — Each service has a specialized system prompt

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Anthropic API key

### Quick Start

```bash
# Set your API key
echo "ANTHROPIC_API_KEY=your_key_here" > backend/.env

# Start everything
chmod +x start.sh
./start.sh
```

### Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

API docs at http://localhost:8000/docs
