import { describe, expect, it } from 'vitest';
import { keyIdOf, signEnvelope } from '@classrup/security';
import { ATTESTATION_CONTEXT, IDENTITY_EVENTS, IDENTITY_FLAGS, MODULES, POLICIES, PORTABLE_CONTEXT } from '../src/index';
import { admin, anon, asActor, bindingProof, deviceInput, login, makeWorld, newKeys, register, rotationAuth, system } from './helpers';

const SENSITIVE = /(^|[A-Z_.-])(lat|lng|lon|latitude|longitude|address|street|email|phone|mobile)([A-Z_.-]|$)|token|secret|tokenhash|codehash|password/i;

function keysDeep(value: unknown, path = ''): string[] {
  if (value === null || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap((v, i) => keysDeep(v, `${path}[${i}]`));
  return Object.entries(value).flatMap(([k, v]) => [`${path}.${k}`, ...keysDeep(v, `${path}.${k}`)]);
}

describe('identity package contract', () => {
  it('declares every emitted event, flag and permission in MODULES/POLICIES, and keeps events and public DTOs free of PII and secrets', () => {
    const w = makeWorld({ interactions: { wasCounterparty: () => true } });
    const boss = admin(w);
    const attester = newKeys();
    w.identity.evidence.registerAttester(asActor(boss.actor), { keyId: keyIdOf(attester.keys.publicKey), label: 'Notary', kinds: ['id_verified'] });

    const alice = register(w, 'Alice');
    const bob = register(w, 'Bobby');
    const a = login(w, alice);
    const b = login(w, bob);
    const carol = register(w, 'Carol');
    w.identity.profiles.update(asActor(login(w, carol).actor), { displayName: 'Carol C', bio: 'b' });
    const profile = w.identity.profiles.update(asActor(a.actor), { displayName: 'Alice A', bio: 'bio', regionCell: 'u4pru', languages: ['en'] });
    const claim = w.identity.evidence.claim(asActor(a.actor), { kind: 'local_resident', note: 'private note' });
    w.identity.evidence.attest(asActor(a.actor), {
      attestation: signEnvelope(attester.keys, ATTESTATION_CONTEXT, { accountId: alice.id, kind: 'id_verified', issuedAt: w.deps.clock.now() }),
    });
    const fb = w.identity.reputation.submit(asActor(b.actor), { rateeId: alice.id, subjectType: 'trade', subjectId: 't1', rating: 4, comment: 'fine' });
    w.identity.reputation.edit(asActor(b.actor), { feedbackId: fb.id, rating: 5 });
    w.identity.reputation.remove(asActor(boss.actor), { feedbackId: fb.id, reason: 'test removal' });
    w.identity.evidence.revoke(asActor(a.actor), { evidenceId: claim.id, reason: 'withdrawn' });
    w.identity.evidence.revokeAttester(asActor(boss.actor), { keyId: keyIdOf(attester.keys.publicKey) });
    w.identity.portable.import(asActor(a.actor), { envelope: signEnvelope(alice.keys, PORTABLE_CONTEXT, w.identity.portable.document(asActor(a.actor))) });

    const second = newKeys();
    w.identity.devices.add(asActor(a.actor), {
      device: deviceInput(second.keys, second.box),
      proof: bindingProof(second.keys, second.box, 'add_device', alice.id),
      authorization: rotationAuth(w, alice, 'add_device', keyIdOf(second.keys.publicKey)),
    });
    w.identity.devices.revoke(asActor(a.actor), {
      signingKeyId: keyIdOf(second.keys.publicKey),
      authorization: rotationAuth(w, alice, 'revoke_device', keyIdOf(second.keys.publicKey)),
    });
    w.identity.recovery.issue(asActor(a.actor), { authorization: rotationAuth(w, alice, 'issue_recovery', 'recovery') });
    const fresh = newKeys();
    w.identity.recovery.recover(anon(), {
      pseudonym: 'Bobby',
      code: bob.recoveryCodes[0] as string,
      device: deviceInput(fresh.keys, fresh.box),
      proof: bindingProof(fresh.keys, fresh.box, 'recover', bob.id),
    });
    w.identity.accounts.setStatus(asActor(boss.actor), { accountId: bob.id, status: 'suspended', reason: 'contract test' });
    w.identity.accounts.grantRole(system(), { accountId: alice.id, role: 'merchant' });
    w.identity.accounts.revokeRole(system(), { accountId: alice.id, role: 'merchant' });
    w.identity.sessions.revoke(asActor(a.actor), { sessionId: a.sessionId });
    w.deps.clock.advance(40 * 24 * 3600 * 1000);
    w.identity.sessions.expireDue(system());
    w.identity.evidence.expireDue(system());
    w.identity.accounts.erase(system(), { accountId: alice.id });

    const declared = new Set(MODULES.flatMap((m) => m.events ?? []));
    const emitted = new Set(w.deps.store.events.read().map((e) => e.event.type));
    for (const type of emitted) expect(declared.has(type), `${type} emitted but not declared`).toBe(true);
    expect(declared).toEqual(new Set(Object.values(IDENTITY_EVENTS)));

    for (const e of w.deps.store.events.read()) {
      const bad = keysDeep(e.event.payload).filter((k) => SENSITIVE.test(k));
      expect(bad, `${e.event.type} payload keys`).toEqual([]);
    }
    const publicViews = [
      profile,
      w.identity.profiles.get(anon(), { accountId: carol.id }),
      w.identity.accounts.lookup(anon(), { pseudonym: 'Carol' }),
      w.identity.reputation.get(anon(), { accountId: carol.id }),
      w.identity.evidence.listPublic(anon(), { accountId: carol.id }),
    ];
    for (const view of publicViews) expect(keysDeep(view).filter((k) => /address|email|phone|lat|lng|tokenHash/i.test(k))).toEqual([]);
  });

  it('keeps operation names, flags and permissions consistent with the registries', () => {
    const w = makeWorld();
    const ops = w.identity.operations;
    expect(ops).toHaveLength(39);
    const flags = new Set<string>(Object.values(IDENTITY_FLAGS));
    expect(MODULES.map((m) => m.flag).sort()).toEqual([...flags].sort());
    for (const op of ops) {
      expect(op.name).toMatch(/^identity\.[a-z_]+\.[a-z_]+$/);
      expect(flags.has(op.flag), op.name).toBe(true);
    }
    const permissions = new Set(POLICIES.map((p) => p.permission));
    for (const m of MODULES) for (const p of m.permissions ?? []) expect(permissions.has(p), p).toBe(true);
    for (const p of permissions) expect(MODULES.some((m) => m.permissions?.includes(p)), p).toBe(true);
    expect(MODULES.map((m) => m.id)).toEqual(['F07.S01.M01', 'F07.S01.M02', 'F07.S01.M03', 'F07.S02.M01', 'F07.S02.M02', 'F07.S03.M01', 'F07.S03.M02']);
  });
});
