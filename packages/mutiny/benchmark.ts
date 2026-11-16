// Reproducible bounded-search probe; no performance claim for browsers or other hardware.
import { discoverCycles, type MatchEdge } from './src/cycle_matching/index.ts';
let seed = 42;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const edges = new Map<string, MatchEdge>();
while (edges.size < 5000) {
  const from = Math.floor(random() * 1000);
  const to = Math.floor(random() * 1000);
  if (from === to) continue;
  const giverId = `p${from.toString().padStart(4, '0')}`;
  const receiverId = `p${to.toString().padStart(4, '0')}`;
  edges.set(`${giverId}/${receiverId}`, { giverId, receiverId, inventoryItemId: `item-${giverId}`, listingCid: `listing-${giverId}`, wantCid: `want-${receiverId}`, valueMinor: '100', currency: 'CAD', distanceBucket: 0, wantCreatedAt: 0 });
}
const samples: number[] = [];
const searches: number[] = [];
const truncations: Record<string, number> = {};
let inputHash = '';
let maximumExpansions = 0;
for (let i = 0; i < 100; i++) {
  const start = performance.now();
  const result = await discoverCycles([...edges.values()], { now: 86400000, lmax: 5 });
  samples.push(performance.now() - start);
  searches.push(result.stats.durationMs);
  truncations[result.stats.truncated] = (truncations[result.stats.truncated] ?? 0) + 1;
  inputHash = result.inputHash;
  maximumExpansions = Math.max(maximumExpansions, result.stats.expansions);
}
const p95 = (values: number[]) => values.sort((a, b) => a - b)[94]!;
console.log(JSON.stringify({ node: process.version, platform: process.platform, arch: process.arch, seed: 42, nodes: 1000, edges: 5000, runs: 100, inputHash, enumerationP95Ms: p95(searches), totalP95Ms: p95(samples), maximumExpansions, truncations }, null, 2));
