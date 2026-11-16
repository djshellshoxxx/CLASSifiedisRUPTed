import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../../apps/pwa/public/sw.js', import.meta.url), 'utf8');
function harness({ failInstall = false, cacheNames = [] } = {}) {
  const handlers = new Map();
  const opened = [], deleted = [], added = [];
  const scope = 'https://example.test/classrup/';
  vm.runInNewContext(source.replaceAll('__BUILD_ID__', 'test-build'), {
    URL, Request, Set,
    self: { registration: { scope }, clients: { claim: async () => {} }, addEventListener: (name, handler) => handlers.set(name, handler) },
    caches: {
      open: async name => { opened.push(name); return { addAll: async requests => { added.push(...requests); if (failInstall) throw new Error('asset unavailable'); }, match: async () => 'public cached response' }; },
      keys: async () => cacheNames,
      delete: async name => { deleted.push(name); },
    },
    fetch: async () => 'network response',
  });
  async function lifecycle(type) { let result; handlers.get(type)({ waitUntil: promise => { result = promise; } }); await result; }
  return { handlers, opened, deleted, added, lifecycle, scope };
}
test('worker pre-caches only fixed public assets without credentials', async () => {
  const h = harness(); await h.lifecycle('install');
  assert.equal(h.added.length, 6);
  assert.ok(h.added.every(request => request.credentials === 'omit' && request.url.startsWith(h.scope)));
  assert.deepEqual(h.added.map(request => new URL(request.url).pathname), ['/classrup/', '/classrup/index.html', '/classrup/app.js', '/classrup/styles.css', '/classrup/manifest.webmanifest', '/classrup/icon.svg']);
});
test('failed precache rejects installation and deletes only the incomplete new cache', async () => {
  const h = harness({ failInstall: true });
  await assert.rejects(h.lifecycle('install'), /asset unavailable/);
  assert.deepEqual(h.deleted, h.opened);
});
test('activation only removes old versions owned by the same application scope', async () => {
  const prefix = 'classrup-public-v1:https%3A%2F%2Fexample.test%2Fclassrup%2F:';
  const h = harness({ cacheNames: [prefix + 'old', prefix + 'test-build', 'other-app-cache', 'classrup-public-v1:other-scope:old'] });
  await h.lifecycle('activate');
  assert.deepEqual(h.deleted, [prefix + 'old']);
});
test('private paths, queries, other origins and writes never enter worker handling', async () => {
  const h = harness();
  for (const [url, method] of [['https://example.test/classrup/private.json', 'GET'], ['https://example.test/classrup/app.js?token=private', 'GET'], ['https://peer.test/app.js', 'GET'], ['https://example.test/classrup/', 'POST']]) {
    h.handlers.get('fetch')({ request: new Request(url, { method }), respondWith: () => assert.fail(`unexpected intercept ${url}`) });
  }
  let response;
  h.handlers.get('fetch')({ request: new Request(h.scope + 'app.js'), respondWith: promise => { response = promise; } });
  assert.equal(await response, 'public cached response');
  assert.equal(h.added.length, 0, 'fetch never writes runtime content to cache');
});
