import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { createFakeClock } from '../clock/clock.ts';
import { createDeterministicIds, createSeededRandom } from '../ids/uuidv7.ts';
import { sha256Hex } from '../hash/canonical.ts';
import { defineRepo } from '../storage/repo.ts';
import { writeScope } from '../storage/scope.ts';
import { createMemoryStorage, type Storage } from '../storage/storage.ts';
import { createRelayAccess, loginMessage, relayAccessDefinitions, type RelayAccessOptions, type SignatureVerifier } from './access.ts';
import { createBus } from './bus.ts';
import { createRegistry } from './define.ts';
import { ANONYMOUS, createRoleTableAuthz } from './ports.ts';

const DID = 'did:key:z6MkAlice';
const decoder = new TextDecoder();
const signs: SignatureVerifier = { verify: (principal, message, sig) => sig === `sig(${principal}|${decoder.decode(message)})` };
const sign = (message: string, principal = DID) => `sig(${principal}|${message})`;

function relayAccess(extra: Partial<RelayAccessOptions> = {}) {
  const clock = createFakeClock('2026-11-04T10:00:00.000Z');
  const storage = extra.storage ?? createMemoryStorage();
  const access = createRelayAccess({ storage, clock, ids: createDeterministicIds({ now: () => clock.now() }), relayId: 'relay-1', tenantId: 'tenant-r', random: createSeededRandom(9), verifier: signs, ...extra });
  const defs = relayAccessDefinitions(access);
  const authz = createRoleTableAuthz({ 'platform.access_token.challenge': ['anonymous'], 'platform.access_token.login': ['anonymous'], 'platform.access_token.revoke': ['anonymous'] });
  const bus = createBus({ registry: createRegistry().add(...defs.all), storage, clock, ids: createDeterministicIds({ seed: 2, now: () => clock.now() }), authz });
  const remote = { actor: ANONYMOUS, tenantId: 'tenant-r', origin: 'remote' as const };
  const rows = (type: string) => storage.read((tx) => tx.records.query({ tenant: 'tenant-r', type, filters: [], orderSlot: 0, dir: 'asc', limit: 500 }));
  const busChallenge = async () => {
    const ch = await bus.dispatch(remote, 'platform.access_token.challenge', {});
    if (!ch.ok) throw new Error(ch.error.code);
    return ch.value.value as { nonce: string; message: string; expiresAt: string };
  };
  const busLogin = (nonce: string, signature: string) => bus.dispatch(remote, 'platform.access_token.login', { principal: DID, nonce, signature });
  return { clock, storage, access, bus, remote, rows, busChallenge, busLogin };
}

function settlesWithin<T>(p: Promise<T>, ms: number): Promise<T | 'timeout'> {
  return Promise.race([p, new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), ms))]);
}

describe('relay access tokens (CTR-CAP-001 sessions, CAP-10)', () => {
  it('TEST-PS-117-09.T26 challenge–response issues hashed opaque tokens; bad, replayed or expired proofs are UNAUTHENTICATED', async () => {
    let roles = ['member'];
    const { clock, access, rows } = relayAccess({ rolesFor: () => roles });
    expect(await access.resolve(undefined)).toEqual({ ok: true, value: { actor: { kind: 'anonymous' }, tenantId: 'tenant-r' } });
    const c = await access.challenge();
    expect(c.message).toBe(loginMessage('relay-1', c.nonce));
    expect(c.expiresAt).toBe('2026-11-04T10:02:00.000Z');
    const bad = await access.login({ principal: DID, nonce: c.nonce, signature: 'forged-signature-xx' });
    expect(!bad.ok && bad.error.code).toBe('UNAUTHENTICATED');
    const afterForgery = await access.login({ principal: DID, nonce: c.nonce, signature: sign(c.message) });
    expect(!afterForgery.ok && afterForgery.error.code).toBe('UNAUTHENTICATED');
    const c2 = await access.challenge();
    const login = await access.login({ principal: DID, nonce: c2.nonce, signature: sign(c2.message) });
    expect(login.ok).toBe(true);
    const token = login.ok ? login.value.token : '';
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const replay = await access.login({ principal: DID, nonce: c2.nonce, signature: sign(c2.message) });
    expect(!replay.ok && replay.error.code).toBe('UNAUTHENTICATED');
    const stored = await rows('platform.access_token');
    expect(stored.map((r) => r.id)).toEqual([await sha256Hex(token)]);
    expect(JSON.stringify(stored)).not.toContain(token);
    const s = await access.resolve(token);
    expect(s.ok && s.value.actor).toEqual({ kind: 'user', id: DID, roles: ['member'] });
    roles = ['member', 'operator'];
    const s2 = await access.resolve(token);
    expect(s2.ok && s2.value.actor.kind !== 'anonymous' && s2.value.actor.roles).toEqual(['member', 'operator']);
    expect((await access.resolve('unknown')).ok).toBe(false);
    const c3 = await access.challenge();
    clock.advance(120_001);
    const late = await access.login({ principal: DID, nonce: c3.nonce, signature: sign(c3.message) });
    expect(!late.ok && late.error.code).toBe('UNAUTHENTICATED');
    clock.advance(7 * 24 * 3600_000);
    expect((await access.resolve(token)).ok).toBe(false);
    const c4 = await access.challenge();
    const l4 = await access.login({ principal: DID, nonce: c4.nonce, signature: sign(c4.message) });
    const t4 = l4.ok ? l4.value.token : '';
    await access.revoke(t4);
    expect((await access.resolve(t4)).ok).toBe(false);
    expect(await rows('platform.access_nonce')).toEqual([]);
  });

  it('TEST-PS-117-09.T26 the same proofs through the relay commands: forged, reused after forgery, replayed and expired nonces stay consumed', async () => {
    const { clock, access, rows, busChallenge, busLogin, bus, remote } = relayAccess();
    const c = await busChallenge();
    expect(c.message).toBe(loginMessage('relay-1', c.nonce));
    for (let i = 0; i < 3; i++) {
      const forged = await busLogin(c.nonce, `forged-signature-${i}x`);
      expect(!forged.ok && forged.error.code).toBe('UNAUTHENTICATED');
    }
    const reused = await busLogin(c.nonce, sign(c.message));
    expect(!reused.ok && reused.error.code).toBe('UNAUTHENTICATED');
    const fresh = await busChallenge();
    const lg = await busLogin(fresh.nonce, sign(fresh.message));
    const tok = (lg.ok ? lg.value.value : {}) as { token: string };
    expect((await access.resolve(tok.token)).ok).toBe(true);
    const replay = await busLogin(fresh.nonce, sign(fresh.message));
    expect(!replay.ok && replay.error.code).toBe('UNAUTHENTICATED');
    const old = await busChallenge();
    clock.advance(120_000);
    const expired = await busLogin(old.nonce, sign(old.message));
    expect(!expired.ok && expired.error.code).toBe('UNAUTHENTICATED');
    const rv = await bus.dispatch(remote, 'platform.access_token.revoke', { token: tok.token }, { idempotencyKey: createDeterministicIds({ seed: 4, now: () => clock.now() }).next() });
    expect(rv.ok && rv.value.value).toEqual({ revoked: true });
    expect((await access.resolve(tok.token)).ok).toBe(false);
    for (let i = 0; i < 50; i++) await busChallenge();
    expect(access.pendingChallenges()).toBe(50);
    clock.advance(600_000);
    expect(access.pendingChallenges()).toBe(0);
    expect(await rows('platform.access_nonce')).toEqual([]);
    expect(await rows('platform.access_token')).toEqual([]);
  });

  it('TEST-PS-117-09.T26 outstanding challenges are bounded and expired tokens are purged by the maintenance sweep', async () => {
    const { clock, access, rows } = relayAccess({ maxPendingChallenges: 3 });
    const first = await access.challenge();
    for (let i = 0; i < 5; i++) await access.challenge();
    expect(access.pendingChallenges()).toBe(3);
    const dropped = await access.login({ principal: DID, nonce: first.nonce, signature: sign(first.message) });
    expect(!dropped.ok && dropped.error.code).toBe('UNAUTHENTICATED');
    const issue = async () => {
      const c = await access.challenge();
      const l = await access.login({ principal: DID, nonce: c.nonce, signature: sign(c.message) });
      return l.ok ? l.value.token : '';
    };
    const idleToken = await issue();
    clock.advance(6 * 24 * 3600_000);
    const activeToken = await issue();
    clock.advance(24 * 3600_000);
    expect(await access.purgeExpired()).toEqual({ ok: true, value: 1 });
    expect((await rows('platform.access_token')).map((r) => r.id)).toEqual([await sha256Hex(activeToken)]);
    expect((await access.resolve(idleToken)).ok).toBe(false);
    for (let day = 0; day < 28; day++) {
      clock.advance(24 * 3600_000);
      expect((await access.resolve(activeToken)).ok).toBe(true);
    }
    expect(await access.purgeExpired()).toEqual({ ok: true, value: 0 });
    clock.advance(24 * 3600_000);
    expect(await access.purgeExpired()).toEqual({ ok: true, value: 1 });
    expect(await rows('platform.access_token')).toEqual([]);
    expect(await access.purgeExpired()).toEqual({ ok: true, value: 0 });
  });

  it('TEST-PS-117-09.T26 login never re-enters relay storage: roles resolve per request and the verifier reads through the login transaction', async () => {
    const storage: Storage = createMemoryStorage();
    const deviceKeys = defineRepo({ type: 'test.device_key', schema: z.strictObject({ principal: z.string() }) });
    const clock = createFakeClock('2026-11-04T10:00:00.000Z');
    const ids = createDeterministicIds({ seed: 6, now: () => clock.now() });
    await storage.transaction((tx) => writeScope({ tx, tenantId: 'tenant-r', clock, ids, deliveryEligible: false }).repo(deviceKeys).put(DID, { principal: DID }, { expectedRevision: 0 }));
    const registry: SignatureVerifier = { verify: async (principal, message, sig, repos) => repos.repo(deviceKeys).get(principal) !== undefined && signs.verify(principal, message, sig, repos) };
    const { access, busChallenge, busLogin } = relayAccess({ storage, verifier: registry, rolesFor: (p) => storage.read((tx) => (tx.records.get('tenant-r', 'test.device_key', p) ? ['member'] : [])) });
    const c = await access.challenge();
    const login = await settlesWithin(access.login({ principal: DID, nonce: c.nonce, signature: sign(c.message) }), 2000);
    expect(login !== 'timeout' && login.ok).toBe(true);
    const token = login !== 'timeout' && login.ok ? login.value.token : '';
    const session = await settlesWithin(access.resolve(token), 2000);
    expect(session !== 'timeout' && session.ok && session.value.actor).toEqual({ kind: 'user', id: DID, roles: ['member'] });
    const bc = await busChallenge();
    const viaBus = await settlesWithin(busLogin(bc.nonce, sign(bc.message)), 2000);
    expect(viaBus !== 'timeout' && viaBus.ok).toBe(true);
    const stranger = await access.challenge();
    const unknown = await access.login({ principal: 'did:key:z6MkMallory', nonce: stranger.nonce, signature: sign(stranger.message, 'did:key:z6MkMallory') });
    expect(!unknown.ok && unknown.error.code).toBe('UNAUTHENTICATED');
    expect(await settlesWithin(storage.ping(), 2000)).toBe(true);
    expect(await storage.read((tx) => tx.records.query({ tenant: 'tenant-r', type: 'platform.access_token', filters: [], orderSlot: 0, dir: 'asc', limit: 10 }).map((r) => (r.data as { roles: string[] }).roles))).toEqual([[], []]);
  });
});
