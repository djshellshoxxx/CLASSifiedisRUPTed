import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalRing, cycleKey, discoverCycles, type MatchEdge } from '../../packages/mutiny/src/cycle_matching/index.ts';

const now = 2_000_000_000_000;
const edge = (giverId: string, receiverId: string): MatchEdge => ({
  giverId, receiverId, inventoryItemId: `item:${giverId}`, listingCid: `listing:${giverId}`,
  wantCid: `want:${receiverId}`, valueMinor: '100', currency: 'CAD', distanceBucket: 0, wantCreatedAt: now - 86400000,
});
const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
// Independent permutation oracle: no implementation traversal or canonicalization helpers.
function oracle(edges: readonly MatchEdge[], size: number) {
  const nodes = [...new Set(edges.flatMap(e => [e.giverId, e.receiverId]))].sort();
  const cycles: { key: string; legs: MatchEdge[] }[] = [];
  function permutations(prefix: string[], remaining: string[], length: number): void {
    if (prefix.length < length) {
      for (const node of remaining) permutations([...prefix, node], remaining.filter(n => n !== node), length);
      return;
    }
    if (prefix[0] !== [...prefix].sort()[0]) return;
    const legs: MatchEdge[] = [];
    for (let i = 0; i < prefix.length; i++) {
      const e = edges.find(e => e.giverId === prefix[i] && e.receiverId === prefix[(i + 1) % prefix.length]);
      if (!e) return;
      legs.push(e);
    }
    if (new Set(legs.map(e => e.inventoryItemId)).size !== length || new Set(legs.map(e => e.currency)).size !== 1) return;
    const json = JSON.stringify(legs.map(e => ({ currency: e.currency, distanceBucket: e.distanceBucket, giverId: e.giverId, inventoryItemId: e.inventoryItemId, listingCid: e.listingCid, receiverId: e.receiverId, valueMinor: e.valueMinor, wantCid: e.wantCid, wantCreatedAt: e.wantCreatedAt })));
    cycles.push({ key: createHash('sha256').update(json).digest('base64url'), legs });
  }
  for (let length = 2; length <= Math.min(size, nodes.length); length++) permutations([], nodes, length);
  cycles.sort((a, b) => b.legs.length - a.legs.length || compare(a.key, b.key));
  const used = new Set<string>();
  const items = new Set<string>();
  const selected = cycles.filter(c => {
    if (c.legs.some(e => used.has(e.giverId) || items.has(e.inventoryItemId))) return false;
    for (const e of c.legs) { used.add(e.giverId); items.add(e.inventoryItemId); }
    return true;
  });
  return { cycles, selected };
}

describe('independent cycle enumeration oracle', () => {
  it('matches exhaustive enumeration for every directed graph on three vertices', async () => {
    const all = ['a', 'b', 'c'].flatMap(a => ['a', 'b', 'c'].filter(b => b !== a).map(b => edge(a, b)));
    for (let mask = 0; mask < 2 ** all.length; mask++) {
      const input = all.filter((_, i) => mask & 2 ** i);
      const expected = oracle(input, 3);
      const result = await discoverCycles(input, { now, lmax: 3, monotonicNow: () => 0 });
      expect(result.stats.truncated).toBe('none');
      expect(result.stats.cyclesFound).toBe(expected.cycles.length);
      expect(result.suggestions.map(s => s.cycleKey)).toEqual(expected.selected.map(s => s.key));
    }
  });
  it('matches seeded four-vertex graphs and shuffled inputs, seed 42', async () => {
    const all = ['a', 'b', 'c', 'd'].flatMap(a => ['a', 'b', 'c', 'd'].filter(b => b !== a).map(b => edge(a, b)));
    let seed = 42;
    for (let sample = 0; sample < 200; sample++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const input = all.filter((_, i) => seed & 2 ** i);
      const expected = oracle(input, 4);
      const result = await discoverCycles(input, { now, lmax: 4, monotonicNow: () => 0 });
      expect(result.stats.cyclesFound).toBe(expected.cycles.length);
      expect(result.suggestions.map(s => s.cycleKey)).toEqual(expected.selected.map(s => s.key));
      expect(await discoverCycles([...input].reverse(), { now, lmax: 4, monotonicNow: () => 0 })).toEqual(result);
    }
  });
  it('rotation preserves identity while directed reversal does not', async () => {
    const forward = [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')];
    expect(await cycleKey([...forward.slice(1), forward[0]!])).toBe(await cycleKey(forward));
    expect(await cycleKey([edge('a', 'c'), edge('c', 'b'), edge('b', 'a')])).not.toBe(await cycleKey(forward));
    expect(() => canonicalRing([forward[0]!, forward[2]!, forward[1]!])).toThrow();
  });
  it('never joins duplicate items or incompatible currencies into a cycle', async () => {
    const input = [edge('a', 'b'), { ...edge('b', 'a'), inventoryItemId: 'item:a' }];
    expect((await discoverCycles(input, { now, monotonicNow: () => 0 })).suggestions).toEqual([]);
    expect((await discoverCycles([edge('a', 'b'), { ...edge('b', 'a'), currency: 'USD' }], { now, monotonicNow: () => 0 })).suggestions).toEqual([]);
  });
  it('caps retained candidates and explicitly reports incomplete results', async () => {
    const nodes = Array.from({ length: 8 }, (_, i) => String(i));
    const input = nodes.flatMap(a => nodes.filter(b => a !== b).map(b => edge(a, b)));
    const result = await discoverCycles(input, { now, lmax: 8, monotonicNow: () => 0 });
    expect(result.stats.truncated).toBe('results');
    expect(result.stats.cyclesFound).toBe(500);
    expect(result.suggestions.length).toBeLessThanOrEqual(500);
  });
  it('reports count and timing truncation without crossing the count cap', async () => {
    const all = ['a', 'b', 'c', 'd'].flatMap(a => ['a', 'b', 'c', 'd'].filter(b => b !== a).map(b => edge(a, b)));
    const count = await discoverCycles(all, { now, expansionBudget: 3, monotonicNow: () => 0 });
    expect(count.stats.truncated).toBe('expansions');
    expect(count.stats.expansions).toBe(3);
    let tick = 0;
    const timed = await discoverCycles(all, { now, timeBudgetMs: 1, monotonicNow: () => tick++ });
    expect(timed.stats.truncated).toBe('time');
    expect(timed.stats.expansions).toBeLessThanOrEqual(100000);
  });
});

// Real independent Ed25519 principals: no signature stub and no mutable verified flag.
import { didFromPublicKey, type UnlockedIdentity } from '../../packages/identity/src/index.ts';
import { signEnvelope } from '../../packages/federation/src/envelope.ts';
import { CONSENT_TYPE, PROPOSAL_TYPE, RESERVATION_TYPE, WITHDRAWAL_TYPE, evaluateCoordination, ingestCoordination, openCoordination, reviseCoordination, type CoordinationState } from '../../packages/mutiny/src/trade_proposals/index.ts';
async function principal(): Promise<UnlockedIdentity> {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as CryptoKeyPair;
  return {
    principal: didFromPublicKey(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))),
    sign: async bytes => new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, bytes.slice())),
    lock() { throw new Error('Test signing fixture has no persistence/locking claim'); },
  };
}
const signed = (identity: UnlockedIdentity, type: string, payload: unknown) => signEnvelope(identity, { type, payload, createdAt: new Date(now).toISOString(), seq: 1, prev: null });
async function opened() {
  const a = await principal(); const b = await principal(); const outsider = await principal();
  const payload = { subjectId: 'independent-exchange', coordinatorId: a.principal, revisionNo: 1, previousHash: null, legs: [edge(a.principal, b.principal), edge(b.principal, a.principal)], createdAt: now, consentDeadline: now + 3600000, executionWindowMs: 86400000 };
  const envelope = await signed(a, PROPOSAL_TYPE, payload);
  const state = await openCoordination(envelope, b.principal, now);
  return { a, b, outsider, payload, state };
}
function binding(state: CoordinationState) { return { subjectId: state.proposal.snapshot.subjectId, revisionHash: state.proposal.revisionHash, revisionNo: state.proposal.snapshot.revisionNo }; }
async function consent(state: CoordinationState, identity: UnlockedIdentity) { return signed(identity, CONSENT_TYPE, binding(state)); }
async function reservation(state: CoordinationState, identity: UnlockedIdentity) {
  return signed(identity, RESERVATION_TYPE, { subjectId: state.proposal.snapshot.subjectId, revisionHash: state.proposal.revisionHash, giverId: identity.principal, itemId: `item:${identity.principal}`, holdId: `hold:${identity.principal}`, expiresAt: new Date(now + 3600000 + 86400000).toISOString() });
}
describe('independent signed coordination attacks', () => {
  it('rejects a mathematically valid statement from a nonparticipant and another party cancellation', async () => {
    const { state, b, outsider } = await opened();
    await expect(ingestCoordination(state, await consent(state, outsider), now)).rejects.toThrow(/FORBIDDEN/);
    const cancel = await signed(b, WITHDRAWAL_TYPE, { ...binding(state), reason: 'cancel' });
    await expect(ingestCoordination(state, cancel, now)).rejects.toThrow(/FORBIDDEN/);
  });
  it('accepts reordered signed evidence, deduplicates replay, and requires unanimity', async () => {
    const { a, b, state } = await opened();
    const aConsent = await consent(state, a);
    let current = await ingestCoordination(state, aConsent, now);
    expect((await ingestCoordination(current, aConsent, now)).evidence.length).toBe(current.evidence.length);
    current = await ingestCoordination(current, await reservation(state, b), now);
    current = await ingestCoordination(current, await consent(state, b), now);
    const feasible = { feasible: true, revisionHash: state.proposal.revisionHash, checkedAt: now };
    expect(evaluateCoordination(current, feasible, now).status).toBe('proposed');
    current = await ingestCoordination(current, await reservation(state, a), now);
    expect(evaluateCoordination(current, feasible, now).status).toBe('committed');
  });
  it('new revisions invalidate old evidence and forks freeze coordination', async () => {
    const { a, state, payload } = await opened();
    const oldConsent = await consent(state, a);
    const revision = { ...payload, revisionNo: 2, previousHash: state.proposal.revisionHash };
    const changed = await reviseCoordination(state, await signed(a, PROPOSAL_TYPE, revision), now);
    expect(changed.consentCids).toEqual({});
    expect(changed.reservationCids).toEqual({});
    await expect(ingestCoordination(changed, oldConsent, now)).rejects.toThrow(/STALE/);
    const fork = await signed(a, PROPOSAL_TYPE, { ...revision, executionWindowMs: 86400001 });
    expect((await reviseCoordination(changed, fork, now)).status).toBe('frozen');
  });
  it('rejects nonfinite feasibility timestamps', async () => {
    const { state } = await opened();
    expect(() => evaluateCoordination(state, { feasible: true, revisionHash: state.proposal.revisionHash, checkedAt: Number.NaN }, now)).toThrow();
  });
  it('a local observation of expiry cannot be undone by moving the clock backwards', async () => {
    const { state } = await opened();
    const feasible = { feasible: true, revisionHash: state.proposal.revisionHash, checkedAt: now };
    const expired = evaluateCoordination(state, feasible, now + 3600000);
    expect(expired.status).toBe('cancelled');
    expect(evaluateCoordination(expired, feasible, now).status).toBe('cancelled');
  });
});

import { admitSignedGraph, WANT_TYPE } from '../../packages/mutiny/src/cycle_matching/admission.ts';
it('historical signed listing forks remain frozen regardless of projection delivery order', async () => {
  const alice = await principal(); const bob = await principal();
  const old = new Date(now - 3600000).toISOString();
  const listing = (owner: UnlockedIdentity, suffix: string) => ({
    listingId: `0192f3a4-0000-7000-8000-${suffix.padStart(12, '0')}`, ownerId: owner.principal,
    revision: 1, kind: 'sell', title: 'Independent listing', description: 'A legitimate public item description',
    categoryId: '0192f3a4-0000-7000-8000-000000000999', condition: 'good', tags: [], locale: 'en-CA',
    regionCell: 'c2b2q', barterOptIn: true, availability: 'available', value: { amount: '100', currency: 'CAD' },
    expiresAt: new Date(now + 86400000).toISOString(),
  });
  const payload = listing(alice, '1');
  const a1 = await signEnvelope(alice, { type: 'classrup.bazaar.listing/v1', createdAt: old, seq: 1, prev: null, payload });
  const fork = await signEnvelope(alice, { type: a1.type, createdAt: old, seq: 1, prev: null, payload: { ...payload, title: 'Forked historical statement' } });
  const a2 = await signEnvelope(alice, { type: a1.type, createdAt: old, seq: 2, prev: a1.cid, payload: { ...payload, revision: 2 } });
  const b1 = await signEnvelope(bob, { type: a1.type, createdAt: old, seq: 1, prev: null, payload: listing(bob, '2') });
  const want = await signEnvelope(alice, { type: WANT_TYPE, createdAt: old, seq: 1, prev: null, payload: { offeringListingCid: a2.cid, requestedListingCid: b1.cid, expiresAt: new Date(now + 86400000).toISOString() } });
  const options = { now, localPrincipal: alice.principal, optedIn: true, includeUnknownIdentities: true };
  const chronological = await admitSignedGraph([a1, fork, a2, b1], [want], options);
  const reversed = await admitSignedGraph([b1, a2, fork, a1], [want], options);
  expect(chronological.edges).toEqual([]);
  expect(reversed.edges).toEqual([]);
});
