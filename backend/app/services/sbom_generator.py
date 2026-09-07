"""
SBOM (Software Bill of Materials) generation service.

Generates compliant CycloneDX 1.5 JSON SBOM documents dynamically from
analyzed repository dependencies (Python, JavaScript/TypeScript).

Connects SBOM components with:
- Standard Package URLs (PURLs)
- Direct vs Transitive dependency identification
- Dependency relationship graph (CycloneDX dependencies array)
- OSV vulnerability advisory counts
- Blast-radius affected files mapping
"""
from __future__ import annotations

import json
import logging
import re
import uuid
from pathlib import Path
from typing import Any, Optional
from urllib.parse import quote

from app.schemas.sbom import (
    CycloneDXBOM,
    CycloneDXComponent,
    CycloneDXDependency,
    CycloneDXMetadata,
    CycloneDXMetadataComponent,
    SbomSummaryResponse,
)
from app.schemas.vulnerability import VulnerabilitiesResponse

logger = logging.getLogger(__name__)


def generate_purl(name: str, version: str, ecosystem: str) -> str:
    """
    Generate a standardized Package URL (PURL) compliant with the PURL specification.
    Examples:
      - PyPI: pkg:pypi/requests@2.32.3
      - npm: pkg:npm/axios@1.8.4
      - scoped npm: pkg:npm/%40angular/core@17.0.0
    """
    eco = ecosystem.lower()
    if eco == "pypi":
        # PyPI package names in PURL are normalized to lowercase
        norm_name = name.lower().replace("_", "-")
        return f"pkg:pypi/{norm_name}@{version}"
    elif eco == "npm":
        if name.startswith("@") and "/" in name:
            scope, pkg_name = name.split("/", 1)
            # Scopes in PURL are percent-encoded
            encoded_scope = quote(scope)
            return f"pkg:npm/{encoded_scope}/{pkg_name}@{version}"
        return f"pkg:npm/{name}@{version}"
    elif eco == "maven":
        return f"pkg:maven/{name}@{version}"
    elif eco == "go":
        return f"pkg:golang/{name}@{version}"
    else:
        return f"pkg:generic/{name}@{version}"


def _find_component_affected_files(pkg_name: str, parsed_files: dict[str, Any]) -> list[str]:
    """Search parsed source files for imports matching the package name."""
    affected: list[str] = []
    norm_pkg = pkg_name.lower().lstrip("@").split("/")[-1].replace("-", "_").replace(".", "_")
    alt_name = pkg_name.lower().split("/")[-1]

    for rel_path, parsed in parsed_files.items():
        imports: list[str] = getattr(parsed, "imports", []) or []
        for imp in imports:
            imp_clean = imp.lower().lstrip("./").split("/")[0].lstrip("@").replace("-", "_").replace(".", "_")
            if imp_clean == norm_pkg or imp_clean == alt_name.replace("-", "_"):
                affected.append(rel_path)
                break
            if pkg_name.lower() in imp.lower():
                affected.append(rel_path)
                break

    return affected


def _extract_python_components(workspace_root: Path) -> list[CycloneDXComponent]:
    """Extract Python components from requirements.txt, pyproject.toml, or Pipfile."""
    components: list[CycloneDXComponent] = []
    seen: set[str] = set()

    # 1. requirements.txt
    req_file = workspace_root / "requirements.txt"
    if req_file.exists():
        try:
            with open(req_file, "r", encoding="utf-8", errors="replace") as fh:
                for raw_line in fh:
                    line = raw_line.strip()
                    if not line or line.startswith("#") or line.startswith("-"):
                        continue
                    m = re.match(r"^([A-Za-z0-9_\-\.]+)\s*==\s*([^\s;]+)", line)
                    if m:
                        pkg_name = m.group(1).strip()
                        version = m.group(2).strip()
                        key = f"{pkg_name.lower()}@{version}"
                        if key not in seen:
                            seen.add(key)
                            purl = generate_purl(pkg_name, version, "PyPI")
                            components.append(
                                CycloneDXComponent(
                                    type="library",
                                    name=pkg_name,
                                    version=version,
                                    bom_ref=purl,
                                    purl=purl,
                                    scope="required",
                                    ecosystem="PyPI",
                                    direct=True,
                                    description=f"Python package '{pkg_name}' declared in requirements.txt",
                                )
                            )
                    else:
                        m2 = re.match(r"^([A-Za-z0-9_\-\.]+)\s*[>~]=\s*([^\s;,]+)", line)
                        if m2:
                            pkg_name = m2.group(1).strip()
                            version = m2.group(2).strip()
                            key = f"{pkg_name.lower()}@{version}"
                            if key not in seen:
                                seen.add(key)
                                purl = generate_purl(pkg_name, version, "PyPI")
                                components.append(
                                    CycloneDXComponent(
                                        type="library",
                                        name=pkg_name,
                                        version=version,
                                        bom_ref=purl,
                                        purl=purl,
                                        scope="required",
                                        ecosystem="PyPI",
                                        direct=True,
                                        description=f"Python package '{pkg_name}' declared in requirements.txt",
                                    )
                                )
        except Exception as exc:
            logger.warning("SBOM: Error reading requirements.txt: %s", exc)

    return components


def _extract_npm_components(workspace_root: Path) -> tuple[list[CycloneDXComponent], dict[str, list[str]]]:
    """
    Extract npm components from package.json and package-lock.json.
    Returns:
      (components, package_dependency_map)
    """
    components: list[CycloneDXComponent] = []
    dep_map: dict[str, list[str]] = {}
    seen: set[str] = set()

    pkg_file = workspace_root / "package.json"
    direct_packages: set[str] = set()

    # 1. Parse direct dependencies from package.json
    if pkg_file.exists():
        try:
            with open(pkg_file, "r", encoding="utf-8", errors="replace") as fh:
                data = json.load(fh)

            direct_deps = data.get("dependencies", {})
            dev_deps = data.get("devDependencies", {})

            for name, version_spec in direct_deps.items():
                clean = version_spec.lstrip("^~><=")
                if clean and clean[0].isdigit():
                    ver = re.split(r"[\s|]+", clean)[0].strip()
                    if ver:
                        direct_packages.add(name.lower())
                        key = f"{name.lower()}@{ver}"
                        if key not in seen:
                            seen.add(key)
                            purl = generate_purl(name, ver, "npm")
                            components.append(
                                CycloneDXComponent(
                                    type="library",
                                    name=name,
                                    version=ver,
                                    bom_ref=purl,
                                    purl=purl,
                                    scope="required",
                                    ecosystem="npm",
                                    direct=True,
                                    description=f"JavaScript/TypeScript runtime dependency '{name}'",
                                )
                            )

            for name, version_spec in dev_deps.items():
                clean = version_spec.lstrip("^~><=")
                if clean and clean[0].isdigit():
                    ver = re.split(r"[\s|]+", clean)[0].strip()
                    if ver:
                        direct_packages.add(name.lower())
                        key = f"{name.lower()}@{ver}"
                        if key not in seen:
                            seen.add(key)
                            purl = generate_purl(name, ver, "npm")
                            components.append(
                                CycloneDXComponent(
                                    type="library",
                                    name=name,
                                    version=ver,
                                    bom_ref=purl,
                                    purl=purl,
                                    scope="optional",
                                    ecosystem="npm",
                                    direct=True,
                                    description=f"JavaScript/TypeScript development dependency '{name}'",
                                )
                            )
        except Exception as exc:
            logger.warning("SBOM: Error reading package.json: %s", exc)

    # 2. Parse lockfile (package-lock.json) for transitive dependencies and relationship trees
    lock_file = workspace_root / "package-lock.json"
    if lock_file.exists():
        try:
            with open(lock_file, "r", encoding="utf-8", errors="replace") as fh:
                lock_data = json.load(fh)

            # Support package-lock.json v2/v3 packages map
            packages_map = lock_data.get("packages", {})
            if packages_map:
                for pkg_path, pkg_info in packages_map.items():
                    if not pkg_path or pkg_path == "":
                        continue
                    # node_modules/foo or node_modules/@scope/foo
                    parts = pkg_path.split("node_modules/")
                    if len(parts) > 1:
                        name = parts[-1]
                        ver = pkg_info.get("version", "")
                        if name and ver:
                            key = f"{name.lower()}@{ver}"
                            purl = generate_purl(name, ver, "npm")
                            is_direct = name.lower() in direct_packages
                            if key not in seen:
                                seen.add(key)
                                components.append(
                                    CycloneDXComponent(
                                        type="library",
                                        name=name,
                                        version=ver,
                                        bom_ref=purl,
                                        purl=purl,
                                        scope="required" if is_direct else "optional",
                                        ecosystem="npm",
                                        direct=is_direct,
                                        description=f"NPM package '{name}' resolved in lockfile",
                                    )
                                )

                            # Record dependency relations
                            child_deps = list(pkg_info.get("dependencies", {}).keys())
                            if child_deps:
                                dep_map[purl] = child_deps
        except Exception as exc:
            logger.warning("SBOM: Error reading package-lock.json: %s", exc)

    return components, dep_map


def generate_cyclonedx_sbom(
    workspace_root: str | Path,
    parsed_files: dict[str, Any],
    vulnerabilities: Optional[VulnerabilitiesResponse] = None,
    repo_name: str = "repository",
    commit_sha: Optional[str] = None,
) -> CycloneDXBOM:
    """
    Generate a full CycloneDX 1.5 JSON SBOM for a repository.

    1. Extract declared Python and NPM packages.
    2. Enrich components with PURLs, direct/transitive status, and blast radius affected files.
    3. Correlate with OSV vulnerability scan results.
    4. Build CycloneDX metadata, components, and dependency relationships graph.
    """
    root = Path(workspace_root)
    py_components = _extract_python_components(root)
    npm_components, npm_dep_map = _extract_npm_components(root)

    all_components = py_components + npm_components

    # Map vulnerability counts by package name
    vuln_count_by_pkg: dict[str, int] = {}
    if vulnerabilities and vulnerabilities.vulnerable_packages:
        for vp in vulnerabilities.vulnerable_packages:
            pkg_key = vp.package_name.lower()
            vuln_count_by_pkg[pkg_key] = len(vp.vulnerabilities)

    # Enrich components with blast radius affected files and vulnerability counts
    for comp in all_components:
        comp.affected_files = _find_component_affected_files(comp.name, parsed_files)
        comp.vulnerabilities_count = vuln_count_by_pkg.get(comp.name.lower(), 0)

    # Build CycloneDX Dependency relationships
    app_bom_ref = f"pkg:application/{repo_name.lower().replace(' ', '-')}"
    if commit_sha:
        app_bom_ref += f"@{commit_sha[:7]}"

    direct_refs = [comp.bom_ref for comp in all_components if comp.direct and comp.bom_ref]
    dependencies: list[CycloneDXDependency] = [
        CycloneDXDependency(ref=app_bom_ref, dependsOn=direct_refs)
    ]

    # Add transitive dependency edges
    for comp_ref, child_names in npm_dep_map.items():
        child_refs = []
        for cn in child_names:
            matching = [c.bom_ref for c in all_components if c.name.lower() == cn.lower() and c.bom_ref]
            if matching:
                child_refs.append(matching[0])
        if child_refs:
            dependencies.append(CycloneDXDependency(ref=comp_ref, dependsOn=child_refs))

    serial_number = f"urn:uuid:{uuid.uuid4()}"
    metadata = CycloneDXMetadata(
        component=CycloneDXMetadataComponent(
            type="application",
            name=repo_name,
            version=commit_sha or "1.0.0",
            description=f"RepoLens codebase analysis for {repo_name}",
        )
    )

    bom = CycloneDXBOM(
        bomFormat="CycloneDX",
        specVersion="1.5",
        serialNumber=serial_number,
        version=1,
        metadata=metadata,
        components=all_components,
        dependencies=dependencies,
    )

    logger.info(
        "SBOM: Generated CycloneDX 1.5 document with %d components (%d direct, %d transitive)",
        len(all_components),
        sum(1 for c in all_components if c.direct),
        sum(1 for c in all_components if not c.direct),
    )

    return bom


def summarize_sbom(bom: CycloneDXBOM) -> SbomSummaryResponse:
    """Generate a lightweight summary of the CycloneDX SBOM."""
    direct_count = sum(1 for c in bom.components if c.direct)
    transitive_count = sum(1 for c in bom.components if not c.direct)
    vulnerable_count = sum(1 for c in bom.components if c.vulnerabilities_count > 0)
    ecosystems = sorted(list(set(c.ecosystem for c in bom.components if c.ecosystem)))

    return SbomSummaryResponse(
        format=bom.bomFormat,
        spec_version=bom.specVersion,
        serial_number=bom.serialNumber,
        component_count=len(bom.components),
        direct_count=direct_count,
        transitive_count=transitive_count,
        vulnerable_components_count=vulnerable_count,
        ecosystems=ecosystems,
        components=bom.components,
        raw_sbom=bom.model_dump(by_alias=True),
    )
