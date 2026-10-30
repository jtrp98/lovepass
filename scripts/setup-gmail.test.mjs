import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { authorizeGmail, withGmailConfiguration } from './setup-gmail.mjs';

const scope = 'https://www.googleapis.com/auth/gmail.send';
const credentials = { client_id: 'desktop-client', client_secret: 'desktop-secret' };

test('Gmail consent uses only sending scope, PKCE and state; invalid state cannot exchange a code', async (t) => {
  const realFetch = globalThis.fetch;
  let authorization;
  let exchanges = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://oauth2.googleapis.com/token');
    exchanges++;
    assert.equal(options.redirect, 'error');
    assert.equal(options.body.get('client_id'), credentials.client_id);
    assert.equal(options.body.get('client_secret'), credentials.client_secret);
    assert.equal(options.body.get('grant_type'), 'authorization_code');
    assert.equal(options.body.get('code'), 'test-code');
    assert.equal(createHash('sha256').update(options.body.get('code_verifier')).digest('base64url'), authorization.searchParams.get('code_challenge'));
    return Response.json({ refresh_token: 'new-refresh-token', scope });
  });
  let callback;
  const pending = authorizeGmail(credentials, 'sender@gmail.com', (link) => {
    authorization = new URL(link);
    assert.equal(authorization.origin, 'https://accounts.google.com');
    assert.equal(authorization.searchParams.get('scope'), scope);
    assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(authorization.searchParams.get('access_type'), 'offline');
    assert.equal(authorization.searchParams.get('prompt'), 'consent');
    assert.equal(authorization.searchParams.get('login_hint'), 'sender@gmail.com');
    callback = (async () => {
      const redirect = new URL(authorization.searchParams.get('redirect_uri'));
      assert.equal(redirect.hostname, '127.0.0.1');
      redirect.search = new URLSearchParams({ state: 'wrong-state', code: 'stolen-code' });
      assert.equal((await realFetch(redirect)).status, 400);
      assert.equal(exchanges, 0);
      redirect.search = new URLSearchParams({ state: authorization.searchParams.get('state'), code: 'test-code' });
      const response = await realFetch(redirect);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.doesNotMatch(await response.text(), /new-refresh-token|desktop-secret/);
    })();
  });
  const settings = await pending;
  await callback;
  assert.equal(settings.Email__Provider, 'Gmail');
  assert.equal(settings.Gmail__RefreshToken, 'new-refresh-token');
  assert.equal(exchanges, 1);
});

test('declined consent leaves settings unavailable and never calls the token endpoint', async (t) => {
  const realFetch = globalThis.fetch;
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Must not exchange tokens'); });
  let callback;
  const pending = authorizeGmail(credentials, 'sender@gmail.com', (link) => {
    const auth = new URL(link);
    const redirect = new URL(auth.searchParams.get('redirect_uri'));
    redirect.search = new URLSearchParams({ state: auth.searchParams.get('state'), error: 'access_denied' });
    callback = realFetch(redirect);
  });
  await assert.rejects(pending, /cancelled or denied/);
  assert.equal((await callback).status, 400);
});

for (const token of [{ scope }, { refresh_token: 'token', scope: 'openid' }]) {
  test(`incomplete authorization is rejected: ${JSON.stringify(token)}`, async (t) => {
    const realFetch = globalThis.fetch;
    t.mock.method(globalThis, 'fetch', () => Promise.resolve(Response.json(token)));
    let callback;
    const pending = authorizeGmail(credentials, 'sender@gmail.com', (link) => {
      const auth = new URL(link);
      const redirect = new URL(auth.searchParams.get('redirect_uri'));
      redirect.search = new URLSearchParams({ state: auth.searchParams.get('state'), code: 'code' });
      callback = realFetch(redirect);
    });
    await assert.rejects(pending, /refresh token|permission/);
    assert.equal((await callback).status, 502);
  });
}

test('configuration update preserves unrelated secrets and comments, replaces duplicate keys and keeps CRLF', () => {
  const original = '# config\r\nJwt__SigningKey=keep-me\r\nEmail__Provider=Resend\r\nResend__ApiKey=preserved\r\nGmail__RefreshToken=old\r\nGmail__RefreshToken=duplicate\r\n';
  const values = { Email__Provider: 'Gmail', Gmail__SenderEmail: 'sender@gmail.com', Gmail__RefreshToken: 'new' };
  const updated = withGmailConfiguration(original, values);
  assert.ok(updated.startsWith('# config\r\nJwt__SigningKey=keep-me\r\nEmail__Provider=Gmail\r\nResend__ApiKey=preserved\r\n'));
  assert.equal(updated.match(/Gmail__RefreshToken=/g).length, 1);
  assert.ok(updated.includes('Gmail__RefreshToken=new\r\n'));
  assert.ok(updated.includes('Gmail__SenderEmail=sender@gmail.com\r\n'));
  assert.equal(withGmailConfiguration(updated, values), updated);
});

test('configuration values cannot inject other environment settings', () => {
  assert.throws(() => withGmailConfiguration('', { Gmail__RefreshToken: 'token\nOther=bad' }), /Invalid/);
  assert.throws(() => withGmailConfiguration('', { Jwt__SigningKey: 'bad' }), /Invalid/);
});
