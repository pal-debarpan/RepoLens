import re
from pathlib import Path
from typing import Any

from app.models.finding import FindingCategory, FindingSeverity
from app.schemas.finding import FindingCreate

# Secret detection patterns
SECRET_PATTERNS = [
    (
        "AWS Access Key",
        re.compile(r"(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}"),
        FindingSeverity.CRITICAL,
    ),
    (
        "Private Key Header",
        re.compile(r"-----BEGIN\s+(?:RSA|OPENSSH|DSA|EC|PGP)?\s*PRIVATE KEY-----"),
        FindingSeverity.CRITICAL,
    ),
    (
        "Generic Hardcoded API Secret",
        re.compile(
            r"""(?:api_key|apikey|secret_key|api_secret|access_token|auth_token|client_secret|private_key)\s*[:=]\s*['"]([a-zA-Z0-9_\-\.\$\/]{16,})['"]""",
            re.IGNORECASE,
        ),
        FindingSeverity.HIGH,
    ),
    (
        "Hardcoded Database Password",
        re.compile(
            r"""(?:db_pass|database_password|db_password|postgres_password)\s*[:=]\s*['"]([^'"]{6,})['"]""",
            re.IGNORECASE,
        ),
        FindingSeverity.HIGH,
    ),
]

# Dangerous execution patterns
DANGEROUS_CALL_PATTERNS = [
    (
        "Dynamic code execution via eval/exec",
        re.compile(r"\b(?:eval|exec)\s*\((.*?)\)"),
        FindingSeverity.CRITICAL,
        "Dynamic evaluation allows arbitrary code execution if inputs contain untrusted data.",
        "Refactor to use safe alternatives such as JSON.parse, ast.literal_eval, or explicit dispatch maps.",
    ),
    (
        "Insecure shell command execution",
        re.compile(r"(?:child_process\.exec|subprocess\.(?:Popen|run|call)\(.*shell\s*=\s*True)"),
        FindingSeverity.HIGH,
        "Executing commands via shell interpolation creates severe command injection vulnerabilities.",
        "Pass arguments as an explicit array without shell=True, or sanitize parameters strictly.",
    ),
    (
        "Potential SQL injection via string formatting",
        re.compile(
            r"""(?:execute|raw|query)\s*\(\s*(?:f['"]|['"].*?\s+(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?\s*['"]\s*\%|\+).*?\)""",
            re.IGNORECASE,
        ),
        FindingSeverity.HIGH,
        "Direct concatenation or string formatting in SQL queries risks SQL injection.",
        "Use parameterized queries or ORM query builders.",
    ),
]


def mask_secret(value: str) -> str:
    """Mask secret value so it is never exposed in evidence."""
    if len(value) <= 6:
        return "******"
    return f"{value[:3]}...{'*' * 8}...{value[-3:]}"


def analyze_security(
    workspace_root: str | Path,
    scanned_files: list[dict[str, Any]],
) -> list[FindingCreate]:
    """
    Perform conservative static security analysis on repository files.
    """
    findings: list[FindingCreate] = []
    root = Path(workspace_root)

    for sf in scanned_files:
        rel_path = sf.get("rel_path", "")
        # Don't inspect test fixtures for secrets unless relevant
        is_test = "test" in rel_path.lower() or "mock" in rel_path.lower()

        abs_path = sf.get("abs_path")
        if not abs_path or not Path(abs_path).exists():
            continue

        try:
            with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
        except Exception:
            continue

        full_content = "".join(lines)

        # 1. Secret scanning
        for pattern_name, pattern, severity in SECRET_PATTERNS:
            for idx, line in enumerate(lines, start=1):
                match = pattern.search(line)
                if match:
                    # If it's a test file, lower severity slightly
                    eff_severity = FindingSeverity.LOW if is_test else severity
                    matched_text = match.group(0)
                    masked = mask_secret(matched_text)

                    # Build masked evidence line
                    evidence_line = line.replace(matched_text, masked).strip()

                    findings.append(
                        FindingCreate(
                            category=FindingCategory.SECURITY,
                            severity=eff_severity,
                            title=f"Potential hardcoded credential: {pattern_name}",
                            description=(
                                f"Detected potential hardcoded credential matching pattern '{pattern_name}' in {rel_path}. "
                                "Hardcoded credentials in version control can be extracted by unauthorized actors."
                            ),
                            file_path=rel_path,
                            line_number=idx,
                            evidence=evidence_line[:200],
                            suggested_fix="Store secrets in environment variables, .env files, or secret managers (e.g. Supabase Vault, AWS Secrets Manager).",
                            metadata_payload={"rule": pattern_name},
                        )
                    )
                    break  # One finding per pattern per file is sufficient

        # 2. Dangerous function calls
        for pattern_name, pattern, severity, desc, fix in DANGEROUS_CALL_PATTERNS:
            for idx, line in enumerate(lines, start=1):
                match = pattern.search(line)
                if match:
                    findings.append(
                        FindingCreate(
                            category=FindingCategory.SECURITY,
                            severity=severity,
                            title=pattern_name,
                            description=f"{desc} Located in {rel_path} line {idx}.",
                            file_path=rel_path,
                            line_number=idx,
                            evidence=line.strip()[:200],
                            suggested_fix=fix,
                            metadata_payload={"rule": pattern_name},
                        )
                    )
                    break

    return findings
