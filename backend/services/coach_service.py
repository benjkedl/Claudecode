import anthropic
from typing import AsyncGenerator

client = anthropic.Anthropic()

COACH_SYSTEM_PROMPT = """You are an expert learning coach and mentor with deep expertise in:
- Learning science and cognitive psychology
- Goal setting and achievement strategies (SMART goals, OKRs)
- Study techniques (spaced repetition, active recall, interleaving)
- Motivation and overcoming learning blocks
- Personalized learning path design

Your coaching style is:
- Warm, encouraging, and empathetic
- Direct and actionable — give specific advice, not vague platitudes
- Evidence-based — reference learning research when relevant
- Adaptive — adjust to the learner's emotional state and readiness
- Accountability-focused — help track commitments and follow through

You remember context from the conversation and build on it progressively.
Ask clarifying questions when needed before giving advice."""


async def coach_conversation(
    messages: list[dict],
    user_context: dict | None = None
) -> AsyncGenerator[str, None]:
    """Stream a coaching response based on conversation history."""
    system = COACH_SYSTEM_PROMPT

    if user_context:
        context_str = "\n\nLearner Context:"
        if user_context.get("name"):
            context_str += f"\n- Name: {user_context['name']}"
        if user_context.get("goals"):
            context_str += f"\n- Active Goals: {', '.join(user_context['goals'])}"
        if user_context.get("recent_topics"):
            context_str += f"\n- Recent Study Topics: {', '.join(user_context['recent_topics'])}"
        if user_context.get("avg_score"):
            context_str += f"\n- Average Quiz Score: {user_context['avg_score']:.1f}%"
        system += context_str

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=2048,
        thinking={"type": "adaptive"},
        system=system,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text


async def generate_learning_plan(
    goal: str,
    timeline: str,
    current_level: str,
    available_hours: int
) -> AsyncGenerator[str, None]:
    """Generate a personalized learning plan."""
    prompt = f"""Create a detailed, personalized learning plan for this goal:

**Goal:** {goal}
**Timeline:** {timeline}
**Current Level:** {current_level}
**Available Hours per Week:** {available_hours}

Design a week-by-week learning plan that includes:

1. **Goal Analysis** — Break down what mastery looks like
2. **Prerequisites Check** — What they need to know first
3. **Week-by-Week Schedule** — Specific topics and activities per week
4. **Resource Recommendations** — Books, courses, projects
5. **Milestone Checkpoints** — How to measure progress
6. **Study Techniques** — Best methods for this type of learning
7. **Common Pitfalls** — What to watch out for
8. **Accountability System** — How to stay on track

Make the plan realistic for {available_hours} hours/week over {timeline}."""

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=4096,
        thinking={"type": "adaptive"},
        system=COACH_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text


async def analyze_progress(
    goal: str,
    progress_data: dict
) -> AsyncGenerator[str, None]:
    """Analyze learning progress and provide coaching feedback."""
    prompt = f"""Analyze this learner's progress toward their goal and provide coaching:

**Goal:** {goal}

**Progress Data:**
- Sessions completed: {progress_data.get('sessions', 0)}
- Total study hours: {progress_data.get('hours', 0):.1f}
- Average score: {progress_data.get('avg_score', 0):.1f}%
- Topics covered: {', '.join(progress_data.get('topics', []))}
- Goal progress: {progress_data.get('progress_percent', 0):.0f}%
- Days since started: {progress_data.get('days_active', 0)}

Provide:
1. **Progress Assessment** — Honest evaluation of where they stand
2. **What's Working** — Positive patterns to reinforce
3. **What to Adjust** — Specific changes to improve outcomes
4. **Next Priority Actions** — The 3 most important next steps
5. **Motivational Reframe** — Perspective shift if struggling"""

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=2048,
        system=COACH_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text
