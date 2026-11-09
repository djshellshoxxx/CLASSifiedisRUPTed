// Run with the repository's supported Node runtime: node tests/tooling/mutiny-benchmark.mjs
import { discoverCycles } from '../../packages/mutiny/src/cycle_matching/index.ts';
import os from 'node:os';
const now = 2e12;
const nodes = 1000;
const edges = [];
let seed = 42;
for (let i = 0; i < nodes; i++) {
  const targets = new Set([(i + 1) % nodes]);
  while (targets.size < 5) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const target = seed % nodes;
    if (target !== i) targets.add(target);
  }
  for (const target of targets) edges.push({ giverId: `p${String(i).padStart(4, '0')}`, receiverId: `p${String(target).padStart(4, '0')}`, inventoryItemId: `item${i}`, listingCid: `listing${i}`, wantCid: `want${target}`, valueMinor: '100', currency: 'CAD', distanceBucket: 0, wantCreatedAt: now - 86400000 });
}
const elapsed = [];
const reasons = {};
let maxExpansions = 0;
for (let i = 0; i < 100; i++) {
  const start = performance.now();
  const result = await discoverCycles(edges, { now, lmax: 5 });
  elapsed.push(performance.now() - start);
  reasons[result.stats.truncated] = (reasons[result.stats.truncated] ?? 0) + 1;
  maxExpansions = Math.max(maxExpansions, result.stats.expansions);
}
elapsed.sort((a, b) => a - b);
console.log(JSON.stringify({ node: process.version, platform: process.platform, arch: process.arch, cpu: os.cpus()[0]?.model, seed: 42, nodes, edges: edges.length, runs: 100, p95TotalMs: elapsed[94], maxTotalMs: elapsed[99], maxExpansions, truncation: reasons }, null, 2));
