import { performance } from 'node:perf_hooks';
import { allocate, money } from '../src/valuation/precision/index.ts';
import { measureMoneyBundle, MONEY_GZIP_BUDGET_BYTES } from './money_bundle.mjs';

const value = money('99999999999999999999999999999999999999', 'CAD');
if (!value.ok) throw new Error(value.error.code);
const weights = Array.from({ length: 1000 }, (_, i) => BigInt(i + 1));
const times = [];
for (let i = 0; i < 1100; i++) {
  const start = performance.now();
  const result = allocate(value.value, weights);
  const duration = performance.now() - start;
  if (!result.ok) throw new Error(result.error.code);
  if (i >= 100) times.push(duration);
}
times.sort((a, b) => a - b);
const gzipBytes = await measureMoneyBundle();
const p99Ms = times[989];
process.stdout.write(JSON.stringify({ weights: weights.length, measuredRuns: times.length, p99Ms, gzipBytes, p99BudgetMs: 2, gzipBudgetBytes: MONEY_GZIP_BUDGET_BYTES }) + '\n');
if (p99Ms > 2 || gzipBytes > MONEY_GZIP_BUDGET_BYTES) process.exitCode = 1;
