import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scope = 'https://www.googleapis.com/auth/gmail.send';
const envPath = fileURLToPath(new URL('../backend/.env', import.meta.url));

// Run locally only: Google redirects to this temporary loopback listener, never the deployed API.
export async function authorizeGmail(credentials, senderEmail, showUrl = console.log) {
  const { client_id: clientId, client_secret: clientSecret } = credentials;
  if (!clientId || !clientSecret) throw new Error('The Desktop app JSON must contain client_id and client_secret.');
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(senderEmail)) throw new Error('Enter the Gmail address that will send notifications.');

  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');
  let redirectUri;
  let handling = false;
  let timer;
  let complete;
  let fail;
  const completed = new Promise((res, rej) => { complete = res; fail = rej; });
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    let url;
    try { url = new URL(req.url, redirectUri); }
    catch { res.writeHead(400).end('Invalid request'); return; }
    if (req.method !== 'GET' || req.headers.host !== new URL(redirectUri).host || url.pathname !== '/oauth2callback') {
      res.writeHead(404).end('Not found');
      return;
    }
    const returnedState = Buffer.from(url.searchParams.get('state') ?? '');
    const expectedState = Buffer.from(state);
    if (returnedState.length !== expectedState.length || !timingSafeEqual(returnedState, expectedState)) {
      res.writeHead(400).end('Invalid authorization state. Return to the original authorization link.');
      return;
    }
    if (handling) {
      res.writeHead(409).end('Authorization is already being processed.');
      return;
    }
    handling = true;
    if (url.searchParams.has('error') || !url.searchParams.get('code')) {
      res.writeHead(400).end('Authorization was not granted. You can close this page.');
      fail(new Error('Google authorization was cancelled or denied. No settings were changed.'));
      return;
    }
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(20_000),
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: url.searchParams.get('code'),
          code_verifier: verifier,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      if (!response.ok) throw new Error(`Google token exchange failed (HTTP ${response.status}). Check your OAuth client and try again.`);
      const token = await response.json();
      if (!token.scope?.split(' ').includes(scope)) throw new Error('Google did not grant permission to send email.');
      if (!token.refresh_token) throw new Error('Google did not return a refresh token. Run setup again and grant consent.');
      res.end('Google authorization received. Return to the terminal to check that settings were saved.');
      complete({
        Email__Provider: 'Gmail',
        Gmail__SenderEmail: senderEmail,
        Gmail__ClientId: clientId,
        Gmail__ClientSecret: clientSecret,
        Gmail__RefreshToken: token.refresh_token,
      });
    } catch (error) {
      res.writeHead(502).end('Could not finish Google authorization. Return to the terminal.');
      fail(error);
    }
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  server.maxHeadersCount = 50;
  try {
    await new Promise((res, rej) => {
      server.once('error', rej);
      server.listen(0, '127.0.0.1', res);
    });
    redirectUri = `http://127.0.0.1:${server.address().port}/oauth2callback`;
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      access_type: 'offline',
      prompt: 'consent',
      login_hint: senderEmail,
      state,
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      code_challenge_method: 'S256',
    }).toString();
    timer = setTimeout(() => fail(new Error('Authorization timed out after 5 minutes. Run setup again.')), 300_000);
    showUrl(url.toString());
    return await completed;
  } finally {
    clearTimeout(timer);
    await new Promise((res) => server.close(res));
  }
}

export function withGmailConfiguration(contents, values) {
  const newline = contents.includes('\r\n') ? '\r\n' : '\n';
  const remaining = { ...values };
  for (const [key, value] of Object.entries(remaining)) {
    if (!/^(Email__Provider|Gmail__(SenderEmail|ClientId|ClientSecret|RefreshToken))$/.test(key)
      || typeof value !== 'string' || !value.trim() || /[\r\n"\0]/.test(value)) {
      throw new Error('Invalid Gmail configuration. No settings were written.');
    }
  }
  const seen = new Set();
  const lines = contents.split(/\r?\n/).flatMap((line) => {
    const key = line.match(/^\s*([^#=\s]+)\s*=/)?.[1];
    if (!Object.hasOwn(values, key)) return [line];
    if (seen.has(key)) return [];
    seen.add(key);
    delete remaining[key];
    return [`${key}=${values[key]}`];
  });
  while (lines.at(-1) === '') lines.pop();
  lines.push(...Object.entries(remaining).map(([key, value]) => `${key}=${value}`));
  return lines.join(newline) + newline;
}

async function main() {
  const [credentialsPath, senderEmail] = process.argv.slice(2);
  if (!credentialsPath || !senderEmail) {
    console.log('Usage: node scripts/setup-gmail.mjs "C:\\path\\client_secret.json" sender@gmail.com');
    console.log('Create a Desktop app OAuth client first. See docs/gmail-setup.md.');
    process.exitCode = 1;
    return;
  }
  const json = JSON.parse(await readFile(resolve(credentialsPath), 'utf8'));
  if (!json.installed) throw new Error('Download credentials for a Desktop app OAuth client, not the web Sign-In client.');
  // Verify the destination exists before asking the user for permission in Google.
  await readFile(envPath, 'utf8');
  console.log('Open this link in your browser and select the SAME Gmail account as the sender:');
  const values = await authorizeGmail(json.installed, senderEmail);
  // Re-read after consent so unrelated settings changed while waiting are preserved.
  const contents = withGmailConfiguration(await readFile(envPath, 'utf8'), values);
  const temporaryPath = `${envPath}.gmail-${randomBytes(8).toString('hex')}.local`;
  try {
    await writeFile(temporaryPath, contents, { mode: 0o600, flag: 'wx' });
    await rename(temporaryPath, envPath);
  } finally {
    await unlink(temporaryPath).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  }
  console.log('Gmail connected. Credentials saved in backend/.env; no tokens were printed.');
  console.log('Restart the backend. For Render, copy Email__Provider and Gmail__* into its Environment settings.');
  console.log('If the Google app is in Testing, its refresh token expires after 7 days. See docs/gmail-setup.md.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => {
    console.error('Gmail setup failed. Check the Desktop app JSON, sender address and Google consent. See docs/gmail-setup.md.');
    process.exitCode = 1;
  });
}
