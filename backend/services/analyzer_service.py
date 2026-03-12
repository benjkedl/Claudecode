import anthropic
import sqlite3
import json
from typing import AsyncGenerator

client = anthropic.Anthropic()

ANALYZER_SYSTEM_PROMPT = """You are an expert learning data analyst. You analyze personal learning data from SQL databases
to provide actionable insights about learning patterns, progress, strengths, and areas for improvement.
You use SQL queries to explore data thoroughly before drawing conclusions.
Present findings clearly with specific metrics, trends, and personalized recommendations."""

# Tool definitions for SQL analysis
SQL_TOOLS = [
    {
        "name": "execute_sql",
        "description": "Execute a SQL query on the learning database and return results. Use this to explore the data.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The SQL SELECT query to execute. Only SELECT queries are allowed."
                },
                "description": {
                    "type": "string",
                    "description": "Brief description of what this query is analyzing"
                }
            },
            "required": ["query", "description"]
        }
    },
    {
        "name": "get_schema",
        "description": "Get the database schema to understand available tables and columns.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    }
]


def execute_query(query: str) -> dict:
    """Execute a SQL query safely (SELECT only)."""
    query = query.strip()
    if not query.upper().startswith("SELECT"):
        return {"error": "Only SELECT queries are permitted for security."}

    try:
        conn = sqlite3.connect("./learning_platform.db")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        results = [dict(row) for row in rows]
        conn.close()
        return {
            "columns": columns,
            "rows": results,
            "row_count": len(results)
        }
    except Exception as e:
        return {"error": str(e)}


def get_db_schema() -> dict:
    """Return the database schema."""
    return {
        "tables": {
            "users": {
                "columns": ["id", "name", "email", "created_at"],
                "description": "Registered learners"
            },
            "learning_sessions": {
                "columns": ["id", "user_id", "topic", "duration_minutes", "score", "completed_at", "notes"],
                "description": "Individual study sessions with scores (0-100) and durations"
            },
            "learning_goals": {
                "columns": ["id", "user_id", "title", "description", "target_date", "progress_percent", "status", "created_at"],
                "description": "Learning goals with progress tracking. Status: active, completed, paused"
            },
            "content_items": {
                "columns": ["id", "topic", "content_type", "content", "created_at"],
                "description": "Generated learning content items"
            }
        }
    }


async def analyze_learning_data(user_query: str, user_id: int | None = None) -> AsyncGenerator[str, None]:
    """Use Claude with tool use to analyze learning data and stream insights."""
    context = f"User ID filter: {user_id}" if user_id else "Analyze all users unless query specifies otherwise"

    messages = [
        {
            "role": "user",
            "content": f"""Analyze the learning database to answer this question:

{user_query}

Context: {context}

Use the available tools to query the database and provide detailed insights with:
1. Key metrics and statistics
2. Trends and patterns identified
3. Strengths and improvement areas
4. Specific, actionable recommendations
5. Comparison benchmarks where relevant"""
        }
    ]

    tool_results_collected = []

    # Agentic loop for tool use
    while True:
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            thinking={"type": "adaptive"},
            system=ANALYZER_SYSTEM_PROMPT,
            tools=SQL_TOOLS,
            messages=messages,
        )

        # Collect tool calls and execute them
        tool_use_blocks = []
        text_blocks = []

        for block in response.content:
            if block.type == "tool_use":
                tool_use_blocks.append(block)
            elif block.type == "text":
                text_blocks.append(block)

        # If no tool calls, we're done — stream the final response
        if response.stop_reason == "end_turn" or not tool_use_blocks:
            # Re-run with streaming for the final answer
            final_text = ""
            for block in response.content:
                if block.type == "text":
                    final_text += block.text

            if final_text:
                # Stream the final analysis
                for char in final_text:
                    yield char
            else:
                # Need to get final response via streaming
                messages.append({"role": "assistant", "content": response.content})
                with client.messages.stream(
                    model="claude-opus-4-6",
                    max_tokens=4096,
                    system=ANALYZER_SYSTEM_PROMPT,
                    messages=messages,
                ) as stream:
                    for text in stream.text_stream:
                        yield text
            break

        # Execute tools
        messages.append({"role": "assistant", "content": response.content})

        tool_results = []
        for tool_block in tool_use_blocks:
            if tool_block.name == "execute_sql":
                result = execute_query(tool_block.input["query"])
                result["description"] = tool_block.input.get("description", "")
            elif tool_block.name == "get_schema":
                result = get_db_schema()
            else:
                result = {"error": f"Unknown tool: {tool_block.name}"}

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_block.id,
                "content": json.dumps(result)
            })

        messages.append({"role": "user", "content": tool_results})

        # If we've reached end_turn after tools, stream the synthesis
        if response.stop_reason == "end_turn":
            break
