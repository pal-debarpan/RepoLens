export type ThemeMode = 'dark' | 'light' | 'system';

export interface Repository {
  id: string;
  name: string;
  isPrivate: boolean;
  branch: string;
  commitHash: string;
  commitMessage: string;
  language: string;
  framework: string;
  lastAnalyzed: string;
  scanDepth: string;
  score: number; // 0 - 100
  riskLevel: 'Healthy' | 'Moderate Risk' | 'High Risk' | 'Critical Risk';
  blastVectorsCount: number;
  circularLeaksCount: number;
  status: 'Active' | 'Analyzing' | 'Degraded' | 'Offline';
  loc: number;
  filesCount: number;
  dependenciesCount: number;
  openIssuesCount: number;
  testCoverage: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  duration?: string;
  detail?: string;
}

export interface PipelineLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  stage: string;
  message: string;
}

export interface DependencyItem {
  id: string;
  name: string;
  version: string;
  latestVersion: string;
  type: 'direct' | 'transitive' | 'dev';
  license: string;
  status: 'up-to-date' | 'outdated' | 'vulnerable' | 'circular';
  vulnerabilitiesCount: number;
  cveId?: string;
  dependentsCount: number;
  ecosystem: 'pypi' | 'npm' | 'crates' | 'go';
}

export interface IssueItem {
  id: string;
  title: string;
  cwe: string;
  cve?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'Security' | 'Architectural Debt' | 'Performance' | 'Reliability';
  filePath: string;
  line: number;
  status: 'Open' | 'In Review' | 'Resolved' | 'Ignored';
  author: string;
  introducedCommit: string;
  blastRadiusScore: number;
  description: string;
  snippet?: {
    startLine: number;
    highlightLines: number[];
    code: string;
  };
  remediation?: string;
}

export interface BlastRadiusTarget {
  id: string;
  filePath: string;
  symbol: string; // e.g. "validate_token"
  type: 'function' | 'class' | 'module' | 'endpoint' | 'database';
  riskScore: number; // 0 - 100
  confidence: number; // 0 - 100
  depth: number;
  directDependentsCount: number;
  indirectDependentsCount: number;
  affectedEndpointsCount: number;
  affectedEndpoints: string[];
  affectedTestsCount: number;
  affectedTests: string[];
  ripplePath: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  subLabel?: string;
  category: 'core' | 'service' | 'storage' | 'api' | 'external' | 'test' | 'changed' | 'impacted';
  risk?: 'low' | 'medium' | 'high' | 'critical';
  x?: number;
  y?: number;
  metrics?: {
    loc?: number;
    afferentCoupling?: number;
    efferentCoupling?: number;
    instability?: number;
  };
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'calls' | 'imports' | 'reads' | 'mutates' | 'tests';
  isCritical?: boolean;
}

export interface TestingRecommendation {
  id: string;
  testFile: string;
  testCase: string;
  targetComponent: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  executionTimeSec: number;
  status: 'passed' | 'failed' | 'stale' | 'recommended';
  lastRun?: string;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  lines?: number;
  blastRisk?: 'low' | 'medium' | 'high' | 'critical';
  issuesCount?: number;
  language?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  codeSnippet?: {
    language: string;
    code: string;
    diff?: boolean;
    filePath?: string;
  };
  suggestedActions?: string[];
}

// ─── OSV Vulnerabilities ───────────────────────────────────────────────────────

export interface OsvVulnerabilityItem {
  id: string;
  summary: string;
  severity: string | null;
  fixed_versions: string[];
  references: string[];
}

export interface VulnerablePackage {
  package_name: string;
  version: string;
  ecosystem: string;
  vulnerabilities: OsvVulnerabilityItem[];
  affected_files: string[];
}

export interface VulnerabilitiesData {
  packages_scanned: number;
  vulnerable_packages: VulnerablePackage[];
  total_vulnerabilities: number;
  osv_available: boolean;
  error_message?: string | null;
}

// ─── CycloneDX SBOM ───────────────────────────────────────────────────────────

export interface SbomComponent {
  type: string;
  name: string;
  version: string;
  bom_ref?: string;
  purl?: string;
  scope?: string;
  description?: string;
  ecosystem?: string;
  direct: boolean;
  affected_files: string[];
  vulnerabilities_count: number;
}

export interface SbomDependency {
  ref: string;
  dependsOn: string[];
}

export interface CycloneDXBOM {
  bomFormat: string;
  specVersion: string;
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: string;
    tools: { vendor: string; name: string; version: string }[];
    component?: { type: string; name: string; version: string; description?: string };
  };
  components: SbomComponent[];
  dependencies: SbomDependency[];
}

export interface SbomSummaryData {
  format: string;
  spec_version: string;
  serial_number: string;
  component_count: number;
  direct_count: number;
  transitive_count: number;
  vulnerable_components_count: number;
  ecosystems: string[];
  components: SbomComponent[];
  raw_sbom?: CycloneDXBOM;
}


