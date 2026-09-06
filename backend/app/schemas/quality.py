from typing import Optional
from pydantic import BaseModel, Field


class QualityCharacteristic(BaseModel):
    name: str = Field(..., description="Characteristic name defined in ISO/IEC 25010:2023")
    standard_reference: str = "ISO/IEC 25010:2023"
    score: float = Field(..., ge=0, le=100, description="Normalized score 0-100")
    status: str = Field(..., description="EXCELLENT, GOOD, NEEDS_IMPROVEMENT, POOR, or LIMITED_EVALUATION")
    description: str = Field(..., description="Characteristic definition and scope")
    findings_count: int = 0
    rationale: str = Field(..., description="Summary of metrics contributing to this characteristic")
    limitations_note: Optional[str] = Field(
        None,
        description="Static analysis boundary or requirement for runtime/human testing",
    )


class QualityResponse(BaseModel):
    overall_score: float = Field(..., ge=0, le=100, description="Composite repository quality score")
    grade: str = Field(..., description="Letter grade: A, B, C, D, or F")
    standard_alignment: str = "Aligned with ISO/IEC 25010:2023 (Product Quality Model)"
    summary: str
    characteristics: list[QualityCharacteristic] = Field(default_factory=list)
    limitations: list[str] = Field(
        default_factory=lambda: [
            "Repolens static analysis aligns with ISO/IEC 25010:2023 software product quality model principles.",
            "Static analysis cannot measure runtime behavior, live performance, user experience, or domain-specific safety without execution.",
            "This assessment does not constitute formal ISO/IEC certification or compliance."
        ]
    )
