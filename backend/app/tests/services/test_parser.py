"""Tests for the parser service."""
import pytest
from app.services.parser import parse_source_code


def test_parse_python_imports():
    code = b"import os\nimport sys\nfrom pathlib import Path\nfrom app.models import User\n"
    result = parse_source_code("src/main.py", code, "python")
    assert "os" in result.imports
    assert "sys" in result.imports
    assert "pathlib" in result.imports
    assert "app.models" in result.imports


def test_parse_python_definitions():
    code = b"def my_func():\n    pass\n\nclass MyClass:\n    pass\n"
    result = parse_source_code("src/app.py", code, "python")
    assert "my_func" in result.definitions
    assert "MyClass" in result.definitions


def test_parse_javascript_imports():
    code = b"import React from 'react';\nimport { useState } from 'react';\nconst x = require('./utils');\n"
    result = parse_source_code("src/App.jsx", code, "javascript")
    assert "react" in result.imports
    assert "./utils" in result.imports


def test_parse_typescript_imports():
    code = b"import { Component } from '@angular/core';\nimport { HttpClient } from '@angular/common/http';\n"
    result = parse_source_code("src/app.component.ts", code, "typescript")
    assert "@angular/core" in result.imports


def test_parse_go_imports():
    code = b'package main\nimport (\n    "fmt"\n    "net/http"\n)\nfunc main() {}\n'
    result = parse_source_code("main.go", code, "go")
    assert "fmt" in result.imports
    assert "net/http" in result.imports


def test_parse_java_imports():
    code = b"import java.util.List;\nimport java.util.ArrayList;\npublic class App {}\n"
    result = parse_source_code("App.java", code, "java")
    assert "java.util.List" in result.imports


def test_parse_c_includes():
    code = b'#include <stdio.h>\n#include "mylib.h"\nint main() { return 0; }\n'
    result = parse_source_code("main.c", code, "c")
    assert "stdio.h" in result.imports
    assert "mylib.h" in result.imports


def test_parse_unsupported_language_returns_empty():
    code = b"some random content"
    result = parse_source_code("file.rb", code, "ruby")
    assert result.imports == []
    assert result.definitions == []


def test_parse_syntax_error_doesnt_crash():
    code = b"def broken_func(\n    # unclosed paren"
    result = parse_source_code("broken.py", code, "python")
    # Should not raise, just return what it can
    assert isinstance(result.imports, list)


def test_parse_empty_file():
    result = parse_source_code("empty.py", b"", "python")
    assert result.imports == []
    assert result.definitions == []


def test_parse_relative_path_preserved():
    code = b"import os"
    result = parse_source_code("some/deep/path.py", code, "python")
    assert result.rel_path == "some/deep/path.py"
