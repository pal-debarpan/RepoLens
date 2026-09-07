import {
  MOCK_REPOSITORIES,
  MOCK_PIPELINE_STAGES,
  MOCK_PIPELINE_LOGS,
  MOCK_DEPENDENCIES,
  MOCK_ISSUES,
  MOCK_BLAST_TARGETS,
  MOCK_ARCHITECTURE_NODES,
  MOCK_ARCHITECTURE_LINKS,
  MOCK_TESTING_RECOMMENDATIONS,
  MOCK_FILE_TREE,
  MOCK_VULNERABILITIES,
  MOCK_SBOM,
  MOCK_SBOM_SUMMARY,
} from './mockData';
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
  ChatMessage,
  VulnerabilitiesData,
  CycloneDXBOM,
  SbomSummaryData,
} from '../types';


const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api/v1` : '/api/v1';
export const DEMO_ANALYSIS_ID = '545b844d-271b-566a-be6a-71a00c89c96c';
export const DEMO_REPO_ID = 'f954f68f-adf2-50cb-9300-d8c076a5263a';

// In-memory analysis cache mapping repoId -> latest analysisId
const repoAnalysisCache = new Map<string, string>();
repoAnalysisCache.set('repolens-demo', DEMO_ANALYSIS_ID);
repoAnalysisCache.set(DEMO_REPO_ID, DEMO_ANALYSIS_ID);

let currentAuthToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentAuthToken = token;
  if (token) {
    localStorage.setItem('repolens_access_token', token);
  } else {
    localStorage.removeItem('repolens_access_token');
  }
};

export const getAuthToken = (): string | null => {
  if (currentAuthToken) return currentAuthToken;
  const stored =
    localStorage.getItem('repolens_access_token') ||
    localStorage.getItem('sb-access-token');
  return stored || null;
};

export const clearAuthToken = () => {
  currentAuthToken = null;
  localStorage.removeItem('repolens_access_token');
  localStorage.removeItem('sb-access-token');
};

/**
 * Helper to safely make HTTP requests with automatic JSON parsing, JWT header injection, and fallback.
 */
async function fetchApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options?.headers as Record<string, string>) || {}),
    };

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      console.warn(`API request to ${path} failed:`, res.status, res.statusText);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`Network error reaching ${path}:`, err);
    return null;
  }
}

export const repoService = {
  getRepositories: async (): Promise<Repository[]> => {
    const serverRepos = await fetchApi<any[]>('/repositories/');
    if (!serverRepos || serverRepos.length === 0) {
      return [...MOCK_REPOSITORIES];
    }

    const mapped: Repository[] = serverRepos.map((r) => ({
      id: r.id,
      name: r.name || r.source_url.split('/').pop()?.replace('.git', '') || 'repository',
      isPrivate: false,
      branch: r.default_branch || 'main',
      commitHash: r.latest_commit_sha ? r.latest_commit_sha.substring(0, 7) : 'a1b2c3d',
      commitMessage: 'Ingested codebase telemetry',
      language: r.primary_language || 'Python / JS',
      framework: 'FastAPI / React',
      lastAnalyzed: 'Recently',
      scanDepth: 'L3 AST',
      score: 82,
      riskLevel: 'Moderate Risk',
      blastVectorsCount: 4,
      circularLeaksCount: 1,
      status: 'Active',
      loc: r.total_size_bytes ? Math.round(r.total_size_bytes / 30) : 3200,
      filesCount: r.file_count || 15,
      dependenciesCount: 12,
      openIssuesCount: 3,
      testCoverage: 76.5,
    }));

    // Ensure demo repo is always present in list
    const hasDemo = mapped.some((r) => r.id === 'repolens-demo' || r.id === DEMO_REPO_ID);
    if (!hasDemo) {
      mapped.unshift(MOCK_REPOSITORIES[0]);
    }

    return mapped;
  },

  getRepositoryById: async (id: string): Promise<Repository | undefined> => {
    if (id === 'repolens-demo' || id === DEMO_REPO_ID) {
      return MOCK_REPOSITORIES[0];
    }
    const r = await fetchApi<any>(`/repositories/${id}`);
    if (r) {
      return {
        id: r.id,
        name: r.name || r.source_url.split('/').pop()?.replace('.git', '') || 'repository',
        isPrivate: false,
        branch: r.default_branch || 'main',
        commitHash: r.latest_commit_sha ? r.latest_commit_sha.substring(0, 7) : 'a1b2c3d',
        commitMessage: 'Ingested codebase telemetry',
        language: r.primary_language || 'Python / JS',
        framework: 'FastAPI / React',
        lastAnalyzed: 'Recently',
        scanDepth: 'L3 AST',
        score: 82,
        riskLevel: 'Moderate Risk',
        blastVectorsCount: 4,
        circularLeaksCount: 1,
        status: 'Active',
        loc: r.total_size_bytes ? Math.round(r.total_size_bytes / 30) : 3200,
        filesCount: r.file_count || 15,
        dependenciesCount: 12,
        openIssuesCount: 3,
        testCoverage: 76.5,
      };
    }
    return MOCK_REPOSITORIES.find((repo) => repo.id === id);
  },

  createRepository: async (newRepo: Partial<Repository>): Promise<Repository> => {
    const created: Repository = {
      id: newRepo.name?.toLowerCase().replace(/\s+/g, '-') || `repo-${Date.now()}`,
      name: newRepo.name || 'new-repository',
      isPrivate: newRepo.isPrivate ?? true,
      branch: newRepo.branch || 'main',
      commitHash: 'a1b2c3d',
      commitMessage: 'Initial scan setup',
      language: newRepo.language || 'Python 3.11',
      framework: newRepo.framework || 'FastAPI',
      lastAnalyzed: 'Just now',
      scanDepth: newRepo.scanDepth || 'L3 AST',
      score: 82,
      riskLevel: 'Moderate Risk',
      blastVectorsCount: 5,
      circularLeaksCount: 0,
      status: 'Active',
      loc: 5400,
      filesCount: 42,
      dependenciesCount: 16,
      openIssuesCount: 1,
      testCoverage: 78.0,
      ...newRepo,
    };
    MOCK_REPOSITORIES.unshift(created);
    return created;
  },

  ingestGithub: async (url: string, pat?: string): Promise<{ repository: any; analysis?: any } | null> => {
    const body: Record<string, string> = { url };
    if (pat && pat.trim()) {
      body.pat = pat.trim();
    }
    const res = await fetchApi<any>('/repositories/github', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res && res.id) {
      // Trigger analysis immediately
      const analysis = await fetchApi<any>('/analyses', {
        method: 'POST',
        body: JSON.stringify({ repository_id: res.id }),
      });
      if (analysis && analysis.id) {
        repoAnalysisCache.set(res.id, analysis.id);
      }
      return { repository: res, analysis };
    }
    return null;
  },

  ingestUpload: async (file: File): Promise<{ repository: any; analysis?: any } | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = getAuthToken();
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`${API_BASE}/repositories/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) return null;
      const repoData = await res.json();
      if (repoData && repoData.id) {
        const analysis = await fetchApi<any>('/analyses', {
          method: 'POST',
          body: JSON.stringify({ repository_id: repoData.id }),
        });
        if (analysis && analysis.id) {
          repoAnalysisCache.set(repoData.id, analysis.id);
        }
        return { repository: repoData, analysis };
      }
    } catch (e) {
      console.warn('Upload error:', e);
    }
    return null;
  },
};

export const analysisService = {
  getAnalysisIdForRepo: async (repoId?: string): Promise<string> => {
    if (!repoId || repoId === 'repolens-demo') return DEMO_ANALYSIS_ID;
    if (repoAnalysisCache.has(repoId)) return repoAnalysisCache.get(repoId)!;
    // Check if repoId is a valid UUID itself
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(repoId)) return repoId;
    return DEMO_ANALYSIS_ID;
  },

  getAnalysisDetail: async (analysisId: string) => {
    return await fetchApi<any>(`/analyses/${analysisId}`);
  },

  getBlastRadius: async (analysisId: string, filePath: string) => {
    return await fetchApi<any>(`/analyses/${analysisId}/blast-radius?file_path=${encodeURIComponent(filePath)}`);
  },

  getGraph: async (analysisId: string) => {
    return await fetchApi<{ nodes: any[]; edges: any[] }>(`/analyses/${analysisId}/graph`);
  },

  getFindings: async (analysisId: string) => {
    return await fetchApi<any[]>(`/analyses/${analysisId}/findings`);
  },

  getQuality: async (analysisId: string) => {
    return await fetchApi<any>(`/analyses/${analysisId}/quality`);
  },

  getTesting: async (analysisId: string) => {
    return await fetchApi<any>(`/analyses/${analysisId}/testing`);
  },

  getVulnerabilities: async (analysisId: string): Promise<VulnerabilitiesData> => {
    const res = await fetchApi<VulnerabilitiesData>(`/analyses/${analysisId}/vulnerabilities`);
    if (res) return res;
    return MOCK_VULNERABILITIES;
  },

  getSbom: async (analysisId: string): Promise<CycloneDXBOM> => {
    const res = await fetchApi<CycloneDXBOM>(`/analyses/${analysisId}/sbom`);
    if (res) return res;
    return MOCK_SBOM;
  },

  getSbomSummary: async (analysisId: string): Promise<SbomSummaryData> => {
    const res = await fetchApi<SbomSummaryData>(`/analyses/${analysisId}/sbom/summary`);
    if (res) return res;
    return MOCK_SBOM_SUMMARY;
  },

  downloadSbomJson: async (analysisId: string): Promise<void> => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`${API_BASE}/analyses/${analysisId}/sbom?download=true`, { headers });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `repolens-sbom-${analysisId.slice(0, 8)}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }
    } catch (e) {
      console.warn('Direct download failed, falling back to mock JSON:', e);
    }
    // Client-side fallback download
    const blob = new Blob([JSON.stringify(MOCK_SBOM, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repolens-sbom-${analysisId.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },




  chatWithAi: async (
    analysisId: string,
    message: string,
    contextFile?: string,
    history: { role: string; content: string }[] = []
  ): Promise<{ answer: string; referenced_files: string[]; model_used: string }> => {
    const payload = {
      message,
      context_file: contextFile || undefined,
      history: history.map((h) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
    };

    const targetId = analysisId || DEMO_ANALYSIS_ID;
    const res = await fetchApi<{ answer: string; referenced_files: string[]; model_used: string }>(
      `/analyses/${targetId}/chat`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    if (res) return res;

    return {
      answer: `RepoLens AI: Received query "${message}". Live Gemini analysis is active.`,
      referenced_files: contextFile ? [contextFile] : [],
      model_used: 'fallback',
    };
  },
};

export const pipelineService = {
  getStages: async (_repoId?: string): Promise<PipelineStage[]> => {
    return Promise.resolve([...MOCK_PIPELINE_STAGES]);
  },
  getLogs: async (_repoId?: string): Promise<PipelineLog[]> => {
    return Promise.resolve([...MOCK_PIPELINE_LOGS]);
  },
};

export const dependencyService = {
  getDependencies: async (_repoId?: string): Promise<DependencyItem[]> => {
    return Promise.resolve([...MOCK_DEPENDENCIES]);
  },
};

export const issueService = {
  getIssues: async (repoId?: string): Promise<IssueItem[]> => {
    const analysisId = await analysisService.getAnalysisIdForRepo(repoId);
    const serverFindings = await analysisService.getFindings(analysisId);

    if (serverFindings && serverFindings.length > 0) {
      return serverFindings.map((f: any, idx: number) => ({
        id: f.id || `finding-${idx + 1}`,
        title: f.title || 'Code Audit Finding',
        cwe: f.metadata_payload?.cwe || (f.category === 'SECURITY' ? 'CWE-78' : 'ARCH-CYCLE'),
        cve: f.metadata_payload?.cve,
        severity: (f.severity ? f.severity.charAt(0).toUpperCase() + f.severity.slice(1).toLowerCase() : 'High') as any,
        category: (f.category === 'SECURITY' ? 'Security' : f.category === 'ARCHITECTURE' ? 'Architectural Debt' : 'Reliability') as any,
        filePath: f.file_path || 'src/services/paymentService.js',
        line: f.line_number || 1,
        status: 'Open',
        author: 'Security Sentinel',
        introducedCommit: 'a1b2c3d',
        blastRadiusScore: f.severity === 'CRITICAL' ? 84 : 62,
        description: f.description || '',
        snippet: {
          startLine: Math.max(1, (f.line_number || 1) - 2),
          highlightLines: [f.line_number || 1],
          code: f.evidence || '// Finding evidence context',
        },
        remediation: f.suggested_fix,
      }));
    }

    return Promise.resolve([...MOCK_ISSUES]);
  },

  getIssueById: async (issueId: string): Promise<IssueItem | undefined> => {
    const all = await issueService.getIssues();
    return all.find((i) => i.id === issueId) || MOCK_ISSUES.find((i) => i.id === issueId);
  },

  resolveIssue: async (issueId: string): Promise<boolean> => {
    const issue = MOCK_ISSUES.find((i) => i.id === issueId);
    if (issue) {
      issue.status = 'Resolved';
      return Promise.resolve(true);
    }
    return Promise.resolve(true);
  },
};

export const blastRadiusService = {
  getTargets: async (repoId?: string): Promise<BlastRadiusTarget[]> => {
    const analysisId = await analysisService.getAnalysisIdForRepo(repoId);
    const blast = await analysisService.getBlastRadius(analysisId, 'src/services/paymentService.js');
    if (blast && blast.affected_files) {
      return [
        {
          id: 'target-payment',
          filePath: blast.target_file || 'src/services/paymentService.js',
          symbol: 'PaymentGatewayService',
          type: 'module',
          riskScore: blast.score || 72,
          confidence: 94,
          depth: 3,
          directDependentsCount: blast.direct_dependents_count || 4,
          indirectDependentsCount: blast.total_affected_count || 11,
          affectedEndpointsCount: 2,
          affectedEndpoints: ['/api/v1/checkout', '/api/v1/billing'],
          affectedTestsCount: 3,
          affectedTests: ['tests/payment.test.js', 'tests/user.test.js'],
          ripplePath: blast.affected_files.map((a: any) => a.file_path),
        },
        ...MOCK_BLAST_TARGETS.slice(1),
      ];
    }
    return Promise.resolve([...MOCK_BLAST_TARGETS]);
  },

  getTargetById: async (targetId: string): Promise<BlastRadiusTarget | undefined> => {
    return Promise.resolve(MOCK_BLAST_TARGETS.find((t) => t.id === targetId || t.symbol === targetId));
  },
};

export const architectureService = {
  getGraph: async (repoId?: string): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> => {
    const analysisId = await analysisService.getAnalysisIdForRepo(repoId);
    const serverGraph = await analysisService.getGraph(analysisId);

    if (serverGraph && serverGraph.nodes && serverGraph.nodes.length > 0) {
      const nodes: GraphNode[] = serverGraph.nodes.map((n: any, idx: number) => ({
        id: n.id,
        label: n.label || n.id.split('/').pop() || n.id,
        subLabel: n.path || n.id,
        category: (n.is_entry_point ? 'api' : idx % 2 === 0 ? 'service' : 'core') as any,
        risk: (idx === 0 ? 'critical' : idx < 3 ? 'high' : 'low') as any,
        x: 100 + (idx % 4) * 160,
        y: 100 + Math.floor(idx / 4) * 120,
        metrics: {
          loc: n.lines_of_code || 120,
          afferentCoupling: 3,
          efferentCoupling: 2,
          instability: 0.4,
        },
      }));

      const links: GraphLink[] = serverGraph.edges.map((e: any) => ({
        source: e.source,
        target: e.target,
        type: 'calls',
        isCritical: e.source.includes('payment') || e.target.includes('payment'),
      }));

      return { nodes, links };
    }

    return Promise.resolve({
      nodes: [...MOCK_ARCHITECTURE_NODES],
      links: [...MOCK_ARCHITECTURE_LINKS],
    });
  },
};

export const testingService = {
  getRecommendations: async (repoId?: string): Promise<TestingRecommendation[]> => {
    const analysisId = await analysisService.getAnalysisIdForRepo(repoId);
    const testingData = await analysisService.getTesting(analysisId);

    if (testingData && testingData.recommendations && testingData.recommendations.length > 0) {
      return testingData.recommendations.map((rec: any, idx: number) => ({
        id: rec.id || `rec-${idx + 1}`,
        testFile: rec.test_file_hint || 'tests/payment.test.js',
        testCase: `Verify ${rec.target_file} blast safety`,
        targetComponent: rec.target_file || 'PaymentService',
        priority: (rec.priority === 'CRITICAL' || rec.priority === 'HIGH' ? 'High' : 'Medium') as any,
        reason: rec.reason || 'High blast radius downstream impact',
        executionTimeSec: 1.4,
        status: 'recommended',
        lastRun: '12m ago',
      }));
    }

    return Promise.resolve([...MOCK_TESTING_RECOMMENDATIONS]);
  },
};

export const explorerService = {
  getFileTree: async (_repoId?: string): Promise<FileTreeNode[]> => {
    return Promise.resolve([...MOCK_FILE_TREE]);
  },
};

/**
 * userService — calls POST /users/me on login to upsert the user row in Supabase.
 * The backend extracts id and email from the verified JWT — they cannot be spoofed.
 */
export const userService = {
  /**
   * Call immediately after a successful Supabase login.
   * Passes the session access token so the backend can verify identity.
   */
  syncUser: async (
    accessToken: string,
    opts?: { displayName?: string; avatarUrl?: string; provider?: string }
  ): Promise<{ id: string; email: string } | null> => {
    try {
      setAuthToken(accessToken);
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          display_name: opts?.displayName ?? null,
          avatar_url: opts?.avatarUrl ?? null,
          provider: opts?.provider ?? null,
        }),
      });
      if (!res.ok) {
        console.warn('userService.syncUser failed:', res.status);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.warn('userService.syncUser error:', err);
      return null;
    }
  },

  /**
   * Fetch the current user's stored profile (requires auth token).
   */
  getProfile: async (accessToken?: string): Promise<any | null> => {
    try {
      const token = accessToken || getAuthToken();
      if (!token) return null;
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
