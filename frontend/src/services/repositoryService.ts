/**
 * RepoLens Repository Service
 *
 * Calls /api/v1/repositories/* endpoints.
 */

import { api } from './api';
import type { BackendRepository } from '../types';

/**
 * List all repositories for the current user.
 */
export async function getRepositories(
  skip = 0,
  limit = 100,
): Promise<BackendRepository[]> {
  return api.get<BackendRepository[]>(`/api/v1/repositories/?skip=${skip}&limit=${limit}`);
}

/**
 * Get a single repository by ID.
 */
export async function getRepository(id: string): Promise<BackendRepository> {
  return api.get<BackendRepository>(`/api/v1/repositories/${id}`);
}

export interface GitHubIngestPayload {
  url: string;
  pat?: string;
}

/**
 * Ingest a GitHub repository by URL.
 * PAT is optional and only needed for private repositories.
 * PAT is never stored on the server.
 */
export async function ingestGitHub(payload: GitHubIngestPayload): Promise<BackendRepository> {
  return api.post<BackendRepository>('/api/v1/repositories/github', payload);
}

/**
 * Ingest a repository from a ZIP file upload.
 */
export async function ingestZip(file: File): Promise<BackendRepository> {
  const fd = new FormData();
  fd.append('file', file);
  return api.postForm<BackendRepository>('/api/v1/repositories/upload', fd);
}

/**
 * Delete a repository.
 */
export async function deleteRepository(id: string): Promise<void> {
  return api.delete<void>(`/api/v1/repositories/${id}`);
}
