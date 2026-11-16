import { describe, expect, it } from 'vitest';
import { didFromPublicKey, type UnlockedIdentity } from '@classrup/identity';
import { signEnvelope } from '@classrup/federation';
import { admitSignedGraph, WANT_TYPE } from './admission.ts';
import { discoverCycles } from './index.ts';
const now = Date.parse('2026-11-09T10:00:00Z');
const old = new Date(now - 3600000).toISOString();
async function identity(): Promise<UnlockedIdentity> {
  const keys = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as CryptoKeyPair;
  return { principal: didFromPublicKey(new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey))), sign: async bytes => new Uint8Array(await crypto.subtle.sign('Ed25519', keys.privateKey, bytes.slice())), lock() {} };
}
async function fixture() {
  const a = await identity(); const b = await identity();
  const makeListing = async (owner: UnlockedIdentity, suffix: string) => signEnvelope(owner, { type: 'classrup.bazaar.listing/v1', createdAt: old, seq: 1, prev: null, payload: { listingId: `0192f3a4-0000-7000-8000-${suffix.padStart(12, '0')}`, ownerId: owner.principal, revision: 1, kind: 'sell', title: 'An item', description: 'A legitimate public description', categoryId: '0192f3a4-0000-7000-8000-000000000999', condition: 'good', tags: [], locale: 'en-CA', regionCell: 'c2b2q', barterOptIn: true, availability: 'available', value: { amount: '100', currency: 'CAD' }, expiresAt: new Date(now + 86400000).toISOString() } });
  const la = await makeListing(a, '1'); const lb = await makeListing(b, '2');
  const wa = await signEnvelope(a, { type: WANT_TYPE, createdAt: old, seq: 1, prev: null, payload: { offeringListingCid: la.cid, requestedListingCid: lb.cid, expiresAt: new Date(now + 86400000).toISOString() } });
  const wb = await signEnvelope(b, { type: WANT_TYPE, createdAt: old, seq: 1, prev: null, payload: { offeringListingCid: lb.cid, requestedListingCid: la.cid, expiresAt: new Date(now + 86400000).toISOString() } });
  return { a, b, la, lb, wa, wb, options: { now, localPrincipal: a.principal, optedIn: true, includeUnknownIdentities: true } };
}
describe('signed exact-item alpha graph admission', () => {
  it('feeds actual verified signatures to two-party matching', async () => {
    const f = await fixture();
    const graph = await admitSignedGraph([f.la, f.lb], [f.wa, f.wb], f.options);
    expect(graph.edges).toHaveLength(2);
    const cycles = await discoverCycles(graph.edges, { now, monotonicNow: () => 0 });
    expect(cycles.suggestions).toHaveLength(1);
    expect(cycles.suggestions[0]!.legs).toHaveLength(2);
  });
  it('excludes unknown identities by default and local blocks', async () => {
    const f = await fixture();
    expect((await admitSignedGraph([f.la, f.lb], [f.wa, f.wb], { ...f.options, includeUnknownIdentities: false })).edges).toHaveLength(0);
    expect((await admitSignedGraph([f.la, f.lb], [f.wa, f.wb], { ...f.options, blockedOwners: [f.b.principal] })).edges).toHaveLength(0);
  });
  it('rejects signature substitution and unauthorized offered listing', async () => {
    const f = await fixture();
    await expect(admitSignedGraph([f.la, { ...f.lb, author: f.a.principal }], [f.wa], f.options)).rejects.toThrow();
    const bad = await signEnvelope(f.a, { type: WANT_TYPE, createdAt: old, seq: 1, prev: null, payload: f.wb.payload });
    await expect(admitSignedGraph([f.la, f.lb], [bad], f.options)).rejects.toThrow('unauthorized');
  });
  it('excludes tombstoned and same revision forked listings', async () => {
    const f = await fixture();
    const tombstone = await signEnvelope(f.a, { type: 'classrup.alpha.tombstone/v1', createdAt: old, seq: 2, prev: f.la.cid, payload: { target: f.la.cid, reason: 'archived', listingId: (f.la.payload as {listingId:string}).listingId, ownerId: f.a.principal, revision: 2 } });
    expect((await admitSignedGraph([f.la, f.lb, tombstone], [f.wa, f.wb], f.options)).edges).toHaveLength(0);
    const fork = await signEnvelope(f.a, { type: f.la.type, createdAt: old, seq: 1, prev: null, payload: { ...f.la.payload as Record<string, unknown>, title: 'Forked item' } });
    expect((await admitSignedGraph([f.la, f.lb, fork], [f.wa, f.wb], f.options)).edges).toHaveLength(0);
  });
  it('does not infer wants; fresh signed wants wait the specified minimum age', async () => {
    const f = await fixture();
    expect((await admitSignedGraph([f.la, f.lb], [], f.options)).edges).toHaveLength(0);
    const fresh = await signEnvelope(f.a, { type: WANT_TYPE, createdAt: new Date(now).toISOString(), seq: 1, prev: null, payload: f.wa.payload });
    expect((await admitSignedGraph([f.la, f.lb], [fresh], f.options)).edges).toHaveLength(0);
  });
});
