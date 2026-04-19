import { browserStorage } from './storage-adapter';

const AUTH_STORAGE_KEY = 'qfc2_pb_auth';
// URL resolution order: VITE_POCKETBASE_URL env var → window.location.origin (production) → localhost fallback (local dev).
const FALLBACK_BASE_URL = 'http://127.0.0.1:8090';

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type AuthBootstrapResult =
  | { status: 'authenticated'; session: AuthSession }
  | { status: 'signed-out' }
  | { status: 'unavailable'; message: string };

export class PocketBaseAuthError extends Error {
  code: 'invalid-credentials' | 'unavailable' | 'unauthorized' | 'unexpected';

  constructor(code: PocketBaseAuthError['code'], message: string) {
    super(message);
    this.name = 'PocketBaseAuthError';
    this.code = code;
  }
}

export type PocketBaseAuthErrorCode = PocketBaseAuthError['code'];
export type PocketBaseErrorMessages = Partial<Record<PocketBaseAuthErrorCode, string>> & {
  fallback: string;
};

export function describePocketBaseError(error: unknown, messages: PocketBaseErrorMessages): string {
  if (error instanceof PocketBaseAuthError) {
    if (error.code === 'unavailable') {
      const detail = error.message.trim();
      if (detail && /collection|migration/i.test(detail)) {
        return detail;
      }
    }

    return messages[error.code] ?? messages.fallback;
  }

  return messages.fallback;
}

type AuthApiResponse = {
  token?: string;
  record?: {
    id?: string;
    email?: string;
  };
};

export function trimTrailingSlash(input: string): string {
  return input.replace(/\/+$/, '');
}

export function resolvePocketBaseBaseUrl(): string {
  const envValue = typeof import.meta !== 'undefined'
    ? ((import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env?.VITE_POCKETBASE_URL as string | undefined)
    : undefined;

  if (envValue && envValue.trim()) {
    return trimTrailingSlash(envValue.trim());
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  return FALLBACK_BASE_URL;
}

export function parseAuthSession(input: unknown): AuthSession | null {
  if (!input || typeof input !== 'object') return null;

  const token = typeof (input as any).token === 'string' ? (input as any).token : '';
  const user = (input as any).user;
  const id = typeof user?.id === 'string' ? user.id : '';
  const email = typeof user?.email === 'string' ? user.email : '';

  if (!token || !id || !email) {
    return null;
  }

  return {
    token,
    user: {
      id,
      email,
    },
  };
}

export function sessionFromAuthResponse(input: AuthApiResponse): AuthSession {
  const token = input?.token?.trim();
  const id = input?.record?.id?.trim();
  const email = input?.record?.email?.trim();

  if (!token || !id || !email) {
    throw new PocketBaseAuthError('unexpected', 'PocketBase returned an incomplete auth response.');
  }

  return {
    token,
    user: { id, email },
  };
}

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = resolvePocketBaseBaseUrl();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch (error) {
    throw new PocketBaseAuthError('unavailable', 'PocketBase could not be reached.');
  }

  let payload: any = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const message = typeof payload?.message === 'string'
      ? payload.message
      : typeof payload?.data?.message === 'string'
        ? payload.data.message
        : 'PocketBase request failed.';

    if (response.status === 400 || response.status === 404) {
      throw new PocketBaseAuthError('invalid-credentials', message || 'Invalid email or password.');
    }

    if (response.status === 401 || response.status === 403) {
      throw new PocketBaseAuthError('unauthorized', message || 'Your session is no longer valid.');
    }

    throw new PocketBaseAuthError('unavailable', message || 'PocketBase is currently unavailable.');
  }

  return payload as T;
}

async function readStoredSession(): Promise<AuthSession | null> {
  const raw = await browserStorage.getItem<unknown>(AUTH_STORAGE_KEY);
  const session = parseAuthSession(raw);

  if (!session && raw != null) {
    await clearStoredSession();
  }

  return session;
}

async function persistSession(session: AuthSession): Promise<void> {
  await browserStorage.setItem(AUTH_STORAGE_KEY, session);
}

async function clearStoredSession(): Promise<void> {
  await browserStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function checkPocketBaseAvailability(): Promise<void> {
  await requestJson<{ code: number; message: string; data?: { status?: string } }>('/api/health', {
    method: 'GET',
  });
}

export async function initializeAuth(): Promise<AuthBootstrapResult> {
  try {
    await checkPocketBaseAvailability();
  } catch {
    return {
      status: 'unavailable',
      message: 'PocketBase could not be reached.',
    };
  }

  const stored = await readStoredSession();
  if (!stored) {
    return { status: 'signed-out' };
  }

  try {
    const refreshed = await requestJson<AuthApiResponse>('/api/collections/users/auth-refresh', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stored.token}`,
      },
      body: JSON.stringify({}),
    });

    const session = sessionFromAuthResponse(refreshed);
    await persistSession(session);
    return {
      status: 'authenticated',
      session,
    };
  } catch (error) {
    if (error instanceof PocketBaseAuthError && error.code === 'unavailable') {
      return {
        status: 'unavailable',
        message: 'PocketBase could not be reached.',
      };
    }

    await clearStoredSession();
    return { status: 'signed-out' };
  }
}

export async function signInWithPassword(email: string, password: string): Promise<AuthSession> {
  const normalizedEmail = email.trim();
  if (!normalizedEmail || !password) {
    throw new PocketBaseAuthError('invalid-credentials', 'Enter both email and password.');
  }

  const payload = await requestJson<AuthApiResponse>('/api/collections/users/auth-with-password', {
    method: 'POST',
    body: JSON.stringify({
      identity: normalizedEmail,
      password,
    }),
  });

  const session = sessionFromAuthResponse(payload);
  await persistSession(session);
  return session;
}

export async function signOut(): Promise<void> {
  await clearStoredSession();
}

export async function changePassword(
  session: AuthSession,
  currentPassword: string,
  nextPassword: string,
): Promise<AuthSession> {
  const oldPassword = currentPassword.trim();
  const password = nextPassword.trim();

  if (!oldPassword || !password) {
    throw new PocketBaseAuthError('invalid-credentials', 'Enter your current password and a new password.');
  }

  await requestJson('/api/collections/users/records/' + session.user.id, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({
      oldPassword,
      password,
      passwordConfirm: password,
    }),
  });

  return signInWithPassword(session.user.email, password);
}

