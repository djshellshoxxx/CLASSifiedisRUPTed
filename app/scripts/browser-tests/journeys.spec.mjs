import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const app = fileURLToPath(new URL('../..', import.meta.url));
const checks = (await readdir(new URL('../checks/', import.meta.url)))
  .filter(name => name.endsWith('.mjs') && !['lib.mjs', 'run.mjs'].includes(name)).sort();

for (const script of [...checks.map(name => 'scripts/checks/' + name), 'scripts/smoke.mjs']) {
  test(script, async ({}, testInfo) => {
    let result;
    try {
      result = await run(process.execPath, [script], {
        cwd: app,
        env: { ...process.env, BROWSER: testInfo.project.name, BASE: 'http://127.0.0.1:4173/' },
        timeout: 150_000,
        maxBuffer: 2 * 1024 * 1024,
        windowsHide: true,
      });
    } catch (error) {
      result = error;
      throw error;
    } finally {
      await testInfo.attach('journey-output', {
        body: (result?.stdout ?? '') + (result?.stderr ?? ''),
        contentType: 'text/plain',
      });
    }
    expect(result.stdout).toContain('Browser engine: ' + testInfo.project.name);
    expect(result.stdout).toContain('PASS');
  });
}
