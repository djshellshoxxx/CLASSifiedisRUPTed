// Real built-app smoke; unit server fixtures do not satisfy this check.
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { ROOT, readConfig } from '../../tools/cli/classrup.mjs';
import path from 'node:path';

const config = await readConfig();
const url = `http://127.0.0.1:${config.port}${config.base}`;
for (const command of ['dev', 'preview']) {
  const child = spawn(process.execPath, [path.join(ROOT, 'tools/cli/classrup.mjs'), command], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  let browser;
  try {
    const deadline = Date.now() + 20000;
    let ready = false;
    while (Date.now() < deadline && child.exitCode === null) {
      try { ready = (await fetch(url, { signal: AbortSignal.timeout(500) })).ok; } catch { /* startup not ready */ }
      if (ready) break;
      await delay(100);
    }
    assert.ok(ready, `${command} failed readiness: ${logs}`);
    browser = await chromium.launch({ headless: true, ...(process.env.CLASSRUP_CHROMIUM_EXECUTABLE ? { executablePath: process.env.CLASSRUP_CHROMIUM_EXECUTABLE } : {}) });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    assert.ok(await page.locator('h1').count(), 'Actual app has a main heading');
    assert.ok((await page.locator('body').innerText()).length > 100, 'Actual app rendered content');
    assert.equal((await page.request.get(new URL('app.js', url).href)).status(), 200);
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    await page.reload({ waitUntil: 'networkidle' });
    assert.deepEqual(errors, [], 'No uncaught errors after reload');
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 10000 });
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    });
    await page.context().setOffline(true);
    await page.reload({ waitUntil: 'load' });
    assert.ok(await page.locator('h1').count(), 'Public app shell reloads offline');
    assert.deepEqual(errors, [], 'No uncaught errors after offline reload');
    await page.context().setOffline(false);
    console.log(`${command}: Chromium real-app startup, reload and offline shell passed`);
  } finally {
    await browser?.close();
    child.kill('SIGTERM');
    await Promise.race([new Promise(resolve => { if (child.exitCode !== null) resolve(); else child.once('exit', resolve); }), delay(3000)]);
    if (child.exitCode === null) child.kill('SIGKILL');
  }
}
