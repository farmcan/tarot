import assert from 'node:assert/strict';
import {
  onRequestDelete,
  onRequestGet,
  onRequestPost,
} from '../functions/api/conversations.js';

class FakeStatement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.values = [];
  }

  bind(...values) {
    this.values = values;
    return this;
  }

  async first() {
    if (this.sql.includes('SELECT access_key_hash FROM ai_conversations')) {
      const row = this.database.rows.get(this.values[0]);
      return row ? { access_key_hash: row.access_key_hash } : null;
    }
    if (this.sql.includes('SELECT reading_id, snapshot_json')) {
      const row = this.database.rows.get(this.values[0]);
      return row && row.access_key_hash === this.values[1] ? row : null;
    }
    return null;
  }

  async run() {
    if (this.sql.startsWith('DELETE FROM ai_conversations WHERE expires_at')) {
      return { meta: { changes: 0 } };
    }
    if (this.sql.startsWith('INSERT INTO ai_conversations')) {
      const [conversationId, accessKeyHash, readingId, snapshotJson, expiresAt] = this.values;
      const existing = this.database.rows.get(conversationId);
      if (!existing || existing.access_key_hash === accessKeyHash) {
        this.database.rows.set(conversationId, {
          access_key_hash: accessKeyHash,
          reading_id: readingId,
          snapshot_json: snapshotJson,
          updated_at: new Date().toISOString(),
          expires_at: expiresAt,
        });
      }
      return { meta: { changes: 1 } };
    }
    if (this.sql.startsWith('DELETE FROM ai_conversations WHERE conversation_id')) {
      const row = this.database.rows.get(this.values[0]);
      const deleted = Boolean(row && row.access_key_hash === this.values[1]);
      if (deleted) this.database.rows.delete(this.values[0]);
      return { meta: { changes: deleted ? 1 : 0 } };
    }
    return { meta: { changes: 0 } };
  }
}

class FakeD1Database {
  constructor() {
    this.rows = new Map();
  }

  prepare(sql) {
    return new FakeStatement(this, sql);
  }
}

const database = new FakeD1Database();
const env = { MIAOTAROT_DB: database };
const conversationId = 'conversation-1234567890';
const accessKey = 'ab'.repeat(32);
const url = `https://tarot.test/api/conversations?id=${conversationId}`;
const headers = {
  Origin: 'https://tarot.test',
  'Sec-Fetch-Site': 'same-origin',
  'X-Conversation-Key': accessKey,
};

const statusResponse = await onRequestGet({
  request: new Request('https://tarot.test/api/conversations', { headers }),
  env,
});
assert.equal(statusResponse.status, 200);
assert.equal((await statusResponse.json()).available, true);

const snapshot = {
  version: 1,
  question: '这周先推进工作，还是准备下一步？',
  cards: [{ position: '焦点', tarotCard: 'the-star', orientation: 'upright' }],
  baseContent: '{"title":"先看现实条件"}',
  turns: [],
};
const saveResponse = await onRequestPost({
  request: new Request(url, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ readingId: 'reading-12345678', snapshot }),
  }),
  env,
});
assert.equal(saveResponse.status, 200);
assert.equal((await saveResponse.json()).saved, true);

const loadResponse = await onRequestGet({
  request: new Request(url, { headers }),
  env,
});
assert.equal(loadResponse.status, 200);
assert.deepEqual((await loadResponse.json()).snapshot, snapshot);

const wrongKeyResponse = await onRequestGet({
  request: new Request(url, {
    headers: { ...headers, 'X-Conversation-Key': 'cd'.repeat(32) },
  }),
  env,
});
assert.equal(wrongKeyResponse.status, 404);

const crossSiteResponse = await onRequestPost({
  request: new Request(url, {
    method: 'POST',
    headers: {
      ...headers,
      Origin: 'https://attacker.invalid',
      'Sec-Fetch-Site': 'cross-site',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ readingId: 'reading-12345678', snapshot }),
  }),
  env,
});
assert.equal(crossSiteResponse.status, 403);

const deleteResponse = await onRequestDelete({
  request: new Request(url, { method: 'DELETE', headers }),
  env,
});
assert.equal(deleteResponse.status, 200);
assert.equal((await deleteResponse.json()).deleted, true);
assert.equal(database.rows.size, 0);

console.log('Conversation storage contract ok: opt-in status, keyed save/load/delete, size boundary and same-origin protection.');
