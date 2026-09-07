"""
OSV (Open Source Vulnerabilities) service.

Queries https://api.osv.dev/v1/query for each detected dependency,
normalizes the response, and links vulnerable packages to the files
that import them (blast-radius context).

Design principles:
- Uses httpx (already in requirements.txt) — no new dependencies.
- Synchronous client suitable for the thread-based orchestrator.
- Per-package errors are caught; the overall analysis never crashes due to OSV.
- Deduplicates packages (same name+version+ecosystem queried once).
- Sets a 10-second timeout per request.
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import httpx

from app.models.finding import FindingCategory, FindingSeverity
from app.schemas.finding import FindingCreate
from app.schemas.vulnerability import (
    VulnerabilitiesResponse,
    VulnerabilityItem,
    VulnerablePackage,
)

logger = logging.getLogger(__name__)

OSV_API_URL = "https://api.osv.dev/v1/query"
OSV_TIMEOUT_SECONDS = 10.0

# ---------------------------------------------------------------------------
# Internal data classes (not exposed in API directly)
# ---------------------------------------------------------------------------


@dataclass
class OsvPackage:
    """A uniquely identified dependency."""
    name: str
    version: str
    ecosystem: str  # "PyPI" | "npm"

    def dedup_key(self) -> tuple[str, str, str]:
        return (self.name.lower(), self.version, self.ecosystem)


# ---------------------------------------------------------------------------
# Dependency extraction helpers
# ---------------------------------------------------------------------------


def _parse_requirements_txt(workspace_root: Path) -> list[OsvPackage]:
    """
    Extract (name, version, PyPI) triples from requirements.txt.
    Lines without a pinned version (e.g. 'requests') are skipped because
    OSV requires an exact version to query against.
    """
    packages: list[OsvPackage] = []
    req_file = workspace_root / "requirements.txt"
    if not req_file.exists():
        return packages

    try:
        with open(req_file, "r", encoding="utf-8", errors="replace") as fh:
            for raw_line in fh:
                line = raw_line.strip()
                if not line or line.startswith("#") or line.startswith("-"):
                    continue
                # Match: package==1.2.3 or package>=1.2.3 or package~=1.2.3
                m = re.match(r"^([A-Za-z0-9_\-\.]+)\s*==\s*([^\s;]+)", line)
                if m:
                    pkg_name = m.group(1).strip()
                    version = m.group(2).strip()
                    packages.append(OsvPackage(name=pkg_name, version=version, ecosystem="PyPI"))
                else:
                    # Try >=, ~=, etc. — use the lower-bound version if pinned-ish
                    m2 = re.match(r"^([A-Za-z0-9_\-\.]+)\s*[>~]=\s*([^\s;,]+)", line)
                    if m2:
                        pkg_name = m2.group(1).strip()
                        version = m2.group(2).strip()
                        packages.append(OsvPackage(name=pkg_name, version=version, ecosystem="PyPI"))
    except Exception as exc:
        logger.warning("OSV: Failed to parse requirements.txt: %s", exc)

    return packages


def _parse_package_json(workspace_root: Path) -> list[OsvPackage]:
    """
    Extract (name, version, npm) triples from package.json.
    Skips entries without a concrete version (e.g. workspace:* or git URLs).
    """
    packages: list[OsvPackage] = []
    pkg_file = workspace_root / "package.json"
    if not pkg_file.exists():
        return packages

    try:
        with open(pkg_file, "r", encoding="utf-8", errors="replace") as fh:
            data = json.load(fh)

        all_deps: dict[str, str] = {}
        all_deps.update(data.get("dependencies", {}))
        all_deps.update(data.get("devDependencies", {}))

        for pkg_name, version_spec in all_deps.items():
            # Resolve caret/tilde to a concrete version number
            clean = version_spec.lstrip("^~><=")
            # Skip non-numeric starts (git URLs, workspace:*, etc.)
            if clean and clean[0].isdigit():
                # Take the first version segment (before any space or ||)
                concrete = re.split(r"[\s|]+", clean)[0].strip()
                if concrete:
                    packages.append(OsvPackage(name=pkg_name, version=concrete, ecosystem="npm"))
    except Exception as exc:
        logger.warning("OSV: Failed to parse package.json: %s", exc)

    return packages


def extract_dependencies(workspace_root: str | Path) -> list[OsvPackage]:
    """
    Extract all pinned dependencies from the repository workspace.
    Deduplicates (name+version+ecosystem) before returning.
    """
    root = Path(workspace_root)
    all_pkgs = _parse_requirements_txt(root) + _parse_package_json(root)

    seen: set[tuple[str, str, str]] = set()
    unique: list[OsvPackage] = []
    for pkg in all_pkgs:
        key = pkg.dedup_key()
        if key not in seen:
            seen.add(key)
            unique.append(pkg)

    logger.debug("OSV: %d unique packages extracted for vulnerability scan", len(unique))
    return unique


# ---------------------------------------------------------------------------
# OSV query
# ---------------------------------------------------------------------------


def _map_severity(osv_severity: str | None) -> str | None:
    """Normalize OSV severity string to CRITICAL/HIGH/MEDIUM/LOW or None."""
    if not osv_severity:
        return None
    upper = osv_severity.upper()
    if upper in ("CRITICAL",):
        return "CRITICAL"
    if upper in ("HIGH",):
        return "HIGH"
    if upper in ("MEDIUM", "MODERATE"):
        return "MEDIUM"
    if upper in ("LOW",):
        return "LOW"
    return None


def _extract_severity_from_vuln(vuln_data: dict[str, Any]) -> str | None:
    """
    OSV severity can appear in multiple places:
    - vuln.severity[].score (CVSS)
    - vuln.database_specific.severity
    - vuln.affected[].database_specific.severity
    We try each location in order of reliability.
    """
    # 1. Top-level database_specific.severity
    db_sev = (vuln_data.get("database_specific") or {}).get("severity")
    if db_sev:
        mapped = _map_severity(db_sev)
        if mapped:
            return mapped

    # 2. ecosystem_specific.severity in each affected entry
    for aff in vuln_data.get("affected", []):
        eco_sev = (aff.get("ecosystem_specific") or {}).get("severity")
        if eco_sev:
            mapped = _map_severity(eco_sev)
            if mapped:
                return mapped
        db_sev2 = (aff.get("database_specific") or {}).get("severity")
        if db_sev2:
            mapped = _map_severity(db_sev2)
            if mapped:
                return mapped

    # 3. severity[] list (CVSS score → derive severity)
    for sev_entry in vuln_data.get("severity", []):
        score_str = sev_entry.get("score", "")
        # CVSS vector or numeric — try numeric part
        m = re.search(r"(\d+\.\d+)", score_str)
        if m:
            score = float(m.group(1))
            if score >= 9.0:
                return "CRITICAL"
            if score >= 7.0:
                return "HIGH"
            if score >= 4.0:
                return "MEDIUM"
            return "LOW"

    return None


def _extract_fixed_versions(vuln_data: dict[str, Any], ecosystem: str, pkg_name: str) -> list[str]:
    """Extract fixed version strings from OSV affected[] ranges."""
    fixed: list[str] = []
    for aff in vuln_data.get("affected", []):
        pkg = aff.get("package", {})
        if pkg.get("name", "").lower() != pkg_name.lower():
            continue
        for rng in aff.get("ranges", []):
            for event in rng.get("events", []):
                if "fixed" in event:
                    fixed.append(event["fixed"])
    return list(set(fixed))  # deduplicate


def _query_osv_single(client: httpx.Client, pkg: OsvPackage) -> list[VulnerabilityItem]:
    """
    Query OSV for a single package+version+ecosystem.
    Returns a (possibly empty) list of VulnerabilityItem.
    Catches all exceptions — never raises.
    """
    payload = {
        "version": pkg.version,
        "package": {
            "name": pkg.name,
            "ecosystem": pkg.ecosystem,
        },
    }
    try:
        resp = client.post(OSV_API_URL, json=payload, timeout=OSV_TIMEOUT_SECONDS)
        resp.raise_for_status()
        data = resp.json()
    except httpx.TimeoutException:
        logger.warning("OSV: Timeout querying %s@%s (%s)", pkg.name, pkg.version, pkg.ecosystem)
        raise  # let caller handle timeout as OSV unavailable
    except httpx.HTTPStatusError as exc:
        logger.warning("OSV: HTTP %s for %s@%s: %s", exc.response.status_code, pkg.name, pkg.version, exc)
        return []
    except Exception as exc:
        logger.warning("OSV: Unexpected error for %s@%s: %s", pkg.name, pkg.version, exc)
        return []

    vulns: list[VulnerabilityItem] = []
    for v in data.get("vulns", []):
        vuln_id = v.get("id", "UNKNOWN")
        summary = v.get("summary", "") or v.get("details", "")[:200] or "No summary available"
        severity = _extract_severity_from_vuln(v)
        fixed_versions = _extract_fixed_versions(v, pkg.ecosystem, pkg.name)
        refs = [r.get("url", "") for r in v.get("references", []) if r.get("url")]

        vulns.append(VulnerabilityItem(
            id=vuln_id,
            summary=summary[:500],
            severity=severity,
            fixed_versions=fixed_versions,
            references=refs[:5],  # cap references
        ))

    return vulns


# ---------------------------------------------------------------------------
# Blast-radius linkage: which files import a given package?
# ---------------------------------------------------------------------------


def _find_affected_files(pkg: OsvPackage, parsed_files: dict[str, Any]) -> list[str]:
    """
    Search parsed source files for imports of the vulnerable package.
    Uses the parsed imports already extracted by the parser service.
    """
    affected: list[str] = []
    # Normalize package name for matching (npm packages may use @scope/name)
    pkg_name_lower = pkg.name.lower().lstrip("@").split("/")[-1].replace("-", "_").replace(".", "_")
    alt_name = pkg.name.lower().split("/")[-1]  # for scoped packages

    for rel_path, parsed in parsed_files.items():
        imports: list[str] = getattr(parsed, "imports", []) or []
        for imp in imports:
            imp_clean = imp.lower().lstrip("./").split("/")[0].lstrip("@").replace("-", "_").replace(".", "_")
            if imp_clean == pkg_name_lower or imp_clean == alt_name.replace("-", "_"):
                affected.append(rel_path)
                break
            # Direct match on the import path segment
            if pkg.name.lower() in imp.lower():
                affected.append(rel_path)
                break

    return affected


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


def run_osv_analysis(
    workspace_root: str | Path,
    parsed_files: dict[str, Any],
) -> VulnerabilitiesResponse:
    """
    Full OSV vulnerability scan for a repository workspace.

    1. Extract pinned dependencies from manifest files.
    2. Deduplicate packages.
    3. Query OSV for each unique package (one request per package).
    4. Link vulnerabilities to affected source files using import data.
    5. Return a normalized VulnerabilitiesResponse.

    If OSV is completely unreachable, returns a response with osv_available=False
    so the rest of the analysis pipeline continues unaffected.
    """
    packages = extract_dependencies(workspace_root)

    if not packages:
        logger.info("OSV: No pinned dependencies found — skipping vulnerability scan")
        return VulnerabilitiesResponse(
            packages_scanned=0,
            vulnerable_packages=[],
            total_vulnerabilities=0,
            osv_available=True,
        )

    logger.info("OSV: Scanning %d unique packages", len(packages))
    vulnerable: list[VulnerablePackage] = []
    osv_available = True
    error_message: str | None = None

    try:
        with httpx.Client() as client:
            for pkg in packages:
                try:
                    vulns = _query_osv_single(client, pkg)
                except httpx.TimeoutException:
                    # If first package times out, mark OSV unavailable but continue
                    # collecting from subsequent packages with a shorter grace attempt
                    osv_available = False
                    error_message = "OSV API timed out — vulnerability data unavailable for this scan"
                    logger.warning("OSV: Marking as unavailable due to timeout")
                    break
                except Exception:
                    # Non-fatal: skip this package
                    continue

                if vulns:
                    affected_files = _find_affected_files(pkg, parsed_files)
                    vulnerable.append(VulnerablePackage(
                        package_name=pkg.name,
                        version=pkg.version,
                        ecosystem=pkg.ecosystem,
                        vulnerabilities=vulns,
                        affected_files=affected_files,
                    ))
                    logger.info(
                        "OSV: %s@%s (%s) — %d vulnerabilities found",
                        pkg.name, pkg.version, pkg.ecosystem, len(vulns),
                    )
                else:
                    logger.debug("OSV: %s@%s (%s) — clean", pkg.name, pkg.version, pkg.ecosystem)

    except Exception as exc:
        osv_available = False
        error_message = f"OSV analysis failed: {str(exc)[:200]}"
        logger.warning("OSV: Analysis failed globally: %s", exc)

    total_vulns = sum(len(vp.vulnerabilities) for vp in vulnerable)
    logger.info(
        "OSV: Scan complete — %d/%d packages vulnerable, %d total advisories",
        len(vulnerable), len(packages), total_vulns,
    )

    return VulnerabilitiesResponse(
        packages_scanned=len(packages),
        vulnerable_packages=vulnerable,
        total_vulnerabilities=total_vulns,
        osv_available=osv_available,
        error_message=error_message,
    )


# ---------------------------------------------------------------------------
# Convert OSV results to FindingCreate objects (for the quality scorer)
# ---------------------------------------------------------------------------


_OSV_SEVERITY_MAP: dict[str | None, FindingSeverity] = {
    "CRITICAL": FindingSeverity.CRITICAL,
    "HIGH": FindingSeverity.HIGH,
    "MEDIUM": FindingSeverity.MEDIUM,
    "LOW": FindingSeverity.LOW,
    None: FindingSeverity.LOW,
}


def findings_from_osv(osv_result: VulnerabilitiesResponse) -> list[FindingCreate]:
    """
    Convert OSV VulnerabilitiesResponse into FindingCreate objects so they
    feed into the existing quality-scoring pipeline (security penalty formula).

    One Finding is created per (package, advisory) pair so that severity
    counts in quality.py reflect the actual advisory breakdown.
    """
    findings: list[FindingCreate] = []

    if not osv_result.osv_available:
        return findings  # No data → no findings → scores unaffected

    for vp in osv_result.vulnerable_packages:
        for vuln in vp.vulnerabilities:
            severity = _OSV_SEVERITY_MAP.get(vuln.severity, FindingSeverity.LOW)
            fixed_str = ", ".join(vp.vulnerabilities[0].fixed_versions) if vp.vulnerabilities[0].fixed_versions else "No fix available"

            primary_file = vp.affected_files[0] if vp.affected_files else (
                "requirements.txt" if vp.ecosystem == "PyPI" else "package.json"
            )

            findings.append(
                FindingCreate(
                    category=FindingCategory.SECURITY,
                    severity=severity,
                    title=f"Vulnerable dependency: {vp.package_name}@{vp.version} — {vuln.id}",
                    description=(
                        f"Package '{vp.package_name}' version '{vp.version}' ({vp.ecosystem}) "
                        f"is affected by {vuln.id}. {vuln.summary or 'No summary available.'}"
                    ),
                    file_path=primary_file,
                    line_number=1,
                    evidence=f"{vp.package_name}=={vp.version}",
                    suggested_fix=(
                        f"Upgrade '{vp.package_name}' to a fixed version: {fixed_str}. "
                        "Review the advisory for workarounds if an upgrade is not immediately possible."
                    ),
                    metadata_payload={
                        "osv_id": vuln.id,
                        "package": vp.package_name,
                        "version": vp.version,
                        "ecosystem": vp.ecosystem,
                        "fixed_versions": vuln.fixed_versions,
                        "affected_files": vp.affected_files,
                        "references": vuln.references,
                    },
                )
            )

    return findings
