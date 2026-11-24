import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createGithubAuthServer } from '../../infra/github-auth/server.mjs';

const APP_ORIGIN = 'https://customizer.example';
const CALLBACK = `${APP_ORIGIN}/keyboards/`;
const VERIFIER = 'a'.repeat(64);
const CONFIG = { clientId: 'test-client', clientSecret: 'test-secret', callbackUrl: CALLBACK };

async function startServer(context, requestToken) {
  const server = createGithubAuthServer({ ...CONFIG, requestToken });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => {
    server.close();
  });
  return `http://127.0.0.1:${server.address().port}`;
}

function postToken(base, origin, body) {
  return fetch(`${base}/token`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body,
  });
}

test('authorization keeps the client secret and refresh token out of browser responses', async (context) => {
  const requests = [];
  const base = await startServer(context, (url, options) => {
    requests.push({ url, form: Object.fromEntries(options.body) });
    return Response.json({ access_token: 'ghu_test', refresh_token: 'ghr_test' });
  });
  const config = await fetch(`${base}/config`);
  assert.deepEqual(await config.json(), { clientId: CONFIG.clientId, callbackUrl: CALLBACK });
  const response = await postToken(
    base,
    APP_ORIGIN,
    JSON.stringify({ code: 'valid-code', verifier: VERIFIER }),
  );
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('access-control-allow-origin'), APP_ORIGIN);
  assert.deepEqual(await response.json(), { token: 'ghu_test' });
  assert.deepEqual(requests, [
    {
      url: 'https://github.com/login/oauth/access_token',
      form: {
        client_id: CONFIG.clientId,
        client_secret: CONFIG.clientSecret,
        redirect_uri: CALLBACK,
        code: 'valid-code',
        code_verifier: VERIFIER,
      },
    },
  ]);
});

test('authorization rejects other origins and malformed requests before calling GitHub', async (context) => {
  const upstream = context.mock.fn();
  const base = await startServer(context, upstream);
  const blocked = await postToken(
    base,
    'https://other.example',
    JSON.stringify({ code: 'valid-code', verifier: VERIFIER }),
  );
  const malformed = await postToken(base, APP_ORIGIN, '{"code": "only-code"}');
  assert.equal(blocked.status, 403);
  assert.equal(malformed.status, 400);
  assert.equal(upstream.mock.callCount(), 0);
});
