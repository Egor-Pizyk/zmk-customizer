import type { Result } from '@domain';
import type { ZodType } from 'zod';

export type GithubResult<Value> = Result<Value, string>;

export async function requestGithub<Value>(
  url: string,
  schema: ZodType<Value>,
  init?: RequestInit,
): Promise<GithubResult<Value>> {
  try {
    // eslint-disable-next-line eslint/no-restricted-globals -- Optional GitHub I/O boundary (ADR 0028).
    const response = await fetch(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      return { ok: false, error: getRequestError(response.status) };
    }
    const parsed = schema.safeParse(await response.json());
    return parsed.success
      ? { ok: true, value: parsed.data }
      : { ok: false, error: 'GitHub returned an unexpected response. Refresh and try again.' };
  } catch {
    return { ok: false, error: 'Could not reach GitHub. Check your connection and try again.' };
  }
}

function getRequestError(status: number): string {
  switch (status) {
    case 401: {
      return 'GitHub sign-in expired or was revoked. Sign out and sign in again.';
    }
    case 403: {
      return 'GitHub denied access. Check the app permissions, repository access and rate limit.';
    }
    case 404: {
      return 'GitHub could not find this resource. Check the selected repository, branch and access.';
    }
    case 409: {
      return 'This repository has no usable branch. Initialize it with a README on GitHub first.';
    }
    case 429: {
      return 'GitHub is limiting requests. Wait a moment and try again.';
    }
    default: {
      return `GitHub request failed (${status}). Refresh and try again.`;
    }
  }
}
