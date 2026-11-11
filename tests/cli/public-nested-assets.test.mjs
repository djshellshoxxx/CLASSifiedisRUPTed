import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build, setup } from '../../tools/cli/classrup.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'classrup-nested-assets-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await setup(root);
  await fs.mkdir(path.join(root, 'apps/pwa/src'), { recursive: true });
  await fs.mkdir(path.join(root, 'apps/pwa/public'), { recursive: true });
  await fs.mkdir(path.join(root, 'dist'));
  await fs.writeFile(path.join(root, 'apps/pwa/index.html'), '<h1>Public app</h1>');
  await fs.writeFile(path.join(root, 'apps/pwa/src/main.ts'), 'document.body.dataset.ready = "yes";');
  await fs.writeFile(path.join(root, 'dist/index.html'), 'prior known-good output');
  return root;
}

async function assertBuildRejectedWithoutOutputMutation(root) {
  await assert.rejects(build(root), /symbolic link|symlink/i);
  assert.equal(await fs.readFile(path.join(root, 'dist/index.html'), 'utf8'), 'prior known-good output');
}

test('CLI rejects a symbolic link nested in the public asset tree without reading the external file', async t => {
  const root = await fixture(t);
  const publicDir = path.join(root, 'apps/pwa/public');
  const external = path.join(root, 'private-data.txt');
  const sentinel = 'A private note that must never enter dist.\n';
  await fs.writeFile(external, sentinel);
  await fs.mkdir(path.join(publicDir, 'css'), { recursive: true });
  try {
    await fs.symlink(external, path.join(publicDir, 'css', 'linked.css'));
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) {
      t.skip('This runner cannot create symbolic file links');
      return;
    }
    throw error;
  }
  await assertBuildRejectedWithoutOutputMutation(root);
  assert.equal(await fs.readFile(external, 'utf8'), sentinel);
});

test('CLI rejects a linked public directory before touching existing dist output', async t => {
  const root = await fixture(t);
  const privateDir = path.join(root, 'operator-data');
  await fs.mkdir(privateDir);
  await fs.writeFile(path.join(privateDir, 'secret.txt'), 'not a public asset');
  const linked = path.join(root, 'apps/pwa/public/linked-folder');
  try {
    await fs.symlink(privateDir, linked, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) {
      t.skip('This runner cannot create symbolic directory links');
      return;
    }
    throw error;
  }
  await assertBuildRejectedWithoutOutputMutation(root);
  assert.equal(await fs.readFile(path.join(privateDir, 'secret.txt'), 'utf8'), 'not a public asset');
});
