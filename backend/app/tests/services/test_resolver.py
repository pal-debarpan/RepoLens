"""Tests for the resolver service."""
import pytest
from app.services.resolver import resolve_import


ALL_FILES = {
    "src/main.py",
    "src/utils.py",
    "src/models/__init__.py",
    "src/models/user.py",
    "src/services/auth.py",
    "src/index.js",
    "src/utils/logger.js",
    "src/components/Button.tsx",
    "main.go",
    "pkg/database/db.go",
}


def test_resolve_python_dotted_local():
    result = resolve_import("src/main.py", "src.utils", ALL_FILES, "python")
    assert result.is_local
    assert result.resolved_path == "src/utils.py"


def test_resolve_python_package_init():
    result = resolve_import("src/main.py", "src.models", ALL_FILES, "python")
    assert result.is_local
    assert result.resolved_path == "src/models/__init__.py"


def test_resolve_python_submodule():
    result = resolve_import("src/main.py", "src.models.user", ALL_FILES, "python")
    assert result.is_local
    assert result.resolved_path == "src/models/user.py"


def test_resolve_python_external():
    result = resolve_import("src/main.py", "fastapi", ALL_FILES, "python")
    assert not result.is_local
    assert result.is_external


def test_resolve_js_relative_explicit():
    result = resolve_import("src/index.js", "./utils/logger", ALL_FILES, "javascript")
    assert result.is_local
    assert result.resolved_path == "src/utils/logger.js"


def test_resolve_js_relative_up():
    result = resolve_import("src/utils/logger.js", "../index", ALL_FILES, "javascript")
    assert result.is_local
    assert result.resolved_path == "src/index.js"


def test_resolve_js_node_module():
    result = resolve_import("src/index.js", "react", ALL_FILES, "javascript")
    assert not result.is_local
    assert result.is_external


def test_resolve_tsx_relative():
    result = resolve_import("src/components/Button.tsx", "../utils/logger", ALL_FILES, "typescript")
    assert result.is_local


def test_resolve_go_package():
    result = resolve_import("main.go", "pkg/database", ALL_FILES, "go")
    assert result.is_local


def test_resolve_go_stdlib():
    result = resolve_import("main.go", "fmt", ALL_FILES, "go")
    assert not result.is_local
    assert result.is_external


def test_resolve_nonexistent_local():
    result = resolve_import("src/main.py", "./nonexistent_module", ALL_FILES, "python")
    assert not result.is_local
