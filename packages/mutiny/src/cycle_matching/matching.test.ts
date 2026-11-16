import { describe, expect, it } from 'vitest';
import { canonicalRing, cycleKey, discoverCycles, type MatchEdge } from './index.ts';
const now = 2000000000;
const options = { now, monotonicNow: () => 0 };
function edge(giverId: string, receiverId: string): MatchEdge {
  return { giverId, receiverId, inventoryItemId: `item-${giverId}`, listingCid: `listing-${giverId}`, wantCid: `want-${receiverId}`, valueMinor: '100', currency: 'CAD', distanceBucket: 0, wantCreatedAt: 0 };
}
function ring(...nodes: string[]): MatchEdge[] { return nodes.map((node, i) => edge(node, nodes[(i + 1) % nodes.length]!)); }
describe('bounded matching primitives', () => {
  it('discovers 2, 3, 4 and 6 party cycles within configured length', async () => {
    for (const n of [2, 3, 4, 6]) {
      const input = ring(...Array.from({ length: n }, (_, i) => `party-${i}`));
      expect((await discoverCycles(input, { ...options, lmax: 8 })).suggestions[0]?.legs).toHaveLength(n);
      if (n > 5) expect((await discoverCycles(input, options)).suggestions).toHaveLength(0);
    }
  });
  it('binds the whole directed ring, preserves rotation but not reversal', async () => {
    const input = ring('a', 'b', 'c');
    expect(await cycleKey(input)).toBe(await cycleKey([...input.slice(1), input[0]!]));
    expect(await cycleKey(input)).not.toBe(await cycleKey(ring('a', 'c', 'b')));
    expect(await cycleKey(input)).not.toBe(await cycleKey(input.map((e, i) => i === 0 ? { ...e, valueMinor: '101' } : e)));
    expect(canonicalRing([...input.slice(1), input[0]!])[0]!.giverId).toBe('a');
  });
  it('greedily prefers longer cycles and excludes participant/item overlap', async () => {
    const input = [...ring('a', 'b', 'c', 'd'), edge('b', 'a')];
    const result = await discoverCycles(input, options);
    expect(result.stats.cyclesFound).toBe(2);
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0]!.legs).toHaveLength(4);
  });
  it('is stable with reordered input and count cutoff', async () => {
    const input = [...ring('a', 'b', 'c'), edge('b', 'a'), edge('c', 'b')];
    expect(await discoverCycles(input, options)).toEqual(await discoverCycles(input.toReversed(), options));
    const result = await discoverCycles(input, { ...options, expansionBudget: 2 });
    expect(result.stats.expansions).toBe(2);
    expect(result.stats.truncated).toBe('expansions');
  });
  it('reports real time truncation without overstating completeness', async () => {
    let clock = 0;
    const result = await discoverCycles(ring('a', 'b'), { now, timeBudgetMs: 1, monotonicNow: () => clock++ });
    expect(result.stats.truncated).toBe('time');
    expect(result.stats.expansions).toBe(0);
  });
  it('rejects oversized graphs, duplicate edges, invalid budgets and inexact money', async () => {
    await expect(discoverCycles(Array.from({ length: 20001 }, () => edge('a', 'b')), options)).rejects.toThrow('MUTINY_GRAPH_TOO_LARGE');
    await expect(discoverCycles([edge('a', 'b'), edge('a', 'b')], options)).rejects.toThrow('Duplicate');
    for (const invalid of [{ lmax: 9 }, { lmax: 1 }, { expansionBudget: 100001 }, { timeBudgetMs: 251 }, { maxSuggestions: 501 }]) await expect(discoverCycles([], { ...options, ...invalid })).rejects.toThrow();
    await expect(discoverCycles([{ ...edge('a', 'b'), valueMinor: '1.5' }], options)).rejects.toThrow('money');
  });
  it('does not match mixed currencies or reused items and filters to local principal', async () => {
    expect((await discoverCycles([edge('a', 'b'), { ...edge('b', 'a'), currency: 'USD' }], options)).suggestions).toHaveLength(0);
    expect((await discoverCycles([edge('a', 'b'), { ...edge('b', 'a'), inventoryItemId: 'item-a' }], options)).suggestions).toHaveLength(0);
    expect((await discoverCycles(ring('a', 'b'), { ...options, localPrincipal: 'c' })).suggestions).toHaveLength(0);
  });
  it('bounds retained candidates and cryptographic work on a dense graph', async () => {
    const nodes = Array.from({ length: 20 }, (_, i) => `n${i.toString().padStart(2, '0')}`);
    const dense = nodes.flatMap((from) => nodes.filter((to) => to !== from).map((to) => edge(from, to)));
    const result = await discoverCycles(dense, options);
    expect(result.stats.truncated).toBe('results');
    expect(result.stats.cyclesFound).toBe(500);
    expect(result.stats.expansions).toBeLessThanOrEqual(100000);
  });
});
