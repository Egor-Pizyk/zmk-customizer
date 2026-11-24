import { createServer } from 'node:http';

function readCallbackUrl(value) {
  if (!value) {
    throw new Error('Set GITHUB_CALLBACK_URL.');
  }
  const callback = new URL(value);
  const localhost = ['localhost', '127.0.0.1', '[::1]'].includes(callback.hostname);
  const supportedProtocol =
    callback.protocol === 'https:' || (localhost && callback.protocol === 'http:');
  if (
    !supportedProtocol ||
    callback.search ||
    callback.hash ||
    callback.username ||
    callback.password
  ) {
    throw new Error(
      'Use an HTTPS callback URL or localhost, without credentials, query or fragment.',
    );
  }
  return callback;
}

function respond(response, origin, status, value) {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Origin',
  });
  response.end(value === undefined ? undefined : JSON.stringify(value));
}

async function readCredentials(request) {
  if (request.headers['content-type'] !== 'application/json') {
    return undefined;
  }
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 1024) {
      return undefined;
    }
  }
  const value = JSON.parse(raw);
  if (
    value &&
    typeof value.code === 'string' &&
    /^[a-zA-Z0-9_-]{1,256}$/u.test(value.code) &&
    typeof value.verifier === 'string' &&
    /^[a-f0-9]{64}$/u.test(value.verifier)
  ) {
    return value;
  }
  return undefined;
}

async function exchange(request, send, { clientId, clientSecret, callback, requestToken }) {
  let credentials;
  try {
    credentials = await readCredentials(request);
  } catch {
    send(400, { error: 'Invalid authorization request.' });
    return;
  }
  if (credentials === undefined) {
    send(400, { error: 'Invalid authorization request.' });
    return;
  }
  try {
    const result = await requestToken('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callback.href,
        code: credentials.code,
        code_verifier: credentials.verifier,
      }),
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    const value = await result.json();
    if (
      !result.ok ||
      typeof value?.access_token !== 'string' ||
      !value.access_token.startsWith('ghu_')
    ) {
      send(401, { error: 'GitHub authorization expired or was declined.' });
      return;
    }
    send(200, { token: value.access_token });
  } catch {
    send(502, { error: 'GitHub authorization is unavailable.' });
  }
}

export function createGithubAuthServer({
  clientId,
  clientSecret,
  callbackUrl,
  requestToken = fetch,
}) {
  if (!clientId || !clientSecret) {
    throw new Error('Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.');
  }
  const callback = readCallbackUrl(callbackUrl);
  return createServer({ requestTimeout: 15_000, headersTimeout: 10_000 }, (request, response) => {
    const send = (status, value) => respond(response, callback.origin, status, value);
    const origin = request.headers.origin;
    if (origin !== callback.origin && (request.method !== 'GET' || origin !== undefined)) {
      send(403, { error: 'Origin is not allowed.' });
      return;
    }
    if (request.method === 'OPTIONS' && ['/config', '/token'].includes(request.url)) {
      send(204);
      return;
    }
    if (request.method === 'GET' && request.url === '/config') {
      send(200, { clientId, callbackUrl: callback.href });
      return;
    }
    if (request.method === 'POST' && request.url === '/token') {
      void exchange(request, send, { clientId, clientSecret, callback, requestToken });
      return;
    }
    send(404, { error: 'Route not found.' });
  });
}

if (import.meta.main) {
  const server = createGithubAuthServer({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: process.env.GITHUB_CALLBACK_URL,
  });
  server.listen(Number(process.env.PORT ?? 8787), process.env.HOST ?? '127.0.0.1');
}
