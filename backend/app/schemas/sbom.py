"""
CycloneDX 1.5 JSON Schemas for RepoLens SBOM generation.

Implements the official CycloneDX 1.5 specification for Software Bill of Materials.
Includes component definitions, dependency graphs, PURL resolution, and vulnerability linkages.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class CycloneDXTool(BaseModel):
    vendor: str = "RepoLens"
    name: str = "RepoLens SBOM Engine"
    version: str = "1.0.0"

    model_config = ConfigDict(populate_by_name=True)


class CycloneDXMetadataComponent(BaseModel):
    type: str = "application"
    name: str
    version: str = "1.0.0"
    description: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class CycloneDXMetadata(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    tools: list[CycloneDXTool] = Field(default_factory=lambda: [CycloneDXTool()])
    component: Optional[CycloneDXMetadataComponent] = None

    model_config = ConfigDict(populate_by_name=True)


class CycloneDXLicense(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    url: Optional[str] = None


class CycloneDXLicenseChoice(BaseModel):
    license: Optional[CycloneDXLicense] = None


class CycloneDXExternalReference(BaseModel):
    type: str  # "vcs" | "issue-tracker" | "website" | "advisory" | "documentation"
    url: str


class CycloneDXProperty(BaseModel):
    name: str
    value: str


class CycloneDXComponent(BaseModel):
    type: str = "library"
    name: str
    version: str
    bom_ref: Optional[str] = Field(None, alias="bom-ref")
    purl: Optional[str] = None
    scope: Optional[str] = "required"  # "required" (direct) | "optional" (dev/transitive)
    description: Optional[str] = None
    ecosystem: Optional[str] = None  # "PyPI" | "npm" | "Maven" | "Go"
    direct: bool = True
    licenses: Optional[list[CycloneDXLicenseChoice]] = None
    externalReferences: Optional[list[CycloneDXExternalReference]] = None
    properties: Optional[list[CycloneDXProperty]] = None

    # RepLens enrichment fields
    affected_files: list[str] = Field(default_factory=list)
    vulnerabilities_count: int = 0

    model_config = ConfigDict(populate_by_name=True)


class CycloneDXDependency(BaseModel):
    ref: str
    dependsOn: list[str] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class CycloneDXBOM(BaseModel):
    bomFormat: str = "CycloneDX"
    specVersion: str = "1.5"
    serialNumber: str
    version: int = 1
    metadata: CycloneDXMetadata
    components: list[CycloneDXComponent] = Field(default_factory=list)
    dependencies: list[CycloneDXDependency] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class SbomSummaryResponse(BaseModel):
    format: str = "CycloneDX"
    spec_version: str = "1.5"
    serial_number: str
    component_count: int = 0
    direct_count: int = 0
    transitive_count: int = 0
    vulnerable_components_count: int = 0
    ecosystems: list[str] = Field(default_factory=list)
    components: list[CycloneDXComponent] = Field(default_factory=list)
    raw_sbom: Optional[dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True)
