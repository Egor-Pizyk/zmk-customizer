import { z } from 'zod';
import { requestGithub } from './request-github';
import type { GithubResult } from './request-github';

const AUTHORIZATION_DRAFT = 'zmk-customizer-github-authorization';
const authUrl: unknown = import.meta.env['VITE_GITHUB_AUTH_URL'];
const authorizationConfigSchema = z.object({
  clientId: z.string().min(1),
  callbackUrl: z.url(),
});
const credentialsSchema = z.object({
  token: z.string().min(1),
});
const draftSchema = z.object({
  state: z.uuid(),
  verifier: z.string().regex(/^[a-f0-9]{64}$/u),
});

export function getGithubInstallUrl(): string | undefined {
  const slug: unknown = import.meta.env['VITE_GITHUB_APP_SLUG'];
  return typeof slug === 'string' && /^[a-z\d-]+$/u.test(slug)
    ? `https://github.com/apps/${slug}/installations/new`
    : undefined;
}

export function isGithubConfigured(): boolean {
  return typeof authUrl === 'string' && authUrl !== '' && getGithubInstallUrl() !== undefined;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function beginGithubAuthorization(): Promise<GithubResult<URL>> {
  if (typeof authUrl !== 'string' || !isGithubConfigured()) {
    return { ok: false, error: 'GitHub sign-in is unavailable on this deployment.' };
  }
  const config = await requestGithub(`${authUrl}/config`, authorizationConfigSchema);
  if (!config.ok) {
    return config;
  }
  const callback = new URL(config.value.callbackUrl);
  if (callback.origin !== globalThis.location.origin) {
    return { ok: false, error: 'GitHub sign-in is configured for another site.' };
  }
  try {
    const state = crypto.randomUUID();
    const verifier = toHex(crypto.getRandomValues(new Uint8Array(32)));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const challenge = btoa(String.fromCodePoint(...new Uint8Array(digest)))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '');
    globalThis.sessionStorage.setItem(AUTHORIZATION_DRAFT, JSON.stringify({ state, verifier }));
    const url = new URL('https://github.com/login/oauth/authorize');
    url.search = new URLSearchParams({
      client_id: config.value.clientId,
      redirect_uri: callback.href,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }).toString();
    return { ok: true, value: url };
  } catch {
    return {
      ok: false,
      error: 'Could not start sign-in. Use a secure tab with session storage enabled.',
    };
  }
}

export function hasGithubAuthorizationCallback(): boolean {
  const parameters = new URLSearchParams(globalThis.location.search);
  return parameters.has('state') && (parameters.has('code') || parameters.has('error'));
}

export async function completeGithubAuthorization(): Promise<GithubResult<string>> {
  const callback = new URL(globalThis.location.href);
  const code = callback.searchParams.get('code');
  const state = callback.searchParams.get('state');
  for (const key of ['code', 'state', 'error', 'error_description', 'error_uri']) {
    callback.searchParams.delete(key);
  }
  const invalidSession = {
    ok: false,
    error: 'GitHub sign-in was cancelled or expired. Sign in again.',
  } as const;
  try {
    globalThis.history.replaceState(null, '', callback);
    const raw = globalThis.sessionStorage.getItem(AUTHORIZATION_DRAFT);
    globalThis.sessionStorage.removeItem(AUTHORIZATION_DRAFT);
    if (raw === null || code === null || typeof authUrl !== 'string' || !isGithubConfigured()) {
      return invalidSession;
    }
    const draft = draftSchema.safeParse(JSON.parse(raw));
    if (!draft.success || draft.data.state !== state) {
      return invalidSession;
    }
    const credentials = await requestGithub(`${authUrl}/token`, credentialsSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, verifier: draft.data.verifier }),
    });
    return credentials.ok ? { ok: true, value: credentials.value.token } : credentials;
  } catch {
    return invalidSession;
  }
}
