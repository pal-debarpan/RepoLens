"""Tests for the scanner service."""
import os
import tempfile
from pathlib import Path
import pytest
from app.services.scanner import scan_workspace, is_binary_file, IGNORED_DIRS


def create_temp_repo(files: dict[str, str]) -> Path:
    """Create a temporary directory with given files."""
    tmp = Path(tempfile.mkdtemp())
    for rel_path, content in files.items():
        full_path = tmp / rel_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content, encoding="utf-8")
    return tmp


def test_scan_basic_structure():
    root = create_temp_repo({
        "src/main.py": "print('hello')",
        "src/utils.py": "pass",
        "README.md": "# Docs",
        "package.json": '{"name":"test"}',
    })
    try:
        files = scan_workspace(root)
        paths = [f.rel_path for f in files]
        assert "src/main.py" in paths
        assert "src/utils.py" in paths
        assert "README.md" in paths
    finally:
        import shutil
        shutil.rmtree(root, ignore_errors=True)


def test_scan_ignores_node_modules():
    root = create_temp_repo({
        "src/app.js": "const x = 1;",
        "node_modules/lodash/index.js": "// lodash",
    })
    try:
        files = scan_workspace(root)
        paths = [f.rel_path for f in files]
        assert "src/app.js" in paths
        assert not any("node_modules" in p for p in paths)
    finally:
        import shutil
        shutil.rmtree(root, ignore_errors=True)


def test_scan_ignores_pycache():
    root = create_temp_repo({
        "app/main.py": "pass",
        "__pycache__/main.cpython-311.pyc": "not real",
    })
    try:
        files = scan_workspace(root)
        paths = [f.rel_path for f in files]
        assert "app/main.py" in paths
        assert not any("__pycache__" in p for p in paths)
    finally:
        import shutil
        shutil.rmtree(root, ignore_errors=True)


def test_scan_file_language_detection():
    root = create_temp_repo({
        "src/app.py": "import os",
        "src/index.ts": "const x: number = 1;",
        "main.go": "package main",
        "App.java": "public class App {}",
    })
    try:
        files = scan_workspace(root)
        lang_map = {f.rel_path: f.language for f in files}
        assert lang_map.get("src/app.py") == "python"
        assert lang_map.get("src/index.ts") == "typescript"
        assert lang_map.get("main.go") == "go"
        assert lang_map.get("App.java") == "java"
    finally:
        import shutil
        shutil.rmtree(root, ignore_errors=True)


def test_scan_code_flag():
    root = create_temp_repo({
        "src/main.py": "pass",
        "README.md": "# docs",
    })
    try:
        files = scan_workspace(root)
        file_map = {f.rel_path: f for f in files}
        assert file_map["src/main.py"].is_code is True
        assert file_map["README.md"].is_code is False
    finally:
        import shutil
        shutil.rmtree(root, ignore_errors=True)


def test_scan_nonexistent_dir():
    result = scan_workspace("/nonexistent/path/xyz")
    assert result == []


def test_scan_line_counts():
    root = create_temp_repo({
        "three_lines.py": "a = 1\nb = 2\nc = 3",
    })
    try:
        files = scan_workspace(root)
        assert files[0].line_count == 3
    finally:
        import shutil
        shutil.rmtree(root, ignore_errors=True)
