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
} from '../types';

export const repoService = {
  getRepositories: async (): Promise<Repository[]> => {
    return Promise.resolve([...MOCK_REPOSITORIES]);
  },
  getRepositoryById: async (id: string): Promise<Repository | undefined> => {
    return Promise.resolve(MOCK_REPOSITORIES.find((r) => r.id === id));
  },
  createRepository: async (newRepo: Partial<Repository>): Promise<Repository> => {
    const baseId = newRepo.name?.toLowerCase().replace(/\s+/g, '-') || `repo-${Date.now()}`;
    const idExists = MOCK_REPOSITORIES.some((r) => r.id === baseId);
    const uniqueId = idExists ? `${baseId}-${Date.now().toString().slice(-4)}` : baseId;
    const created: Repository = {
      id: uniqueId,
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
    return Promise.resolve(created);
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
  getIssues: async (_repoId?: string): Promise<IssueItem[]> => {
    return Promise.resolve([...MOCK_ISSUES]);
  },
  getIssueById: async (issueId: string): Promise<IssueItem | undefined> => {
    return Promise.resolve(MOCK_ISSUES.find((i) => i.id === issueId));
  },
  resolveIssue: async (issueId: string): Promise<boolean> => {
    const issue = MOCK_ISSUES.find((i) => i.id === issueId);
    if (issue) {
      issue.status = 'Resolved';
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },
};

export const blastRadiusService = {
  getTargets: async (_repoId?: string): Promise<BlastRadiusTarget[]> => {
    return Promise.resolve([...MOCK_BLAST_TARGETS]);
  },
  getTargetById: async (targetId: string): Promise<BlastRadiusTarget | undefined> => {
    return Promise.resolve(MOCK_BLAST_TARGETS.find((t) => t.id === targetId || t.symbol === targetId));
  },
};

export const architectureService = {
  getGraph: async (_repoId?: string): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> => {
    return Promise.resolve({
      nodes: [...MOCK_ARCHITECTURE_NODES],
      links: [...MOCK_ARCHITECTURE_LINKS],
    });
  },
};

export const testingService = {
  getRecommendations: async (_repoId?: string): Promise<TestingRecommendation[]> => {
    return Promise.resolve([...MOCK_TESTING_RECOMMENDATIONS]);
  },
};

export const explorerService = {
  getFileTree: async (_repoId?: string): Promise<FileTreeNode[]> => {
    return Promise.resolve([...MOCK_FILE_TREE]);
  },
};
