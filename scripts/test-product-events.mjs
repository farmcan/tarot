import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/product-event.js';

class FakeStatement {
  constructor(database) {
    this.database = database;
  }

  bind(name, variant) {
    this.name = name;
    this.variant = variant;
    return this;
  }

  async run() {
    const key = `${this.name}:${this.variant}`;
    this.database.counts.set(key, (this.database.counts.get(key) || 0) + 1);
  }
}

const database = {
  counts: new Map(),
  prepare() {
    return new FakeStatement(this);
  },
};

function request(body, headers = {}) {
  return new Request('https://miaotarot.example/api/product-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const env = { MIAOTAROT_DB: database };
const accepted = await onRequestPost({ request: request({ name: 'reading_completed', variant: 'three-card' }), env });
assert.equal(accepted.status, 202);
assert.deepEqual(await accepted.json(), { accepted: true });
assert.equal(database.counts.get('reading_completed:three-card'), 1);

await onRequestPost({ request: request({ name: 'reading_completed', variant: 'three-card' }), env });
assert.equal(database.counts.get('reading_completed:three-card'), 2);

const invalid = await onRequestPost({ request: request({ name: 'private_question', variant: 'secret text' }), env });
assert.equal(invalid.status, 400);
assert.equal(database.counts.size, 1);

const crossSite = await onRequestPost({
  request: request({ name: 'share_result' }, { 'Sec-Fetch-Site': 'cross-site' }),
  env,
});
assert.equal(crossSite.status, 403);

console.log('Product event test ok: allowlist, aggregate increment, variant validation, cross-site guard.');
