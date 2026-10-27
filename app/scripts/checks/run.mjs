// Runs every browser check file in this folder, one after another. Each file is a standalone script.
import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const dir = fileURLToPath(new URL('.', import.meta.url));
const files = (await readdir(dir)).filter((name) => name.endsWith('.mjs') && name !== 'lib.mjs' && name !== 'run.mjs').sort();

let failed = 0;
for (const file of files) {
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, [join(dir, file)], { stdio: 'inherit' });
    child.on('exit', (exitCode) => resolve(exitCode ?? 1));
  });
  if (code !== 0) failed += 1;
}
if (failed) {
  console.error(`${failed} check file(s) failed`);
  process.exit(1);
}
console.log(`All ${files.length} check files passed`);
