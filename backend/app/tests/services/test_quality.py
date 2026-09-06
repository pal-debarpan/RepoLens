"""Tests for quality and findings engines."""
import networkx as nx
import pytest

from app.schemas.finding import FindingCreate
from app.models.finding import FindingCategory, FindingSeverity
from app.services.quality import calculate_quality_score


def _make_finding(cat: FindingCategory, sev: FindingSeverity) -> FindingCreate:
    return FindingCreate(
        category=cat,
        severity=sev,
        title="Test Finding",
        description="Test description",
        file_path="src/test.py",
        line_number=1,
        evidence="some code",
        suggested_fix="fix it",
    )


def _make_scanned_file(path: str, lines: int = 100, is_code: bool = True) -> dict:
    return {
        "rel_path": path,
        "language": "python",
        "line_count": lines,
        "is_code": is_code,
        "is_entry_point": False,
    }


def test_quality_score_no_findings():
    files = [_make_scanned_file(f"src/module{i}.py", 80) for i in range(5)]
    G = nx.DiGraph()
    result = calculate_quality_score(files, [], G)
    assert result.overall_score >= 70.0
    assert result.grade in {"A", "B", "C"}
    assert len(result.characteristics) == 9  # ISO 25010:2023 has 9 characteristics


def test_quality_score_critical_security():
    files = [_make_scanned_file(f"src/module{i}.py", 80) for i in range(5)]
    findings = [_make_finding(FindingCategory.SECURITY, FindingSeverity.CRITICAL) for _ in range(3)]
    G = nx.DiGraph()
    result = calculate_quality_score(files, findings, G)
    # Critical security findings should lower security characteristic significantly
    sec_char = next((c for c in result.characteristics if c.name == "Security"), None)
    assert sec_char is not None
    assert sec_char.score < 50.0


def test_quality_score_range():
    files = [_make_scanned_file(f"src/m{i}.py", 80) for i in range(10)]
    findings = [
        _make_finding(FindingCategory.ARCHITECTURE, FindingSeverity.HIGH),
        _make_finding(FindingCategory.SECURITY, FindingSeverity.MEDIUM),
        _make_finding(FindingCategory.DEPENDENCY, FindingSeverity.LOW),
    ]
    G = nx.DiGraph()
    result = calculate_quality_score(files, findings, G)
    assert 0.0 <= result.overall_score <= 100.0
    assert result.grade in {"A", "B", "C", "D", "F"}


def test_quality_grade_assignment():
    files = [_make_scanned_file("ok.py", 50)]
    G = nx.DiGraph()

    # No findings → expect high score (A or B)
    result = calculate_quality_score(files, [], G)
    assert result.grade in {"A", "B", "C"}

    # Multiple critical findings → expect lower grade
    heavy_findings = [_make_finding(FindingCategory.SECURITY, FindingSeverity.CRITICAL) for _ in range(5)]
    result2 = calculate_quality_score(files, heavy_findings, G)
    assert result2.overall_score < result.overall_score


def test_quality_standard_alignment_text():
    files = [_make_scanned_file("src/app.py", 100)]
    result = calculate_quality_score(files, [], nx.DiGraph())
    assert "ISO/IEC 25010:2023" in result.standard_alignment
    assert all("ISO/IEC 25010:2023" in c.standard_reference for c in result.characteristics)


def test_quality_limitations_present():
    files = [_make_scanned_file("src/app.py", 100)]
    result = calculate_quality_score(files, [], nx.DiGraph())
    assert len(result.limitations) >= 2


def test_quality_large_monolithic_files_affect_score():
    normal_files = [_make_scanned_file(f"src/small{i}.py", 50) for i in range(5)]
    huge_files = [_make_scanned_file(f"src/monolith{i}.py", 1200) for i in range(5)]
    G = nx.DiGraph()

    normal_result = calculate_quality_score(normal_files, [], G)
    huge_result = calculate_quality_score(huge_files, [], G)
    # Large files should lower maintainability/performance scores
    assert huge_result.overall_score <= normal_result.overall_score
