"""
Tests for CycloneDX 1.5 JSON SBOM generation and API endpoints.
"""
import json
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.sbom import CycloneDXBOM
from app.schemas.vulnerability import VulnerabilitiesResponse, VulnerablePackage, VulnerabilityItem
from app.services.demo_fixture import DEMO_ANALYSIS_ID
from app.services.sbom_generator import (
    generate_cyclonedx_sbom,
    generate_purl,
    summarize_sbom,
)


class MockParsedFile:
    def __init__(self, imports):
        self.imports = imports


def test_purl_generation():
    """Verify standard Package URL (PURL) generation for PyPI and npm."""
    assert generate_purl("requests", "2.32.3", "PyPI") == "pkg:pypi/requests@2.32.3"
    assert generate_purl("jinja2", "3.1.6", "PyPI") == "pkg:pypi/jinja2@3.1.6"
    assert generate_purl("axios", "1.8.4", "npm") == "pkg:npm/axios@1.8.4"
    assert generate_purl("@angular/core", "17.0.0", "npm") == "pkg:npm/%40angular/core@17.0.0"


def test_sbom_python_generation():
    """Test CycloneDX SBOM generation for a Python repository."""
    with tempfile.TemporaryDirectory() as tmpdir:
        req_file = Path(tmpdir) / "requirements.txt"
        req_file.write_text("fastapi==0.115.0\nrequests==2.32.3\njinja2==2.4.1\n")

        parsed_files = {
            "app/main.py": MockParsedFile(["fastapi", "requests"]),
            "app/renderer.py": MockParsedFile(["jinja2"]),
        }

        # Mock OSV vulnerability for jinja2
        mock_vulns = VulnerabilitiesResponse(
            packages_scanned=3,
            vulnerable_packages=[
                VulnerablePackage(
                    package_name="jinja2",
                    version="2.4.1",
                    ecosystem="PyPI",
                    vulnerabilities=[
                        VulnerabilityItem(
                            id="GHSA-462w-v97r-4m45",
                            summary="Sandbox escape in Jinja2",
                            severity="HIGH",
                        )
                    ],
                )
            ],
            total_vulnerabilities=1,
            osv_available=True,
        )

        bom = generate_cyclonedx_sbom(
            workspace_root=tmpdir,
            parsed_files=parsed_files,
            vulnerabilities=mock_vulns,
            repo_name="my-python-app",
        )

        assert bom.bomFormat == "CycloneDX"
        assert bom.specVersion == "1.5"
        assert bom.serialNumber.startswith("urn:uuid:")
        assert len(bom.components) == 3

        # Check components and PURLs
        names = {c.name: c for c in bom.components}
        assert "requests" in names
        assert names["requests"].purl == "pkg:pypi/requests@2.32.3"
        assert names["requests"].direct is True
        assert names["requests"].affected_files == ["app/main.py"]

        assert "jinja2" in names
        assert names["jinja2"].vulnerabilities_count == 1
        assert names["jinja2"].affected_files == ["app/renderer.py"]

        # Check dependencies
        assert len(bom.dependencies) >= 1
        assert bom.dependencies[0].ref == "pkg:application/my-python-app"
        assert len(bom.dependencies[0].dependsOn) == 3

        # Test summary
        summary = summarize_sbom(bom)
        assert summary.component_count == 3
        assert summary.direct_count == 3
        assert summary.vulnerable_components_count == 1
        assert "PyPI" in summary.ecosystems


def test_sbom_npm_generation_with_lockfile():
    """Test CycloneDX SBOM generation for an NPM repository with direct and transitive dependencies."""
    with tempfile.TemporaryDirectory() as tmpdir:
        pkg_file = Path(tmpdir) / "package.json"
        pkg_file.write_text(json.dumps({
            "name": "my-node-app",
            "dependencies": {
                "express": "^4.18.2",
                "axios": "0.21.1"
            },
            "devDependencies": {
                "jest": "29.0.0"
            }
        }))

        lock_file = Path(tmpdir) / "package-lock.json"
        lock_file.write_text(json.dumps({
            "name": "my-node-app",
            "version": "1.0.0",
            "lockfileVersion": 3,
            "packages": {
                "": {"name": "my-node-app"},
                "node_modules/express": {
                    "version": "4.18.2",
                    "dependencies": {"body-parser": "^1.20.2"}
                },
                "node_modules/body-parser": {
                    "version": "1.20.2"
                }
            }
        }))

        parsed_files = {
            "src/index.js": MockParsedFile(["express", "axios"])
        }

        bom = generate_cyclonedx_sbom(
            workspace_root=tmpdir,
            parsed_files=parsed_files,
            repo_name="my-node-app",
        )

        assert bom.bomFormat == "CycloneDX"
        assert len(bom.components) >= 3

        direct_comps = [c for c in bom.components if c.direct]
        transitive_comps = [c for c in bom.components if not c.direct]

        assert len(direct_comps) >= 2
        assert any(c.name == "body-parser" and not c.direct for c in bom.components)


def test_sbom_empty_repository():
    """Test SBOM generation when no dependency manifests exist."""
    with tempfile.TemporaryDirectory() as tmpdir:
        bom = generate_cyclonedx_sbom(
            workspace_root=tmpdir,
            parsed_files={},
            repo_name="clean-repo",
        )
        assert bom.bomFormat == "CycloneDX"
        assert len(bom.components) == 0
        summary = summarize_sbom(bom)
        assert summary.component_count == 0


def test_api_sbom_endpoints():
    """Test /analyses/{id}/sbom and /analyses/{id}/sbom/summary API endpoints."""
    client = TestClient(app)

    # 1. GET SBOM detail for demo repo
    r1 = client.get(f"/api/v1/analyses/{DEMO_ANALYSIS_ID}/sbom")
    assert r1.status_code == 200
    data1 = r1.json()
    assert data1["bomFormat"] == "CycloneDX"
    assert data1["specVersion"] == "1.5"
    assert len(data1["components"]) == 6

    # 2. GET SBOM download attachment
    r2 = client.get(f"/api/v1/analyses/{DEMO_ANALYSIS_ID}/sbom?download=true")
    assert r2.status_code == 200
    assert "Content-Disposition" in r2.headers
    assert "repolens-sbom" in r2.headers["Content-Disposition"]

    # 3. GET SBOM summary
    r3 = client.get(f"/api/v1/analyses/{DEMO_ANALYSIS_ID}/sbom/summary")
    assert r3.status_code == 200
    data3 = r3.json()
    assert data3["format"] == "CycloneDX"
    assert data3["component_count"] == 6
    assert data3["direct_count"] == 4
    assert data3["transitive_count"] == 2
    assert data3["vulnerable_components_count"] == 2

    # 4. Verify analysis detail includes sbom
    r4 = client.get(f"/api/v1/analyses/{DEMO_ANALYSIS_ID}")
    assert r4.status_code == 200
    detail = r4.json()
    assert "sbom" in detail
    assert detail["sbom"]["component_count"] == 6
    assert detail["quality_score"] == 72.4
