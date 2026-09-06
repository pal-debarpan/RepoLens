import os
from pathlib import Path
from typing import NamedTuple

IGNORED_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "dist",
    "build",
    ".next",
    ".nuxt",
    ".idea",
    ".vscode",
    "target",
    "bin",
    "obj",
    "coverage",
    ".pytest_cache",
}

BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
    ".exe", ".dll", ".so", ".dylib", ".bin",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".pdf", ".docx", ".xlsx",
    ".pyc", ".pyo", ".pyd", ".class", ".wasm",
    ".ttf", ".woff", ".woff2", ".eot",
    ".mp3", ".mp4", ".wav", ".avi",
}

EXTENSION_TO_LANGUAGE = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".mts": "typescript",
    ".cts": "typescript",
    ".java": "java",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".hpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".go": "go",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".md": "markdown",
    ".html": "html",
    ".css": "css",
}


class ScannedFile(NamedTuple):
    rel_path: str
    abs_path: str
    language: str | None
    is_code: bool
    size_bytes: int
    line_count: int


def is_binary_file(file_path: Path) -> bool:
    """Check if file is binary by extension or null byte presence."""
    if file_path.suffix.lower() in BINARY_EXTENSIONS:
        return True
    try:
        with open(file_path, "rb") as f:
            chunk = f.read(8000)
            if b"\x00" in chunk:
                return True
    except (OSError, PermissionError):
        return True
    return False


def count_lines(file_path: Path) -> int:
    """Safely count lines in a text file."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return sum(1 for _ in f)
    except Exception:
        return 0


def scan_workspace(root_dir: str | Path) -> list[ScannedFile]:
    """
    Recursively scan a repository workspace, filtering out ignored folders and binaries.
    Returns sorted list of ScannedFile objects with relative POSIX-style paths.
    """
    root = Path(root_dir).resolve()
    if not root.exists() or not root.is_dir():
        return []

    scanned_files: list[ScannedFile] = []

    for dirpath, dirnames, filenames in os.walk(root):
        # Mutate dirnames in-place to avoid descending into ignored directories
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS and not d.startswith(".")]

        for filename in filenames:
            file_path = Path(dirpath) / filename
            if file_path.name.startswith(".") and not file_path.name.startswith(".env"):
                continue

            if is_binary_file(file_path):
                continue

            try:
                rel_path = file_path.relative_to(root).as_posix()
                size_bytes = file_path.stat().st_size
                ext = file_path.suffix.lower()
                language = EXTENSION_TO_LANGUAGE.get(ext)
                is_code = language in {
                    "python", "javascript", "typescript", "java", "c", "cpp", "go"
                }
                lines = count_lines(file_path)

                scanned_files.append(
                    ScannedFile(
                        rel_path=rel_path,
                        abs_path=str(file_path),
                        language=language,
                        is_code=is_code,
                        size_bytes=size_bytes,
                        line_count=lines,
                    )
                )
            except (OSError, PermissionError, ValueError):
                continue

    scanned_files.sort(key=lambda f: f.rel_path)
    return scanned_files
