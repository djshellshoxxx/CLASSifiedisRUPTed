// Guard the arithmetic implementation against accidental float conversions or ambient I/O.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = process.argv[2] ?? fileURLToPath(new URL('../src/valuation/precision/index.ts', import.meta.url));
const source = readFileSync(file, 'utf8');
const forbidden = /\b(?:parseFloat|parseInt|Date|fetch|XMLHttpRequest)\b|\bNumber\s*\(|\bMath\s*\.|\bconsole\s*\.|\b(?:logger|log)\s*\.|(?:from\s*|import\s*)['"](?:node:)?(?:fs|http|https|net|crypto|child_process)['"]|\b\d+\.\d+(?:[eE][+-]?\d+)?\b/;
if (forbidden.test(source)) {
  process.stderr.write('Money source must use exact integers without ambient I/O.\n');
  process.exitCode = 1;
}
