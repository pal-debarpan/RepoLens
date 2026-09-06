from typing import Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User's query about the repository or analysis findings")
    context_file: Optional[str] = Field(None, description="Optional current file context for focused answers")
    history: list[ChatMessage] = Field(default_factory=list, description="Recent conversation turns")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="Assistant's explanation or guidance")
    referenced_files: list[str] = Field(default_factory=list, description="Files referenced in explanation")
    referenced_findings: list[str] = Field(default_factory=list, description="Finding titles or IDs referenced")
    model_used: str = Field("gemini", description="AI model or fallback provider used")
