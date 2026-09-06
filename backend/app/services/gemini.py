import logging
from typing import Any

import httpx

from app.core.config import settings
from app.schemas.chat import ChatMessage, ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are RepoLens AI, an expert code analysis assistant.
You help developers understand the findings and insights produced by RepoLens's static analysis engine.
You explain architectural patterns, security risks, blast radius impact, dependency graphs, and code quality issues.
You do NOT calculate scores, graphs, or findings yourself — these are computed deterministically by RepoLens's analysis pipeline.
Keep responses concise, actionable, and grounded in the provided analysis data.
When you reference a file, use its relative path exactly as shown."""


def _build_messages(
    request: ChatRequest,
    analysis_context: dict[str, Any] | None,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    # System instruction payload for Gemini API
    system_instruction = {
        "parts": [{"text": SYSTEM_PROMPT}]
    }

    messages: list[dict[str, Any]] = []

    # Inject analysis context as first message if available
    context_prefix = ""
    if analysis_context:
        context_prefix = (
            f"[Analysis Context]\n"
            f"Repository: {analysis_context.get('repo_name', 'Unknown')}\n"
            f"Quality Score: {analysis_context.get('quality_score', 'N/A')}/100\n"
            f"Blast Radius Max: {analysis_context.get('blast_radius_max', 'N/A')}\n"
            f"Total Files: {analysis_context.get('file_count', 'N/A')}\n"
            f"Total Findings: {analysis_context.get('total_findings', 'N/A')}\n"
        )
        if request.context_file:
            context_prefix += f"Active Focused File: {request.context_file}\n"
        if analysis_context.get("findings_summary"):
            context_prefix += f"Key Findings: {analysis_context.get('findings_summary')}\n"

    # Add conversation history
    for msg in request.history[-8:]:
        role = "user" if msg.role == "user" else "model"
        messages.append({"role": role, "parts": [{"text": msg.content}]})

    # Prepare current user prompt
    current_text = f"{context_prefix}\n\nUser Question: {request.message}" if context_prefix and not messages else request.message
    messages.append({"role": "user", "parts": [{"text": current_text}]})

    return system_instruction, messages


async def chat_with_gemini(
    request: ChatRequest,
    analysis_context: dict[str, Any] | None = None,
) -> ChatResponse:
    """
    Send a chat request to Gemini and return AI-generated explanation.
    Gemini is strictly an explanation/assistant layer — it never calculates scores or graphs.
    Falls back to a helpful mock response if GEMINI_API_KEY is not configured.
    """
    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not configured — using mock chat response")
        return _mock_chat_response(request, analysis_context)

    system_instruction, messages = _build_messages(request, analysis_context)
    primary_model = settings.GEMINI_MODEL or "gemini-3.5-flash"
    candidate_models = [primary_model, "gemini-3.5-flash-lite", "gemini-3.5-flash"]
    
    # Deduplicate while preserving order
    seen = set()
    models_to_try = [m for m in candidate_models if not (m in seen or seen.add(m))]

    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "systemInstruction": system_instruction,
            "contents": messages,
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 1200,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                )
                response.raise_for_status()

            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                continue

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            answer = parts[0].get("text", "").strip() if parts else ""

            if not answer:
                continue

            # Detect referenced files in the reply if context_file or known patterns match
            referenced_files = []
            if request.context_file and request.context_file in answer:
                referenced_files.append(request.context_file)

            return ChatResponse(
                answer=answer,
                referenced_files=referenced_files,
                referenced_findings=[],
                model_used=model,
            )

        except httpx.HTTPStatusError as e:
            logger.warning("Gemini API HTTP error with model %s: %s %s", model, e.response.status_code, e.response.text)
            continue
        except Exception as e:
            logger.warning("Gemini API error with model %s: %s", model, str(e))
            continue

    logger.error("All Gemini model attempts failed. Returning fallback.")
    return _fallback_response(request, analysis_context, "Model connection error")


def _mock_chat_response(
    request: ChatRequest,
    analysis_context: dict[str, Any] | None,
) -> ChatResponse:
    """Return an informative mock response when Gemini is not configured."""
    repo_name = analysis_context.get("repo_name", "the repository") if analysis_context else "the repository"
    quality = analysis_context.get("quality_score", "N/A") if analysis_context else "N/A"

    answer = (
        f"I'm RepoLens AI (running in demo mode — configure GEMINI_API_KEY for live responses).\n\n"
        f"You asked about: **{request.message[:100]}{'...' if len(request.message) > 100 else ''}**\n\n"
        f"Based on the RepoLens static analysis of `{repo_name}` (quality score: {quality}/100):\n\n"
        "The analysis findings shown above are computed deterministically by the RepoLens engine from your codebase.\n"
        "Enable your Gemini API key for intelligent contextual explanations, fix suggestions, and architectural guidance.\n\n"
        "In the meantime, you can explore the Blast Radius panel, Dependency Graph, and Findings for detailed insights."
    )

    return ChatResponse(
        answer=answer,
        referenced_files=[request.context_file] if request.context_file else [],
        referenced_findings=[],
        model_used="mock",
    )


def _fallback_response(
    request: ChatRequest,
    analysis_context: dict[str, Any] | None,
    error: str,
) -> ChatResponse:
    """Return a safe fallback when Gemini call fails."""
    return ChatResponse(
        answer=(
            "I encountered an issue connecting to the AI model. "
            "The RepoLens analysis data is still fully available in the panels above. "
            "Please try again or check your API key configuration."
        ),
        referenced_files=[],
        referenced_findings=[],
        model_used="fallback",
    )
