import { randomUUID } from 'node:crypto';

const origin = new URL(process.env.TAROT_PRODUCTION_ORIGIN || 'https://tarot.pages.dev').origin;
const requireLlm = process.env.TAROT_REQUIRE_LLM === '1';
const requireCounter = process.env.TAROT_REQUIRE_COUNTER === '1';

function fail(message) {
  throw new Error(message);
}

function headerIncludes(response, name, expected) {
  const value = response.headers.get(name) || '';
  if (!value.toLowerCase().includes(expected.toLowerCase())) {
    fail(`Expected ${name} to include ${expected}, got ${value || '<missing>'}`);
  }
}

async function readJson(response, label) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    fail(`${label} should return JSON, got ${contentType || '<missing content-type>'}`);
  }
  return response.json().catch(() => fail(`${label} returned invalid JSON`));
}

async function expectRedirect(pathname) {
  const response = await fetch(`${origin}${pathname}`, { redirect: 'manual' });
  if (![301, 302, 307, 308].includes(response.status)) {
    fail(`${pathname} should redirect, got HTTP ${response.status}`);
  }
  const location = response.headers.get('location');
  if (location !== '/') fail(`${pathname} should redirect to /, got ${location || '<missing>'}`);
}

async function run() {
  const root = await fetch(`${origin}/`);
  if (!root.ok) fail(`/ should be 200, got HTTP ${root.status}`);
  headerIncludes(root, 'content-type', 'text/html');
  headerIncludes(root, 'x-content-type-options', 'nosniff');
  headerIncludes(root, 'referrer-policy', 'strict-origin-when-cross-origin');
  headerIncludes(root, 'cache-control', 'max-age=0');
  headerIncludes(root, 'cache-control', 'must-revalidate');
  const html = await root.text();
  if (!html.includes('<title>MiaoTarot')) {
    fail('/ is not the current MiaoTarot build (expected the MiaoTarot title marker)');
  }
  if ((html.match(/static\.cloudflareinsights\.com\/beacon\.min\.js/g) || []).length !== 1) {
    fail('/ should contain exactly one Cloudflare Web Analytics beacon');
  }
  if (!html.includes('6533467eb422474fa5910918c76790fd')) {
    fail('/ should contain the configured Cloudflare Web Analytics token');
  }
  const entryScript = html.match(/<script[^>]+src="([^"]*index-[^"]+\.js)"/)?.[1];
  if (!entryScript) fail('/ should reference a hashed JavaScript entry asset');
  const entryResponse = await fetch(new URL(entryScript, `${origin}/`));
  if (!entryResponse.ok) fail(`Entry script should be 200, got HTTP ${entryResponse.status}`);
  headerIncludes(entryResponse, 'cache-control', 'max-age=86400');
  if ((entryResponse.headers.get('cache-control') || '').includes('max-age=0')) {
    fail('Hashed entry script should not inherit the HTML max-age=0 cache rule');
  }

  await expectRedirect('/miao/');
  await expectRedirect('/v1/miao/');

  const cardImage = await fetch(`${origin}/assets/miao-cards/the-fool.avif`);
  if (!cardImage.ok) fail(`Miao card image should be 200, got HTTP ${cardImage.status}`);
  headerIncludes(cardImage, 'content-type', 'image/avif');

  const llmResponse = await fetch(`${origin}/api/readings/analyze`);
  headerIncludes(llmResponse, 'cache-control', 'no-store');
  const llm = await readJson(llmResponse, 'LLM status');
  if (!llmResponse.ok || typeof llm.configured !== 'boolean' || typeof llm.available !== 'boolean') {
    fail(`LLM status contract is invalid: HTTP ${llmResponse.status} ${JSON.stringify(llm)}`);
  }
  if (requireLlm && !llm.available) {
    fail(`LLM is required but unavailable: ${JSON.stringify(llm)}`);
  }

  const counterResponse = await fetch(`${origin}/api/site-counter`);
  headerIncludes(counterResponse, 'cache-control', 'no-store');
  const counter = await readJson(counterResponse, 'Site counter');
  const counterAvailable = counterResponse.ok && Number.isFinite(counter.count) && counter.period === 'all-time';
  if (requireCounter && !counterAvailable) {
    fail(`D1 site counter is unavailable or invalid: HTTP ${counterResponse.status} ${JSON.stringify(counter)}`);
  }

  const eventResponse = await fetch(`${origin}/api/product-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'MiaoTarot production smoke',
    },
    body: JSON.stringify({
      name: 'reading_started',
      variant: 'production-smoke',
      anonymousId: randomUUID(),
      sessionId: randomUUID(),
      source: 'production-smoke',
    }),
  });
  headerIncludes(eventResponse, 'cache-control', 'no-store');
  const event = await readJson(eventResponse, 'Product event');
  if (eventResponse.status !== 202 || event.accepted !== true) {
    fail(`Analytics Engine product event was not accepted: HTTP ${eventResponse.status} ${JSON.stringify(event)}`);
  }

  console.log(`Production smoke ok: ${origin}`);
  console.log(`- current MiaoTarot build, Web Analytics beacon and AVIF card assets: ok`);
  console.log(`- Pages Functions and Analytics Engine product events: ok`);
  console.log(`- D1 public counter: ${counterAvailable ? 'available' : 'optional and currently unavailable'}`);
  console.log(`- LLM: ${llm.available ? `available (${llm.model || 'model hidden'})` : 'optional and currently unavailable'}`);
}

run().catch((error) => {
  console.error(`Production smoke failed for ${origin}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
