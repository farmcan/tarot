import { spawn } from 'node:child_process';
import http from 'node:http';
import { once } from 'node:events';

const pagesPort = Number(process.env.TAROT_LOCAL_PAGES_PORT || 8788);
const pagesOrigin = `http://127.0.0.1:${pagesPort}`;
const endpoint = `${pagesOrigin}/api/readings/analyze`;

const mockContent = JSON.stringify({
  title: '先稳住爪子',
  summary: '你现在更像一只刚要出门的猫。先确认方向，再迈出去。',
  cards: [
    {
      position: '焦点',
      reading: '焦点牌是愚者，传统牌义是新的开始；翻译成猫语，是先别一爪踩空。',
    },
  ],
  actions: ['写下一个小动作', '先做十五分钟', '结束后再评估'],
  shareText: '今天先迈一小步',
});

function createMockProvider() {
  return http.createServer(async (request, response) => {
    if (request.method !== 'POST' || request.url !== '/v1/chat/completions') {
      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'not_found' }));
      return;
    }

    for await (const _chunk of request) {
      // Drain the body so the request completes cleanly.
    }

    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      id: 'mock-miaotarot-completion',
      object: 'chat.completion',
      model: 'mock-structured-json',
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          message: {
            role: 'assistant',
            content: mockContent,
          },
        },
      ],
    }));
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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

  throw new Error(`Timed out waiting for ${url}${lastError ? ` (${lastError.message})` : ''}`);
}

function spawnWrangler(mockProviderPort) {
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
    String(pagesPort),
    '--log-level',
    'error',
    '--binding',
    'LLM_API_KEY=local-mock-key',
    '--binding',
    `LLM_BASE_URL=http://127.0.0.1:${mockProviderPort}/v1`,
    '--binding',
    'LLM_MODEL=mock-structured-json',
  ];

  const child = spawn(bin, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BROWSER: 'none',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const logs = [];
  const collect = (chunk) => {
    logs.push(chunk.toString());
    while (logs.length > 30) logs.shift();
  };
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);
  child.on('exit', (code, signal) => {
    if (code && code !== 0 && signal !== 'SIGINT') {
      logs.push(`wrangler exited with code ${code}`);
    }
  });

  return { child, logs };
}

async function runSmoke(endpointUrl) {
  const bin = process.execPath;
  const child = spawn(bin, ['scripts/smoke-llm-proxy.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TAROT_LLM_ENDPOINT: endpointUrl,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });

  const [code] = await once(child, 'exit');
  if (code !== 0) {
    throw new Error(output.trim() || `smoke script exited with code ${code}`);
  }

  return output.trim();
}

const mockProvider = createMockProvider();
await new Promise((resolve) => {
  mockProvider.listen(0, '127.0.0.1', resolve);
});

const mockProviderPort = mockProvider.address().port;
const { child: wrangler, logs } = spawnWrangler(mockProviderPort);

try {
  await waitForHttp(pagesOrigin);
  const output = await runSmoke(endpoint);
  console.log(output);
  console.log(`Local LLM smoke ok: ${endpoint}`);
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
  mockProvider.close();
}
