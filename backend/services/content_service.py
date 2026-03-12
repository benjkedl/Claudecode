import anthropic
import json
from typing import AsyncGenerator

client = anthropic.Anthropic()

CONTENT_SYSTEM_PROMPT = """You are an expert educational content creator specializing in personalized learning materials.
You create clear, engaging, and pedagogically sound content tailored to the learner's level and goals.
Structure your content well with clear headings, examples, and actionable exercises."""


async def generate_lesson(topic: str, level: str, style: str) -> AsyncGenerator[str, None]:
    """Stream a full lesson on a topic."""
    prompt = f"""Create a comprehensive learning lesson on: **{topic}**

Learner level: {level}
Learning style preference: {style}

Structure the lesson with:
1. Learning objectives (3-5 clear goals)
2. Core concepts explained with real-world analogies
3. Worked examples (at least 2)
4. Common mistakes to avoid
5. Practice exercises (3 exercises with varying difficulty)
6. Summary and next steps

Make it engaging, practical, and appropriate for the {level} level."""

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=4096,
        thinking={"type": "adaptive"},
        system=CONTENT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text


async def generate_quiz(topic: str, num_questions: int, difficulty: str) -> AsyncGenerator[str, None]:
    """Stream a quiz with multiple choice and open questions."""
    prompt = f"""Create a quiz on: **{topic}**

Number of questions: {num_questions}
Difficulty: {difficulty}

Format as JSON with this structure:
{{
  "title": "Quiz title",
  "topic": "{topic}",
  "difficulty": "{difficulty}",
  "questions": [
    {{
      "id": 1,
      "type": "multiple_choice",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": "A",
      "explanation": "Why A is correct..."
    }},
    {{
      "id": 2,
      "type": "open_ended",
      "question": "...",
      "sample_answer": "...",
      "key_points": ["point1", "point2"]
    }}
  ]
}}

Mix multiple_choice and open_ended questions. Make questions test real understanding, not just memorization."""

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=3000,
        system=CONTENT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text


async def generate_flashcards(topic: str, count: int) -> AsyncGenerator[str, None]:
    """Stream flashcard sets for a topic."""
    prompt = f"""Create {count} flashcards for studying: **{topic}**

Output as JSON:
{{
  "topic": "{topic}",
  "cards": [
    {{
      "id": 1,
      "front": "Question or concept",
      "back": "Answer or explanation",
      "hint": "Optional memory hint",
      "tags": ["tag1", "tag2"]
    }}
  ]
}}

Create cards that:
- Progress from fundamental to advanced concepts
- Use mnemonics where helpful
- Include practical application examples
- Cover key terms, formulas, and concepts"""

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=3000,
        system=CONTENT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text


async def generate_summary(topic: str, depth: str) -> AsyncGenerator[str, None]:
    """Stream a concise study summary."""
    prompt = f"""Create a {depth} study summary for: **{topic}**

Depth levels:
- quick: 1-page cheat sheet with key points only
- medium: Structured overview with main concepts and relationships
- deep: Comprehensive reference covering nuances and edge cases

Depth requested: {depth}

Format with:
- Clear hierarchy (main topics → subtopics)
- Key formulas/rules highlighted
- Visual-friendly structure (tables, lists)
- Memory anchors and patterns
- Cross-references between related concepts"""

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=3000,
        system=CONTENT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text
