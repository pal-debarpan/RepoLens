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
  score: number | null; // 0 - 100 when analysis has completed
  riskLevel: 'Healthy' | 'Moderate Risk' | 'High Risk' | 'Critical Risk' | 'Offline';
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
  /** API graph metadata; presentation fields below are derived client-side. */
  path?: string;
  language?: string;
  lines_of_code?: number;
  in_degree?: number;
  out_degree?: number;
  is_entry_point?: boolean;
  blast_radius_score?: number;
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

// ─── BACKEND ALIGNED TYPES ────────────────────────────────────────────────────

export interface UserProfile {
  id?: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  access_token?: string;
  token_type: string;
  expires_in?: number;
  user?: any;
  message?: string;
}

export interface BackendRepository {
  id: string;
  source_type: 'github' | 'zip';
  source_url: string;
  user_id?: string;
  name?: string;
  default_branch?: string;
  primary_language?: string;
  description?: string;
  latest_commit_sha?: string;
  workspace_path?: string;
  file_count?: number;
  total_size_bytes?: number;
  created_at: string;
  updated_at: string;
}

export interface BackendAnalysis {
  id: string;
  repository_id: string;
  user_id?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  error_message?: string;
  commit_sha?: string;
  file_count: number;
  total_lines: number;
  primary_language?: string;
  quality_score?: number;
  blast_radius_max?: number;
  blast_radius_avg?: number;
  summary?: any;
  created_at: string;
  completed_at?: string;
}

export interface BackendAnalysisDetail extends BackendAnalysis {
  graph?: GraphResponse;
  quality?: QualityResponse;
  testing?: any;
  vulnerabilities?: VulnerabilitiesResponse;
  sbom?: SbomSummaryResponse;
  findings: FindingResponse[];
}

export interface VulnerabilityItem {
  id: string;
  summary: string;
  severity?: string;
  fixed_versions: string[];
  references: string[];
}

export interface VulnerablePackage {
  package_name: string;
  version: string;
  ecosystem: string;
  vulnerabilities: VulnerabilityItem[];
  affected_files: string[];
  highest_severity: string; // From property in backend
}

export interface VulnerabilitiesResponse {
  packages_scanned: number;
  vulnerable_packages: VulnerablePackage[];
  total_vulnerabilities: number;
  osv_available: boolean;
  error_message?: string;
}

export interface CycloneDXComponent {
  type: string;
  name: string;
  version: string;
  'bom-ref'?: string;
  purl?: string;
  scope?: string;
  description?: string;
  ecosystem?: string;
  direct: boolean;
  licenses?: any[];
  externalReferences?: any[];
  properties?: any[];
  affected_files: string[];
  vulnerabilities_count: number;
}

export interface SbomSummaryResponse {
  format: string;
  spec_version: string;
  serial_number: string;
  component_count: number;
  direct_count: number;
  transitive_count: number;
  vulnerable_components_count: number;
  ecosystems: string[];
  components: CycloneDXComponent[];
  raw_sbom?: any;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
  density: number;
  has_cycles: boolean;
  cycles: string[][];
}

export interface GraphEdge {
  source: string;
  target: string;
  edge_type: string;
  weight: number;
}

export interface BlastRadiusResponse {
  target_file: string;
  score: number;
  impact_level: string;
  direct_dependents_count: number;
  total_affected_count: number;
  affected_files: AffectedFile[];
  evidence_chains: string[][];
  test_targets: string[];
}

export interface AffectedFile {
  file_path: string;
  distance: number;
  impact_score: number;
  impact_level: string;
  reason: string;
  import_chain: string[];
}

export interface FindingResponse {
  id: string;
  analysis_id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  file_path: string;
  line_number?: number;
  evidence?: string;
  suggested_fix?: string;
  metadata_payload?: any;
  created_at: string;
}

export interface QualityResponse {
  overall_score: number;
  grade: string;
  metrics: {
    complexity: number;
    maintainability: number;
    duplication: number;
    coverage: number;
  };
  file_scores: { [path: string]: number };
}

export interface UmlResponse {
  diagram_type: string;
  plantuml_source: string;
  total_nodes: number;
  total_edges: number;
}

export interface BackendChatResponse {
  reply: string;
  model_used?: string;
}
