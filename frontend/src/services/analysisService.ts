/**
 * RepoLens Analysis Service
 *
 * Calls /api/v1/analyses/* endpoints.
 * Covers: create, list, get, vulnerabilities, SBOM, graph, blast-radius, findings, quality, testing, UML, chat.
 */

import { api } from './api';
import type {
  BackendAnalysis,
  BackendAnalysisDetail,
  VulnerabilitiesResponse,
  SbomSummaryResponse,
  GraphResponse,
  BlastRadiusResponse,
  FindingResponse,
  QualityResponse,
  UmlResponse,
  ChatMessage,
} from '../types';

// ─── Analysis CRUD ────────────────────────────────────────────────────────────

export interface CreateAnalysisPayload {
  repository_id: string;
  commit_sha?: string;
}

/**
 * Trigger a new analysis pipeline for a repository.
 * Returns immediately with PENDING status — poll until COMPLETED/FAILED.
 */
export async function createAnalysis(payload: CreateAnalysisPayload): Promise<BackendAnalysis> {
  return api.post<BackendAnalysis>('/api/v1/analyses', payload);
}

/**
 * Get the authenticated user's analysis history.
 */
export async function getAnalyses(limit = 20, offset = 0, repositoryId?: string): Promise<BackendAnalysis[]> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (repositoryId) params.append('repository_id', repositoryId);
  return api.get<BackendAnalysis[]>(`/api/v1/analyses?${params.toString()}`);
}

/**
 * Get full analysis detail including embedded graph, quality, vulnerabilities, SBOM, findings.
 */
export async function getAnalysis(analysisId: string): Promise<BackendAnalysisDetail> {
  return api.get<BackendAnalysisDetail>(`/api/v1/analyses/${analysisId}`);
}

// ─── Sub-resources ────────────────────────────────────────────────────────────

/**
 * Get OSV vulnerability scan results for an analysis.
 */
export async function getVulnerabilities(analysisId: string): Promise<VulnerabilitiesResponse> {
  return api.get<VulnerabilitiesResponse>(`/api/v1/analyses/${analysisId}/vulnerabilities`);
}

/**
 * Get SBOM summary for an analysis.
 */
export async function getSbomSummary(analysisId: string): Promise<SbomSummaryResponse> {
  return api.get<SbomSummaryResponse>(`/api/v1/analyses/${analysisId}/sbom/summary`);
}

/**
 * Get the dependency graph for an analysis.
 */
export async function getGraph(analysisId: string): Promise<GraphResponse> {
  return api.get<GraphResponse>(`/api/v1/analyses/${analysisId}/graph`);
}

/**
 * Get blast radius for a specific file within an analysis.
 * @param filePath - Relative path within the repository (e.g. "src/services/payment.js")
 */
export async function getBlastRadius(
  analysisId: string,
  filePath: string,
): Promise<BlastRadiusResponse> {
  const encoded = encodeURIComponent(filePath);
  return api.get<BlastRadiusResponse>(
    `/api/v1/analyses/${analysisId}/blast-radius?file_path=${encoded}`,
  );
}

export interface FindingFilters {
  category?: string;
  severity?: string;
  file_path?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get all findings (security issues) for an analysis.
 */
export async function getFindings(
  analysisId: string,
  filters: FindingFilters = {},
): Promise<FindingResponse[]> {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.file_path) params.set('file_path', filters.file_path);
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined) params.set('offset', String(filters.offset));

  const qs = params.toString();
  return api.get<FindingResponse[]>(
    `/api/v1/analyses/${analysisId}/findings${qs ? `?${qs}` : ''}`,
  );
}

/**
 * Get a single finding by ID.
 */
export async function getFinding(analysisId: string, findingId: string): Promise<FindingResponse> {
  return api.get<FindingResponse>(`/api/v1/analyses/${analysisId}/findings/${findingId}`);
}

/**
 * Get quality assessment for an analysis.
 */
export async function getQuality(analysisId: string): Promise<QualityResponse> {
  return api.get<QualityResponse>(`/api/v1/analyses/${analysisId}/quality`);
}

/**
 * Get UML architecture diagram for an analysis.
 */
export async function getUml(analysisId: string): Promise<UmlResponse> {
  return api.get<UmlResponse>(`/api/v1/analyses/${analysisId}/architecture/uml`);
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export interface ChatPayload {
  message: string;
  context?: string;
}

export interface BackendChatResponse {
  reply: string;
  model_used?: string;
}

/**
 * Send a message to Gemini AI about an analysis.
 */
export async function chat(
  analysisId: string,
  payload: ChatPayload,
): Promise<BackendChatResponse> {
  return api.post<BackendChatResponse>(`/api/v1/analyses/${analysisId}/chat`, payload);
}

// ─── Polling Helper ───────────────────────────────────────────────────────────

/**
 * Poll an analysis until it reaches a terminal status (COMPLETED or FAILED).
 * Calls onUpdate with each status check.
 * Returns a cancel function — call it to stop polling.
 *
 * @param analysisId - The analysis ID to poll
 * @param onUpdate - Callback invoked with the latest analysis on each poll
 * @param intervalMs - Poll interval in milliseconds (default 3000)
 */
export function pollAnalysis(
  analysisId: string,
  onUpdate: (analysis: BackendAnalysis) => void,
  intervalMs = 3000,
): () => void {
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const TERMINAL = new Set(['COMPLETED', 'FAILED']);

  async function tick() {
    if (cancelled) return;
    try {
      const analysis = await api.get<BackendAnalysis>(`/api/v1/analyses/${analysisId}`);
      if (!cancelled) {
        onUpdate(analysis);
        if (!TERMINAL.has(analysis.status)) {
          timeoutId = setTimeout(tick, intervalMs);
        }
      }
    } catch {
      // Network blip — retry
      if (!cancelled) {
        timeoutId = setTimeout(tick, intervalMs * 2);
      }
    }
  }

  // Start after a short delay to avoid immediate double-fetch
  timeoutId = setTimeout(tick, 500);

  return () => {
    cancelled = true;
    if (timeoutId !== null) clearTimeout(timeoutId);
  };
}
