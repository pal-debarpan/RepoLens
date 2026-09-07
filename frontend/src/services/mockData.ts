import {
  Repository,
  PipelineStage,
  PipelineLog,
  DependencyItem,
  IssueItem,
  BlastRadiusTarget,
  GraphNode,
  GraphLink,
  TestingRecommendation,
  FileTreeNode,
} from '../types';

export const MOCK_REPOSITORIES: Repository[] = [
  {
    id: 'repolens-demo',
    name: 'repolens-demo',
    isPrivate: true,
    branch: 'main',
    commitHash: 'd7f42c1',
    commitMessage: 'feat: optimize AST graph resolution depth',
    language: 'Python 3.11',
    framework: 'FastAPI / NetworkX',
    lastAnalyzed: '2m ago',
    scanDepth: 'L3 AST',
    score: 76,
    riskLevel: 'Moderate Risk',
    blastVectorsCount: 14,
    circularLeaksCount: 2,
    status: 'Active',
    loc: 14820,
    filesCount: 128,
    dependenciesCount: 42,
    openIssuesCount: 8,
    testCoverage: 84.5,
  },
  {
    id: 'auth-gateway-service',
    name: 'auth-gateway-service',
    isPrivate: true,
    branch: 'release/v3.4',
    commitHash: '81ae930',
    commitMessage: 'refactor: isolate redis session tokens',
    language: 'TypeScript / Node',
    framework: 'NestJS / Redis',
    lastAnalyzed: '1h ago',
    scanDepth: 'Full Monorepo',
    score: 91,
    riskLevel: 'Healthy',
    blastVectorsCount: 3,
    circularLeaksCount: 0,
    status: 'Active',
    loc: 32450,
    filesCount: 246,
    dependenciesCount: 68,
    openIssuesCount: 2,
    testCoverage: 92.1,
  },
  {
    id: 'data-sync-worker',
    name: 'data-sync-worker',
    isPrivate: false,
    branch: 'dev-pipeline',
    commitHash: '3c4980a',
    commitMessage: 'fix: handle kafka consumer rebalance timeouts',
    language: 'Go 1.21',
    framework: 'Kafka / gRPC',
    lastAnalyzed: '4h ago',
    scanDepth: 'L2 Static',
    score: 54,
    riskLevel: 'High Risk',
    blastVectorsCount: 28,
    circularLeaksCount: 5,
    status: 'Degraded',
    loc: 18120,
    filesCount: 94,
    dependenciesCount: 36,
    openIssuesCount: 14,
    testCoverage: 62.4,
  },
];

export const MOCK_PIPELINE_STAGES: PipelineStage[] = [
  { id: '1', name: 'Git Ingestion & Clone', status: 'completed', progress: 100, duration: '1.2s', detail: 'd7f42c1 pulled successfully' },
  { id: '2', name: 'AST Tree Parsing & Semantic Tokenizer', status: 'completed', progress: 100, duration: '3.4s', detail: '128 files, 4,210 symbols registered' },
  { id: '3', name: 'Dependency Graph Resolution', status: 'completed', progress: 100, duration: '2.1s', detail: '42 dependencies, 2 circular cycles detected' },
  { id: '4', name: 'Security & CWE Pattern Scanning', status: 'running', progress: 68, duration: '4.8s', detail: 'Auditing auth_service.py against CVE database' },
  { id: '5', name: 'Blast Radius Impact Simulation', status: 'pending', progress: 0, detail: 'Queued for execution upon scan completion' },
];

export const MOCK_PIPELINE_LOGS: PipelineLog[] = [
  { id: 'l1', timestamp: '14:22:01.102', level: 'info', stage: 'INGEST', message: 'Cloning repository repolens-demo @ commit d7f42c1...' },
  { id: 'l2', timestamp: '14:22:02.310', level: 'success', stage: 'INGEST', message: 'HEAD unpacked: 128 source units verified.' },
  { id: 'l3', timestamp: '14:22:02.450', level: 'info', stage: 'PARSER', message: 'Initializing Python AST parser engine ast-v4.9...' },
  { id: 'l4', timestamp: '14:22:04.912', level: 'info', stage: 'PARSER', message: 'Extracted 1,482 function definitions, 312 class declarations.' },
  { id: 'l5', timestamp: '14:22:05.105', level: 'warn', stage: 'DEPS', message: 'Detected indirect circular reference: core.tokens <-> core.session' },
  { id: 'l6', timestamp: '14:22:06.210', level: 'error', stage: 'SECURITY', message: 'Flagged High Severity vector in services/auth_service.py:142 (CWE-78)' },
  { id: 'l7', timestamp: '14:22:07.410', level: 'info', stage: 'SECURITY', message: 'Running regex & AST taint analysis across 14 API boundary points...' },
  { id: 'l8', timestamp: '14:22:08.820', level: 'info', stage: 'BLAST', message: 'Calculating topological distance matrix and ripple radius...' },
];

export const MOCK_DEPENDENCIES: DependencyItem[] = [
  {
    id: 'dep-1',
    name: 'fastapi',
    version: '0.104.1',
    latestVersion: '0.110.0',
    type: 'direct',
    license: 'MIT',
    status: 'up-to-date',
    vulnerabilitiesCount: 0,
    dependentsCount: 18,
    ecosystem: 'pypi',
  },
  {
    id: 'dep-2',
    name: 'pyjwt',
    version: '2.4.0',
    latestVersion: '2.8.0',
    type: 'direct',
    license: 'Apache-2.0',
    status: 'vulnerable',
    vulnerabilitiesCount: 1,
    cveId: 'CVE-2022-29217',
    dependentsCount: 12,
    ecosystem: 'pypi',
  },
  {
    id: 'dep-3',
    name: 'cryptography',
    version: '41.0.3',
    latestVersion: '42.0.5',
    type: 'transitive',
    license: 'BSD-3-Clause',
    status: 'outdated',
    vulnerabilitiesCount: 0,
    dependentsCount: 6,
    ecosystem: 'pypi',
  },
  {
    id: 'dep-4',
    name: 'networkx',
    version: '3.2.1',
    latestVersion: '3.2.1',
    type: 'direct',
    license: 'BSD-3-Clause',
    status: 'up-to-date',
    vulnerabilitiesCount: 0,
    dependentsCount: 9,
    ecosystem: 'pypi',
  },
  {
    id: 'dep-5',
    name: 'pydantic',
    version: '2.5.2',
    latestVersion: '2.6.4',
    type: 'direct',
    license: 'MIT',
    status: 'up-to-date',
    vulnerabilitiesCount: 0,
    dependentsCount: 24,
    ecosystem: 'pypi',
  },
  {
    id: 'dep-6',
    name: 'redis',
    version: '4.5.1',
    latestVersion: '5.0.3',
    type: 'direct',
    license: 'MIT',
    status: 'outdated',
    vulnerabilitiesCount: 0,
    dependentsCount: 8,
    ecosystem: 'pypi',
  },
  {
    id: 'dep-7',
    name: 'sqlalchemy',
    version: '2.0.23',
    latestVersion: '2.0.28',
    type: 'direct',
    license: 'MIT',
    status: 'circular',
    vulnerabilitiesCount: 0,
    dependentsCount: 15,
    ecosystem: 'pypi',
  }
];

export const MOCK_ISSUES: IssueItem[] = [
  {
    id: 'ISSUE-2041',
    title: 'Potential Command Injection via Unsanitized Input',
    cwe: 'CWE-78',
    severity: 'Critical',
    category: 'Security',
    filePath: 'services/auth_service.py',
    line: 142,
    status: 'Open',
    author: 'm.keller',
    introducedCommit: 'd7f42c1',
    blastRadiusScore: 88,
    description: 'Dynamic subprocess construction using unsanitized string formatting allows arbitrary command injection if malicious payloads bypass the auth header parser.',
    snippet: {
      startLine: 138,
      highlightLines: [142, 143],
      code: `def execute_system_auth_hook(user_id: str, payload: dict) -> bool:
    # Build authentication probe command
    command_prefix = "/usr/local/bin/ldap_verify"
    cmd = f"{command_prefix} --user {user_id} --realm {payload.get('realm')}"
    
    # CRITICAL: shell=True executes with system shell privileges
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode == 0`,
    },
    remediation: 'Replace string formatting with argument arrays and pass shell=False. Use shlex.quote() or subprocess.run(["/usr/local/bin/ldap_verify", "--user", user_id, "--realm", payload["realm"]], check=True).',
  },
  {
    id: 'ISSUE-1892',
    title: 'Circular Dependency Between TokenManager and SessionStorage',
    cwe: 'CWE-398',
    severity: 'High',
    category: 'Architectural Debt',
    filePath: 'core/tokens.py',
    line: 48,
    status: 'Open',
    author: 'a.turing',
    introducedCommit: 'c901ab2',
    blastRadiusScore: 72,
    description: 'TokenManager imports SessionStorage while SessionStorage lazily requires TokenManager for signature validation, generating runtime import deadlock hazards.',
    snippet: {
      startLine: 45,
      highlightLines: [48],
      code: `from core.session import SessionStorage
from core.crypto import generate_key

class TokenManager:
    def __init__(self):
        self.session = SessionStorage() # Inversion of control violated`,
    },
    remediation: 'Extract an abstract ISessionStore interface into core/interfaces.py and inject the session provider into TokenManager via constructor dependency injection.',
  },
  {
    id: 'ISSUE-1405',
    title: 'Hardcoded JWT Fallback Secret Key',
    cwe: 'CWE-798',
    severity: 'Critical',
    category: 'Security',
    filePath: 'config/security.py',
    line: 27,
    status: 'Open',
    author: 's.connor',
    introducedCommit: 'b441aa3',
    blastRadiusScore: 94,
    description: 'Default fallback key "secret-token-key-change-in-prod" detected in repository configuration, allowing token forgery if environment variable is omitted.',
    snippet: {
      startLine: 24,
      highlightLines: [27],
      code: `class SecurityConfig(BaseSettings):
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "secret-token-key-change-in-prod")`,
    },
    remediation: 'Enforce non-empty JWT_SECRET_KEY in production mode and raise a RuntimeError on startup if the environment variable is not explicitly configured.',
  },
  {
    id: 'ISSUE-1102',
    title: 'Unbounded Concurrency in Background Task Queue',
    cwe: 'CWE-400',
    severity: 'Medium',
    category: 'Performance',
    filePath: 'workers/task_runner.py',
    line: 89,
    status: 'In Review',
    author: 'd.ritchie',
    introducedCommit: 'a127f88',
    blastRadiusScore: 58,
    description: 'Async task spawning without semaphore throttling risks thread pool exhaustion during burst webhook ingestion.',
    remediation: 'Wrap task execution inside asyncio.BoundedSemaphore(max_workers=50).',
  },
  {
    id: 'ISSUE-0931',
    title: 'Weak Randomness in Salt Generation Function',
    cwe: 'CWE-330',
    severity: 'High',
    category: 'Security',
    filePath: 'crypto/utils.py',
    line: 64,
    status: 'Open',
    author: 'k.thompson',
    introducedCommit: '98fa011',
    blastRadiusScore: 66,
    description: 'Standard library random.choices() used instead of secrets.token_bytes(), resulting in predictable entropy under high frequency calls.',
    remediation: 'Switch to secrets.token_hex(32) or os.urandom(32).',
  }
];

export const MOCK_BLAST_TARGETS: BlastRadiusTarget[] = [
  {
    id: 'target-auth',
    filePath: 'services/auth_service.py',
    symbol: 'validate_token',
    type: 'function',
    riskScore: 84,
    confidence: 96,
    depth: 3,
    directDependentsCount: 5,
    indirectDependentsCount: 14,
    affectedEndpointsCount: 4,
    affectedEndpoints: [
      'POST /api/v1/auth/login',
      'GET /api/v1/user/profile',
      'POST /api/v1/billing/checkout',
      'DELETE /api/v1/account/revoke',
    ],
    affectedTestsCount: 7,
    affectedTests: [
      'tests/unit/test_auth_service.py::test_validate_token_expired',
      'tests/unit/test_auth_service.py::test_validate_token_invalid_signature',
      'tests/integration/test_user_flow.py::test_authenticated_checkout',
      'tests/e2e/test_api_gateway.py::test_token_header_injection',
    ],
    ripplePath: [
      'services/auth_service.py::validate_token',
      'middleware/jwt_auth.py::authenticate_request',
      'api/v1/routers/user.py::get_current_user',
      'api/v1/routers/billing.py::charge_customer',
      'core/session.py::SessionStorage.evict',
    ],
  },
  {
    id: 'target-db',
    filePath: 'db/session.py',
    symbol: 'get_db_session',
    type: 'class',
    riskScore: 92,
    confidence: 98,
    depth: 4,
    directDependentsCount: 12,
    indirectDependentsCount: 38,
    affectedEndpointsCount: 19,
    affectedEndpoints: [
      'ALL /api/v1/*',
      'POST /api/v1/webhooks/*',
    ],
    affectedTestsCount: 22,
    affectedTests: [
      'tests/integration/test_db_transactions.py',
      'tests/integration/test_user_flow.py',
    ],
    ripplePath: [
      'db/session.py::get_db_session',
      'repositories/user_repo.py::UserRepository',
      'services/user_service.py::UserService',
      'api/v1/routers/*',
    ],
  }
];

export const MOCK_ARCHITECTURE_NODES: GraphNode[] = [
  { id: 'api_gw', label: 'API Gateway', subLabel: 'FastAPI / Routers', category: 'api', risk: 'low', x: 250, y: 80, metrics: { afferentCoupling: 0, efferentCoupling: 5, instability: 1.0 } },
  { id: 'auth_svc', label: 'Auth Service', subLabel: 'auth_service.py', category: 'changed', risk: 'critical', x: 250, y: 220, metrics: { afferentCoupling: 4, efferentCoupling: 3, instability: 0.43, loc: 412 } },
  { id: 'user_svc', label: 'User Service', subLabel: 'user_service.py', category: 'impacted', risk: 'high', x: 100, y: 350, metrics: { afferentCoupling: 3, efferentCoupling: 2, instability: 0.4 } },
  { id: 'billing_svc', label: 'Billing Service', subLabel: 'billing_service.py', category: 'impacted', risk: 'high', x: 400, y: 350, metrics: { afferentCoupling: 2, efferentCoupling: 3, instability: 0.6 } },
  { id: 'token_mgr', label: 'Token Manager', subLabel: 'core/tokens.py', category: 'service', risk: 'medium', x: 250, y: 460, metrics: { afferentCoupling: 3, efferentCoupling: 2, instability: 0.4 } },
  { id: 'redis_store', label: 'Session Cache', subLabel: 'Redis 7.2 Cluster', category: 'storage', risk: 'low', x: 100, y: 560, metrics: { afferentCoupling: 2, efferentCoupling: 0, instability: 0 } },
  { id: 'postgres_db', label: 'PostgreSQL DB', subLabel: 'Primary Cluster', category: 'storage', risk: 'low', x: 400, y: 560, metrics: { afferentCoupling: 4, efferentCoupling: 0, instability: 0 } },
  { id: 'test_auth', label: 'Test Suite', subLabel: 'test_auth_service.py', category: 'test', risk: 'low', x: 550, y: 220, metrics: { afferentCoupling: 0, efferentCoupling: 1, instability: 1.0 } },
];

export const MOCK_ARCHITECTURE_LINKS: GraphLink[] = [
  { source: 'api_gw', target: 'auth_svc', type: 'calls', isCritical: true },
  { source: 'api_gw', target: 'user_svc', type: 'calls' },
  { source: 'api_gw', target: 'billing_svc', type: 'calls' },
  { source: 'auth_svc', target: 'token_mgr', type: 'calls', isCritical: true },
  { source: 'auth_svc', target: 'user_svc', type: 'imports', isCritical: true },
  { source: 'user_svc', target: 'postgres_db', type: 'reads' },
  { source: 'billing_svc', target: 'auth_svc', type: 'calls', isCritical: true },
  { source: 'billing_svc', target: 'postgres_db', type: 'mutates' },
  { source: 'token_mgr', target: 'redis_store', type: 'mutates' },
  { source: 'test_auth', target: 'auth_svc', type: 'tests', isCritical: true },
];

export const MOCK_TESTING_RECOMMENDATIONS: TestingRecommendation[] = [
  {
    id: 'test-1',
    testFile: 'tests/unit/test_auth_service.py',
    testCase: 'test_validate_token_expired',
    targetComponent: 'services/auth_service.py::validate_token',
    priority: 'High',
    reason: 'Target modified in latest commit d7f42c1 with direct AST dependency',
    executionTimeSec: 0.42,
    status: 'recommended',
    lastRun: '2h ago (Passed)',
  },
  {
    id: 'test-2',
    testFile: 'tests/unit/test_auth_service.py',
    testCase: 'test_shell_injection_sanitization',
    targetComponent: 'services/auth_service.py::execute_system_auth_hook',
    priority: 'High',
    reason: 'Addresses open vulnerability CWE-78 (ISSUE-2041)',
    executionTimeSec: 0.85,
    status: 'stale',
    lastRun: '1d ago (Failed)',
  },
  {
    id: 'test-3',
    testFile: 'tests/integration/test_user_flow.py',
    testCase: 'test_authenticated_checkout',
    targetComponent: 'services/billing_service.py',
    priority: 'Medium',
    reason: 'Downstream consumer in blast radius with 2 hops',
    executionTimeSec: 2.10,
    status: 'recommended',
    lastRun: '4h ago (Passed)',
  },
  {
    id: 'test-4',
    testFile: 'tests/e2e/test_api_gateway.py',
    testCase: 'test_token_header_injection',
    targetComponent: 'api/v1/routers/user.py',
    priority: 'Low',
    reason: 'Regression verification for endpoint boundary',
    executionTimeSec: 4.80,
    status: 'passed',
    lastRun: '30m ago (Passed)',
  }
];

export const MOCK_FILE_TREE: FileTreeNode[] = [
  {
    id: 'dir-services',
    name: 'services',
    path: 'services',
    type: 'directory',
    children: [
      { id: 'f-auth', name: 'auth_service.py', path: 'services/auth_service.py', type: 'file', lines: 412, blastRisk: 'critical', issuesCount: 2, language: 'Python' },
      { id: 'f-user', name: 'user_service.py', path: 'services/user_service.py', type: 'file', lines: 320, blastRisk: 'high', issuesCount: 1, language: 'Python' },
      { id: 'f-bill', name: 'billing_service.py', path: 'services/billing_service.py', type: 'file', lines: 284, blastRisk: 'medium', issuesCount: 0, language: 'Python' },
    ]
  },
  {
    id: 'dir-core',
    name: 'core',
    path: 'core',
    type: 'directory',
    children: [
      { id: 'f-tokens', name: 'tokens.py', path: 'core/tokens.py', type: 'file', lines: 195, blastRisk: 'high', issuesCount: 1, language: 'Python' },
      { id: 'f-session', name: 'session.py', path: 'core/session.py', type: 'file', lines: 140, blastRisk: 'medium', issuesCount: 0, language: 'Python' },
      { id: 'f-crypto', name: 'crypto.py', path: 'core/crypto.py', type: 'file', lines: 88, blastRisk: 'low', issuesCount: 0, language: 'Python' },
    ]
  },
  {
    id: 'dir-api',
    name: 'api',
    path: 'api',
    type: 'directory',
    children: [
      { id: 'f-routers', name: 'routes.py', path: 'api/routes.py', type: 'file', lines: 260, blastRisk: 'medium', issuesCount: 0, language: 'Python' },
      { id: 'f-middleware', name: 'middleware.py', path: 'api/middleware.py', type: 'file', lines: 110, blastRisk: 'low', issuesCount: 0, language: 'Python' },
    ]
  },
  {
    id: 'dir-config',
    name: 'config',
    path: 'config',
    type: 'directory',
    children: [
      { id: 'f-sec-cfg', name: 'security.py', path: 'config/security.py', type: 'file', lines: 92, blastRisk: 'critical', issuesCount: 1, language: 'Python' },
    ]
  }
];
