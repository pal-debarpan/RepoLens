/**
 * RepoLens Auth Service
 *
 * Calls the backend /auth/* endpoints which proxy to Supabase Auth.
 * The Supabase anon key never touches the frontend bundle.
 */

import { api, setStoredToken, clearStoredToken } from './api';
import type { AuthResponse, UserProfile } from '../types';

const USER_KEY = 'repolens_user';

// ─── Stored User Helpers ──────────────────────────────────────────────────────

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: UserProfile): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearStoredUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

// ─── Auth API Calls ───────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  full_name?: string;
}

/**
 * Sign in with email + password.
 * Returns the access token and saves it to localStorage.
 */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login', payload, { noAuth: true });

  if (res.access_token) {
    setStoredToken(res.access_token);
  }

  const userData = res.user ?? {};
  const email = (userData.email as string | undefined) ?? payload.email;
  const fullName =
    (userData.user_metadata?.full_name as string | undefined) ??
    email.split('@')[0];

  const profile: UserProfile = { email, name: fullName, id: userData.id as string | undefined };
  setStoredUser(profile);

  return res;
}

/**
 * Register a new account.
 * If Supabase returns an access_token directly (email confirmation disabled),
 * stores it. Otherwise, prompts the user to check their email.
 */
export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/signup', payload, { noAuth: true });

  if (res.access_token) {
    setStoredToken(res.access_token);

    const userData = res.user ?? {};
    const email = (userData.email as string | undefined) ?? payload.email;
    const fullName = payload.full_name ?? email.split('@')[0];
    const profile: UserProfile = { email, name: fullName, id: userData.id as string | undefined };
    setStoredUser(profile);
  }

  return res;
}

/**
 * Sign out — clears local token and user profile.
 */
export function logout(): void {
  clearStoredToken();
  clearStoredUser();
}

/** Verify that the persisted browser token is still accepted by FastAPI. */
export async function getCurrentUser(): Promise<UserProfile> {
  const user = await api.get<{ id: string; email?: string; user_metadata?: { full_name?: string } }>('/auth/me');
  if (!user.email) throw new Error('Authenticated session has no email claim.');
  const profile: UserProfile = { id: user.id, email: user.email, name: user.user_metadata?.full_name ?? user.email.split('@')[0] };
  setStoredUser(profile);
  return profile;
}
