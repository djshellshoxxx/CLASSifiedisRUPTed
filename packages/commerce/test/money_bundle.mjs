import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

export const MONEY_GZIP_BUDGET_BYTES = 12 * 1024;

/** One bundle measurement shared by deterministic CI and the standalone timing run. */
export async function measureMoneyBundle() {
  const output = await build({
    entryPoints: [fileURLToPath(new URL('../src/valuation/precision/index.ts', import.meta.url))],
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    write: false,
  });
  return gzipSync(output.outputFiles[0].contents).length;
}
