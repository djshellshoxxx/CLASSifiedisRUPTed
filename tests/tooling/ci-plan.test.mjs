import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';
import { ALL_BROWSERS, ALL_OS, plan } from '../../tools/ci/plan.mjs';

const pr = (...files) => plan({ event: 'pull_request', files });

test('pushes, manual runs and unknown change lists get every OS and every browser', () => {
  for (const event of ['push', 'workflow_dispatch', 'schedule']) {
    assert.deepEqual(plan({ event, files: ['packages/bazaar/src/index.ts'] }), { os: ALL_OS, browsers: ALL_BROWSERS, projects: '--project=chromium --project=firefox --project=webkit', key: 'chromium-firefox-webkit' });
  }
  assert.deepEqual(pr().os, ALL_OS);
  assert.deepEqual(pr('', '  ').browsers, ALL_BROWSERS);
});

test('a domain-only pull request runs the Linux gate with Chromium', () => {
  const decided = pr('packages/bazaar/src/pricing/offers/index.ts', 'packages/commerce/src/payments/cash/index.ts', 'tests/integration/x.test.ts');
  assert.deepEqual(decided, { os: ['ubuntu-latest'], browsers: ['chromium'], projects: '--project=chromium', key: 'chromium' });
});

test('CLI, build and toolchain changes bring back Windows and macOS', () => {
  for (const file of ['tools/cli/classrup.mjs', 'tests/cli/setup.test.mjs', 'package.json', 'pnpm-lock.yaml', '.github/workflows/cli-setup.yml', 'tools/ci/plan.mjs', 'apps/pwa/public/sw.js', 'tools\\cli\\classrup.mjs']) {
    assert.deepEqual(pr(file).os, ALL_OS, file);
  }
  assert.deepEqual(pr('packages/kernel/src/bus/bus.ts').os, ['ubuntu-latest']);
});

test('PWA, browser storage and cryptography changes bring back Firefox and WebKit', () => {
  for (const file of ['apps/pwa/src/main.ts', 'tests/browser/alpha.spec.ts', 'packages/vault/src/vault.ts', 'packages/identity/src/identity.ts', 'packages/security/src/cryptography/index.ts',
    'packages/federation/src/envelope.ts', 'packages/kernel/src/storage/indexeddb.ts', 'packages/kernel/src/browser.ts', 'playwright.config.ts']) {
    assert.deepEqual(pr(file).browsers, ALL_BROWSERS, file);
  }
  assert.deepEqual(pr('packages/kernel/src/outbox/dispatcher.ts').browsers, ['chromium']);
});

test('the script prints GITHUB_OUTPUT lines and refuses a missing event', () => {
  const ok = spawnSync(process.execPath, ['tools/ci/plan.mjs', 'pull_request'], { input: 'docs/x.md\npackages/mutiny/src/index.ts\n', encoding: 'utf8' });
  assert.equal(ok.status, 0);
  assert.equal(ok.stdout, 'os=["ubuntu-latest"]\nbrowsers=chromium\nprojects=--project=chromium\nkey=chromium\n');
  assert.notEqual(spawnSync(process.execPath, ['tools/ci/plan.mjs'], { input: '', encoding: 'utf8' }).status, 0);
});

test('workflows parse, pin actions by commit, declare least privilege and cancel stale runs', () => {
  const dir = '.github/workflows';
  for (const name of readdirSync(dir)) {
    const text = readFileSync(`${dir}/${name}`, 'utf8');
    const workflow = YAML.parse(text);
    assert.deepEqual(workflow.permissions, { contents: 'read' }, `${name} permissions`);
    assert.equal(workflow.concurrency['cancel-in-progress'], true, `${name} cancels stale runs`);
    for (const use of text.matchAll(/uses:\s*(\S+)/g)) assert.match(use[1], /^actions\/[a-z-]+@[0-9a-f]{40}$/, `${name} pins ${use[1]}`);
    for (const [id, job] of Object.entries(workflow.jobs)) {
      assert.ok(Number.isInteger(job['timeout-minutes']), `${name} job ${id} has a timeout`);
      for (const need of [job.needs ?? []].flat()) assert.ok(workflow.jobs[need], `${name} job ${id} needs existing job ${need}`);
    }
  }
});
