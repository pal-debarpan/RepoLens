import pytest
from app.services.demo_fixture import (
    get_demo_analysis,
    get_demo_chat_response,
    DEMO_ANALYSIS_ID,
    DEMO_REPO_URL,
    DEMO_FINDINGS,
    DEMO_QUALITY,
    DEMO_TESTING,
)
from app.models.analysis import AnalysisStatus


def test_get_demo_analysis_structure():
    analysis = get_demo_analysis()
    assert analysis.id == DEMO_ANALYSIS_ID
    assert analysis.status == AnalysisStatus.COMPLETED
    assert analysis.primary_language == "javascript"
    assert analysis.quality_score == 72.4
    assert analysis.blast_radius_max == 72.0
    assert len(analysis.findings) == 4
    assert len(analysis.quality.characteristics) == 9
    assert len(analysis.testing.recommendations) == 4
    assert len(analysis.graph.nodes) == 15


def test_get_demo_chat_response():
    resp = get_demo_chat_response("What is the highest risk file?")
    assert "repolens-demo" in resp.answer.lower()
    assert "src/services/paymentService.js" in resp.referenced_files
    assert resp.model_used == "demo"
