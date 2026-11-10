import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build, setup } from '../../tools/cli/classrup.mjs';

test('CLI build rejects linked public assets before reading or modifying external targets', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'classrup-public-links-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await setup(root);
  await fs.mkdir(path.join(root, 'apps/pwa/src'), { recursive: true });
  await fs.mkdir(path.join(root, 'apps/pwa/public'), { recursive: true });
  await fs.mkdir(path.join(root, 'dist'));
  await fs.writeFile(path.join(root, 'dist/index.html'), 'previous output');
  await fs.writeFile(path.join(root, 'apps/pwa/index.html'), '<h1>Test app</h1>');
  await fs.writeFile(path.join(root, 'apps/pwa/src/main.ts'), 'document.body.dataset.ready = "yes";');
  for (const asset of ['styles.css', 'manifest.webmanifest', 'icon.svg']) {
    await fs.writeFile(path.join(root, 'apps/pwa/public', asset), 'public test asset');
  }
  const external = path.join(root, 'private-operator-note.txt');
  const sentinel = 'Outside public root: __BUILD_ID__ must remain untouched.\n';
  await fs.writeFile(external, sentinel);
  try {
    await fs.symlink(external, path.join(root, 'apps/pwa/public/sw.js'));
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) {
      t.skip('This runner does not permit creating symbolic links');
      return;
    }
    throw error;
  }

  await assert.rejects(build(root), /symbolic link|symlink/i);
  assert.equal(await fs.readFile(external, 'utf8'), sentinel, 'a build must never overwrite an external file via its public worker path');
  assert.equal(await fs.readFile(path.join(root, 'dist/index.html'), 'utf8'), 'previous output');
});
