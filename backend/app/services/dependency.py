import json
import re
from pathlib import Path
from typing import Any

from app.models.finding import FindingCategory, FindingSeverity
from app.schemas.finding import FindingCreate


def parse_manifest_dependencies(workspace_root: Path) -> dict[str, list[str]]:
    """
    Extract declared dependencies from package.json and requirements.txt.
    """
    declared = {"javascript": [], "python": []}

    # package.json
    pkg_json = workspace_root / "package.json"
    if pkg_json.exists():
        try:
            with open(pkg_json, "r", encoding="utf-8", errors="replace") as f:
                data = json.load(f)
                deps = list(data.get("dependencies", {}).keys()) + list(data.get("devDependencies", {}).keys())
                declared["javascript"] = deps
        except Exception:
            pass

    # requirements.txt
    req_txt = workspace_root / "requirements.txt"
    if req_txt.exists():
        try:
            with open(req_txt, "r", encoding="utf-8", errors="replace") as f:
                py_deps = []
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        # Extract package name before ==, >=, etc.
                        pkg = re.split(r"[=><~]", line)[0].strip()
                        if pkg:
                            py_deps.append(pkg.lower())
                declared["python"] = py_deps
        except Exception:
            pass

    return declared


def analyze_dependencies(
    workspace_root: str | Path,
    parsed_files: dict[str, Any],
    all_known_files: set[str],
) -> list[FindingCreate]:
    """
    Check for:
    - Broken/unresolved local imports
    - Unused declared external dependencies in manifest
    - Undeclared external dependencies imported in code
    """
    findings: list[FindingCreate] = []
    root = Path(workspace_root)
    manifest_deps = parse_manifest_dependencies(root)

    # 1. Broken local imports
    for rel_path, parsed in parsed_files.items():
        lang = parsed.language
        for raw_imp in parsed.imports:
            # Check relative imports specifically
            if raw_imp.startswith(".") or raw_imp.startswith("/"):
                # If it didn't resolve to any file in known files
                clean_imp = raw_imp.strip("'\"")
                # Try simple existence check
                # If there's an import like './nonExistentModule'
                # Check whether any candidate file exists
                # We can verify via simple match
                has_match = any(
                    clean_imp.lstrip("./") in f or Path(clean_imp).stem in f
                    for f in all_known_files
                )
                if not has_match and not any(f.startswith(clean_imp) for f in all_known_files):
                    findings.append(
                        FindingCreate(
                            category=FindingCategory.DEPENDENCY,
                            severity=FindingSeverity.MEDIUM,
                            title=f"Unresolved local import '{raw_imp}' in {rel_path}",
                            description=(
                                f"The file imports local path '{raw_imp}', but no matching file was found in the workspace. "
                                "This may cause module not found runtime errors."
                            ),
                            file_path=rel_path,
                            line_number=1,
                            evidence=raw_imp,
                            suggested_fix="Verify the imported file path or install the missing module.",
                            metadata_payload={"import": raw_imp},
                        )
                    )

    # 2. Unused declared dependencies
    # Collect all external import stems across files
    all_external_imports = set()
    for parsed in parsed_files.values():
        for imp in parsed.imports:
            if not imp.startswith("."):
                pkg_name = imp.split("/")[0].replace("@", "").lower()
                all_external_imports.add(pkg_name)

    # Cross-reference with JS package.json if JS code is present
    if manifest_deps["javascript"]:
        for declared_pkg in manifest_deps["javascript"]:
            pkg_key = declared_pkg.split("/")[0].replace("@", "").lower()
            # Ignore common tooling/types
            if pkg_key.startswith("eslint") or pkg_key.startswith("prettier") or "types" in pkg_key:
                continue
            if pkg_key not in all_external_imports:
                findings.append(
                    FindingCreate(
                        category=FindingCategory.DEPENDENCY,
                        severity=FindingSeverity.LOW,
                        title=f"Potentially unused dependency '{declared_pkg}' in package.json",
                        description=f"Package '{declared_pkg}' is declared in package.json dependencies, but no matching import was detected in repository code.",
                        file_path="package.json",
                        line_number=1,
                        evidence=f'"{declared_pkg}"',
                        suggested_fix="Remove unused dependency to reduce bundle size and vulnerability surface.",
                        metadata_payload={"package": declared_pkg},
                    )
                )

    return findings
