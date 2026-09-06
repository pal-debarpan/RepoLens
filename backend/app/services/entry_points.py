import re
from pathlib import PurePosixPath

ROUTE_INDICATORS = [
    r"@(?:app|router|api|blueprint)\.(?:get|post|put|delete|patch|options|head|route)",
    r"\b(?:app|router)\.(?:get|post|put|delete|patch|use)\s*\(",
    r"\bexpress\s*\(\s*\)",
    r"\bFastAPI\s*\(\s*\)",
    r"urlpatterns\s*=\s*\[",
    r"if\s+__name__\s*==\s*['\"]__main__['\"]",
    r"func\s+main\s*\(\s*\)",
    r"public\s+static\s+void\s+main\s*\(",
]

COMPILED_ROUTE_REGEX = [re.compile(p) for p in ROUTE_INDICATORS]

ENTRY_POINT_FILENAMES = {
    "main.py", "app.py", "server.py", "wsgi.py", "asgi.py", "manage.py",
    "index.js", "server.js", "app.js", "main.js",
    "index.ts", "server.ts", "app.ts", "main.ts",
    "main.go", "Main.java", "main.c", "main.cpp",
}

ENTRY_POINT_DIR_PREFIXES = (
    "routes/", "api/", "endpoints/", "controllers/", "views/", "pages/", "cmd/",
    "src/routes/", "src/api/", "src/controllers/", "src/pages/",
    "app/api/", "app/routes/", "app/controllers/",
)


def is_entry_point(file_path: str, code_content: str | None = None) -> bool:
    """
    Determine if a file is an entry point (API route, CLI script, or main server file).
    """
    posix_path = PurePosixPath(file_path).as_posix()
    file_name = PurePosixPath(file_path).name

    # 1. Check known entry point filenames
    if file_name in ENTRY_POINT_FILENAMES:
        return True

    # 2. Check route/controller directory structure
    for prefix in ENTRY_POINT_DIR_PREFIXES:
        if posix_path.startswith(prefix) or f"/{prefix}" in posix_path:
            return True

    # 3. Content-based detection if file content is provided
    if code_content:
        for pattern in COMPILED_ROUTE_REGEX:
            if pattern.search(code_content):
                return True

    return False
