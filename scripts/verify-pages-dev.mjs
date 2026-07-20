import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import net from 'node:net';
import { createMiaoSmokeRequestBody } from './fixtures/miao-smoke-payload.mjs';

const port = Number(process.env.TAROT_LOCAL_PAGES_PORT || await findOpenPort());
const origin = `http://127.0.0.1:${port}`;

function fail(message) {
  throw new Error(message);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function findOpenPort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const selectedPort = typeof address === 'object' && address ? address.port : 0;
  await new Promise((resolve) => server.close(resolve));
  return selectedPort;
}

function spawnWrangler() {
  const bin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = [
    'wrangler',
    'pages',
    'dev',
    'v1',
    '--compatibility-date=2026-06-29',
    '--ip',
    '127.0.0.1',
    '--port',
    String(port),
    '--log-level',
    'error',
    '--binding',
    'LLM_API_KEY=',
  ];

  const child = spawn(bin, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BROWSER: 'none',
      LLM_API_KEY: '',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const logs = [];
  const collect = (chunk) => {
    logs.push(chunk.toString());
    while (logs.length > 40) logs.shift();
  };
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);

  return { child, logs };
}

async function waitForHttp(url, timeoutMs = 15000) {
  const started = Date.now();
  let lastError = null;

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return response;
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }

  fail(`Timed out waiting for ${url}${lastError ? ` (${lastError.message})` : ''}`);
}

function headerIncludes(response, name, expected) {
  const value = response.headers.get(name) || '';
  if (!value.toLowerCase().includes(expected.toLowerCase())) {
    fail(`Expected ${name} to include ${expected}, got ${value || '<missing>'}`);
  }
}

async function expectRedirect(pathname, location) {
  const response = await fetch(`${origin}${pathname}`, { redirect: 'manual' });
  if (response.status !== 302 && response.status !== 301) {
    fail(`${pathname} should redirect, got HTTP ${response.status}`);
  }
  const actualLocation = response.headers.get('location');
  if (actualLocation !== location) {
    fail(`${pathname} should redirect to ${location}, got ${actualLocation}`);
  }
}

async function runChecks() {
  const root = await fetch(`${origin}/`);
  if (root.status !== 200) fail(`/ should be 200, got ${root.status}`);
  headerIncludes(root, 'x-content-type-options', 'nosniff');
  headerIncludes(root, 'referrer-policy', 'strict-origin-when-cross-origin');
  headerIncludes(root, 'permissions-policy', 'camera=()');
  headerIncludes(root, 'cache-control', 'must-revalidate');

  await expectRedirect('/miao/', '/');
  await expectRedirect('/v1/miao/', '/');

  const cardImage = await fetch(`${origin}/assets/miao-cards/the-fool.avif`);
  if (cardImage.status !== 200) fail(`Miao card image should be 200, got ${cardImage.status}`);
  headerIncludes(cardImage, 'cache-control', 'max-age=86400');

  const llmStatus = await fetch(`${origin}/api/readings/analyze`);
  headerIncludes(llmStatus, 'cache-control', 'no-store');
  const llmStatusBody = await llmStatus.json().catch(() => null);
  if (llmStatus.status !== 200 || llmStatusBody?.configured !== false || llmStatusBody?.available !== false) {
    fail(`Expected unconfigured LLM status, got HTTP ${llmStatus.status}: ${JSON.stringify(llmStatusBody)}`);
  }

  const api = await fetch(`${origin}/api/readings/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createMiaoSmokeRequestBody()),
  });
  headerIncludes(api, 'cache-control', 'no-store');

  const apiBody = await api.json().catch(() => null);
  if (api.status !== 501 || apiBody?.error !== 'llm_not_configured') {
    fail(`Expected unconfigured API to return 501 llm_not_configured, got HTTP ${api.status}: ${JSON.stringify(apiBody)}`);
  }

  const counter = await fetch(`${origin}/api/site-counter`, { method: 'POST' });
  headerIncludes(counter, 'cache-control', 'no-store');
  const counterBody = await counter.json().catch(() => null);
  if (counter.status !== 503 || counterBody?.error !== 'counter_unavailable') {
    fail(`Expected unbound counter API to return 503 counter_unavailable, got HTTP ${counter.status}: ${JSON.stringify(counterBody)}`);
  }

  const productEvent = await fetch(`${origin}/api/product-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'reading_started',
      variant: 'pages-smoke',
      anonymousId: randomUUID(),
      sessionId: randomUUID(),
      source: 'pages-smoke',
    }),
  });
  headerIncludes(productEvent, 'cache-control', 'no-store');
  const productEventBody = await productEvent.json().catch(() => null);
  if (productEvent.status !== 202 || productEventBody?.accepted !== true) {
    fail(`Expected Analytics Engine event acceptance, got HTTP ${productEvent.status}: ${JSON.stringify(productEventBody)}`);
  }
}

const { child: wrangler, logs } = spawnWrangler();

try {
  await waitForHttp(origin);
  await runChecks();
  console.log(`Pages Dev verification ok: ${origin}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  if (logs.length > 0) {
    console.error(logs.join('').trim());
  }
  process.exitCode = 1;
} finally {
  if (!wrangler.killed) {
    wrangler.stdin.write('x');
    wrangler.kill('SIGINT');
  }
}
