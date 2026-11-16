import { measureMoneyBundle, MONEY_GZIP_BUDGET_BYTES } from './money_bundle.mjs';

const gzipBytes = await measureMoneyBundle();
process.stdout.write(JSON.stringify({ gzipBytes, gzipBudgetBytes: MONEY_GZIP_BUDGET_BYTES }) + '\n');
if (gzipBytes > MONEY_GZIP_BUDGET_BYTES) process.exitCode = 1;
