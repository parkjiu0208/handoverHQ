import type { User } from '@supabase/supabase-js';
import { roleValues, type UserRole } from '../types/domain';
import { STORAGE_KEYS } from './constants';
import { appEnv } from './env';

const roleSet = new Set<string>(roleValues);

export interface PendingAuthProfile {
  email?: string;
  displayName: string;
  primaryRole: UserRole | null;
  provider?: 'email' | 'github';
  returnTo?: string;
}

export function normalizeUserRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') {
    return null;
  }

  return roleSet.has(value) ? (value as UserRole) : null;
}

export const parseUserRole = normalizeUserRole;

export function getUserDisplayName(
  user: Pick<User, 'email' | 'user_metadata'>,
  fallbackDisplayName?: string | null
) {
  return (
    fallbackDisplayName?.trim() ||
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    '참가자'
  );
}

export function readPendingAuthProfile() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEYS.pendingAuthProfile);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PendingAuthProfile>;
    return {
      email: typeof parsed.email === 'string' ? parsed.email.trim() : '',
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName.trim() : '',
      primaryRole: normalizeUserRole(parsed.primaryRole),
      provider: parsed.provider === 'github' ? 'github' : parsed.provider === 'email' ? 'email' : undefined,
      returnTo: typeof parsed.returnTo === 'string' ? parsed.returnTo : undefined,
    };
  } catch {
    return null;
  }
}

export function writePendingAuthProfile(profile: PendingAuthProfile) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEYS.pendingAuthProfile,
    JSON.stringify({
      email: profile.email?.trim() ?? '',
      displayName: profile.displayName.trim(),
      primaryRole: profile.primaryRole,
      provider: profile.provider,
      returnTo: profile.returnTo,
    })
  );
}

export function clearPendingAuthProfile() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.pendingAuthProfile);
}

export function getCurrentAuthReturnUrl() {
  if (typeof window === 'undefined') {
    return appEnv.appUrl || '';
  }

  const baseUrl = appEnv.appUrl?.trim() || window.location.origin;
  const resolvedBase = new URL(baseUrl, window.location.origin);

  return new URL(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
    resolvedBase
  ).toString();
}
