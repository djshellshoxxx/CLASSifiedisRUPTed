import { describe, expect, it } from 'vitest';
import { createFakeClock } from '../clock/clock.ts';
import { createDeterministicIds, createSeededRandom } from '../ids/uuidv7.ts';
import { sha256Hex } from '../hash/canonical.ts';
import { createMemoryStorage } from '../storage/storage.ts';
import { createRelayAccess, loginMessage } from './access.ts';

describe('relay access tokens (CTR-CAP-001 sessions, CAP-10)', () => {
  it('TEST-PS-117-09.T26 challenge–response issues hashed opaque tokens; bad, replayed or expired proofs are UNAUTHENTICATED', async () => {
    const clock = createFakeClock('2026-11-04T10:00:00.000Z');
    const storage = createMemoryStorage();
    const decoder = new TextDecoder();
    let roles = ['member'];
    const access = createRelayAccess({
      storage,
      clock,
      ids: createDeterministicIds({ now: () => clock.now() }),
      relayId: 'relay-1',
      tenantId: 'tenant-r',
      random: createSeededRandom(9),
      verifier: { verify: (principal, message, sig) => sig === `sig(${principal}|${decoder.decode(message)})` },
      rolesFor: () => roles,
    });
    expect(await access.resolve(undefined)).toEqual({ ok: true, value: { actor: { kind: 'anonymous' }, tenantId: 'tenant-r' } });
    const c = await access.challenge();
    expect(c.message).toBe(loginMessage('relay-1', c.nonce));
    expect(c.expiresAt).toBe('2026-11-04T10:02:00.000Z');
    const did = 'did:key:z6MkAlice';
    const bad = await access.login({ principal: did, nonce: c.nonce, signature: 'forged' });
    expect(!bad.ok && bad.error.code).toBe('UNAUTHENTICATED');
    const c2 = await access.challenge();
    const login = await access.login({ principal: did, nonce: c2.nonce, signature: `sig(${did}|${c2.message})` });
    expect(login.ok).toBe(true);
    const token = login.ok ? login.value.token : '';
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const replay = await access.login({ principal: did, nonce: c2.nonce, signature: `sig(${did}|${c2.message})` });
    expect(!replay.ok && replay.error.code).toBe('UNAUTHENTICATED');
    const stored = await storage.read((tx) => tx.records.query({ tenant: 'tenant-r', type: 'platform.access_token', filters: [], orderSlot: 0, dir: 'asc', limit: 10 }));
    expect(stored.map((r) => r.id)).toEqual([await sha256Hex(token)]);
    expect(JSON.stringify(stored)).not.toContain(token);
    const s = await access.resolve(token);
    expect(s.ok && s.value.actor).toEqual({ kind: 'user', id: did, roles: ['member'] });
    roles = ['member', 'operator'];
    const s2 = await access.resolve(token);
    expect(s2.ok && s2.value.actor.kind !== 'anonymous' && s2.value.actor.roles).toEqual(['member', 'operator']);
    expect((await access.resolve('unknown')).ok).toBe(false);
    const c3 = await access.challenge();
    clock.advance(120_001);
    const late = await access.login({ principal: did, nonce: c3.nonce, signature: `sig(${did}|${c3.message})` });
    expect(!late.ok && late.error.code).toBe('UNAUTHENTICATED');
    clock.advance(7 * 24 * 3600_000);
    expect((await access.resolve(token)).ok).toBe(false);
    const c4 = await access.challenge();
    const l4 = await access.login({ principal: did, nonce: c4.nonce, signature: `sig(${did}|${c4.message})` });
    const t4 = l4.ok ? l4.value.token : '';
    await access.revoke(t4);
    expect((await access.resolve(t4)).ok).toBe(false);
  });
});
