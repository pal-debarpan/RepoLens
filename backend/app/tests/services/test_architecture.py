import pytest
import networkx as nx
from app.services.architecture import analyze_architecture
from app.models.finding import FindingCategory, FindingSeverity


def test_analyze_architecture_circular_deps():
    G = nx.DiGraph()
    G.add_edge("a.py", "b.py")
    G.add_edge("b.py", "a.py")

    findings = analyze_architecture(G, [])
    assert len(findings) >= 2
    for f in findings:
        assert f.category == FindingCategory.ARCHITECTURE
        assert f.severity == FindingSeverity.HIGH
        assert "circular" in f.title.lower()


def test_analyze_architecture_high_fan_in():
    G = nx.DiGraph()
    # 6 callers importing core.py
    for i in range(6):
        G.add_edge(f"caller_{i}.py", "core.py")

    findings = analyze_architecture(G, [])
    assert len(findings) == 1
    assert "fan-in" in findings[0].title.lower()
    assert findings[0].file_path == "core.py"


def test_analyze_architecture_large_file():
    G = nx.DiGraph()
    scanned_files = [
        {"rel_path": "big_monolith.py", "line_count": 750},
        {"rel_path": "small.py", "line_count": 50},
    ]

    findings = analyze_architecture(G, scanned_files)
    assert len(findings) == 1
    assert findings[0].file_path == "big_monolith.py"
    assert "large monolithic file" in findings[0].title.lower()
