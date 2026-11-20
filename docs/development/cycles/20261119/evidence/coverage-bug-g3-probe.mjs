// Reproducible, dependency-free UI review probe. Run from the repository root.
// This executes the pinned formatter and exact main.ts fragments in a DOM stub;
// it does not execute a browser, the complete application, or vault cryptography.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { describeBackupCoverage } from '../../../../../apps/pwa/src/backup-coverage.ts';
import { createActionQueue, bindActionsToSession } from '../../../../../apps/pwa/src/action-queue.ts';

const main = readFileSync(new URL('../../../../../apps/pwa/src/main.ts', import.meta.url), 'utf8');
const sessionSource = readFileSync(new URL('../../../../../apps/pwa/src/vault-session.ts', import.meta.url), 'utf8');
const between = (source, start, end) => {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first + start.length);
  assert(first >= 0 && last > first, `Missing source markers: ${start}`);
  return source.slice(first, last);
};
const runForSession = new Function(stripTypeScriptTypes(
  between(sessionSource, 'export async function runForSession', '/** Activity is local').replace('export ', '')
) + '\nreturn runForSession;')();
const uiSource = stripTypeScriptTypes([
  between(main, 'function element<', 'async function command('),
  between(main, 'function clearVaultViews()', 'async function finishStorageClose('),
  between(main, "element('inspect-backup').addEventListener", "element('backup').addEventListener"),
].join('\n'));

const base = {
  recordTypes: [{ type: 'private.note', count: 2 }],
  registeredRecordTypes: ['private.note', 'unused.category'],
  unsupportedRecordTypes: [], recordCount: 2,
  typeLimitExceeded: false, recordLimitExceeded: false, excludedStores: ['blobs'],
};
const outcomes = [];
async function check(name, fn) {
  await fn();
  outcomes.push(name);
  console.log(`PASS ${name}`);
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function harness(initial) {
  const nodes = new Map();
  const listeners = new Map();
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        textContent: '', value: '', hidden: true,
        reset() {}, replaceChildren() {}, focus() {},
        addEventListener(type, callback) { listeners.set(`${id}:${type}`, callback); },
      });
      return nodes.get(id);
    },
    querySelectorAll() { return []; },
  };
  const ports = { initial, document };
  const api = new Function('ports', 'runForSession', 'describeBackupCoverage', 'createActionQueue', 'bindActionsToSession', `
    let unlocked = ports.initial;
    let bus = {};
    let barter;
    const document = ports.document;
    const queueAction = createActionQueue();
    const clearLocalViews = () => {};
    const resetPeerSearch = () => {};
    ${uiSource}
    return {
      clear: clearVaultViews,
      replace(session) { unlocked = session; bus = {}; },
      enqueue: queueAction,
      settle() { return queueAction(async () => {}); },
    };
  `)(ports, runForSession, describeBackupCoverage, createActionQueue, bindActionsToSession);
  return { ...api, node: id => document.getElementById(id), click: () => listeners.get('inspect-backup:click')() };
}

await check('formatter: empty, singular, plural and exactly 10,000 records use populated categories', () => {
  for (const [count, types, expected] of [
    [0, [], '0 saved records across 0 supported categories'],
    [1, [{ type: 'private.note', count: 1 }], '1 saved record across 1 supported category'],
    [2, base.recordTypes, '2 saved records across 1 supported category'],
    [10000, [{ type: 'private.note', count: 9999 }, { type: 'private.second', count: 1 }], '10000 saved records across 2 supported categories'],
  ]) {
    const text = describeBackupCoverage({ ...base, recordCount: count, recordTypes: types, registeredRecordTypes: [...types.map(row => row.type), 'unused.category'] });
    assert(text.includes(expected));
    assert(text.startsWith('At last check:'));
    assert(!text.includes('Backup blocked'));
    assert(!text.includes('private.'));
    assert(text.includes('checked again during export'));
    assert(text.includes('Record validation'));
  }
});
await check('formatter: all seven blocked combinations preserve export check precedence and omit names/counts', () => {
  for (let mask = 1; mask < 8; mask++) {
    const typeLimitExceeded = Boolean(mask & 4);
    const unsupportedRecordTypes = mask & 2 ? ['<private-secret>'] : [];
    const recordLimitExceeded = Boolean(mask & 1);
    const text = describeBackupCoverage({ ...base, recordCount: 10001, typeLimitExceeded, unsupportedRecordTypes, recordLimitExceeded });
    const expected = typeLimitExceeded ? 'too many saved record categories' : unsupportedRecordTypes.length ? 'unsupported features' : 'more than 10,000';
    assert(text.includes(expected));
    assert(text.startsWith('Backup blocked:'));
    assert(!text.includes('private-secret'));
    assert(!text.includes('10001'));
    assert(!text.includes('At last check:'));
  }
});
await check('main handler: current session displays coverage, and teardown clears counts and passphrase', async () => {
  const ui = harness({ backupCoverage: async () => base });
  ui.click(); await ui.settle();
  assert.equal(ui.node('backup-coverage').textContent, describeBackupCoverage(base));
  ui.node('backup-password').value = 'local private passphrase';
  ui.clear();
  assert.equal(ui.node('backup-coverage').textContent, '');
  assert.equal(ui.node('backup-password').value, '');
  assert.equal(ui.node('workspace').hidden, true);
});
for (const replacement of [false, true]) {
  await check(`main handler: ${replacement ? 'replaced' : 'locked'} session drops a queued coverage request`, async () => {
    const gate = deferred();
    let calls = 0;
    const ui = harness({ async backupCoverage() { calls++; return base; } });
    const ahead = ui.enqueue(() => gate.promise);
    ui.click();
    ui.clear();
    if (replacement) ui.replace({ backupCoverage: async () => ({ ...base, recordCount: 7 }) });
    gate.resolve();
    await ahead; await ui.settle();
    assert.equal(calls, 0);
    assert.equal(ui.node('backup-coverage').textContent, '');
  });
  await check(`main handler: ${replacement ? 'replaced' : 'locked'} session drops an in-flight coverage result`, async () => {
    const entered = deferred();
    const gate = deferred();
    const ui = harness({ backupCoverage() { entered.resolve(); return gate.promise; } });
    ui.click(); await entered.promise;
    ui.clear();
    if (replacement) {
      ui.replace({ backupCoverage: async () => base });
      ui.node('backup-coverage').textContent = 'New session view';
    }
    gate.resolve(base); await ui.settle();
    assert.equal(ui.node('backup-coverage').textContent, replacement ? 'New session view' : '');
    assert.equal(ui.node('error').hidden, true);
    assert.equal(ui.node('error').textContent, '');
  });
}
await check('main handler: obsolete coverage errors stay hidden and a replacement session remains usable', async () => {
  const entered = deferred();
  const gate = deferred();
  const ui = harness({ backupCoverage() { entered.resolve(); return gate.promise; } });
  ui.click(); await entered.promise;
  ui.clear(); ui.replace({ backupCoverage: async () => base });
  gate.reject(new Error('old private failure')); await ui.settle();
  assert.equal(ui.node('error').hidden, true);
  assert.equal(ui.node('error').textContent, '');
  ui.click(); await ui.settle();
  assert.equal(ui.node('backup-coverage').textContent, describeBackupCoverage(base));
});
console.log(JSON.stringify({ checks: outcomes.length, passed: outcomes.length, node: process.version, maxRSSKiB: process.resourceUsage().maxRSS }));
