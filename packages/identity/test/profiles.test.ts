import { describe, expect, it } from 'vitest';
import { DAY, DomainError, MINUTE } from '@classrup/kernel';
import { keyIdOf, signEnvelope } from '@classrup/security';
import { PORTABLE_CONTEXT } from '../src/index';
import { anon, asActor, bindingProof, deviceInput, eventsOfType, login, makeWorld, newKeys, register } from './helpers';

const codeOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof DomainError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
};

describe('F07.S02.M02 profiles', () => {
  it('stores fields and filters every read by visibility and viewer relation', () => {
    const owner = { participants: new Set<string>() };
    const w = makeWorld({ relations: { isParticipant: (v) => owner.participants.has(v) } });
    const alice = register(w, 'Alice');
    const bob = register(w, 'Bobby');
    const carol = register(w, 'Carol');
    const a = login(w, alice);
    const updated = w.identity.profiles.update(asActor(a.actor), {
      displayName: 'Alice A',
      bio: 'Books and bikes',
      languages: ['en', 'fr', 'en'],
      regionCell: 'u4pru',
      visibility: { bio: 'private', regionCell: 'participants' },
    });
    expect(updated).toMatchObject({ displayName: 'Alice A', languages: ['en', 'fr'], regionCell: 'u4pru', visibility: { bio: 'private', displayName: 'public' } });

    const asAnon = w.identity.profiles.get(anon(), { accountId: alice.id });
    expect(asAnon).toEqual({ accountId: alice.id, pseudonym: 'Alice', displayName: 'Alice A', languages: ['en', 'fr'], version: 1 });
    const asStranger = w.identity.profiles.get(asActor(login(w, carol).actor), { accountId: alice.id });
    expect(asStranger.regionCell).toBeUndefined();
    owner.participants.add(bob.id);
    const asPartner = w.identity.profiles.get(asActor(login(w, bob).actor), { accountId: alice.id });
    expect(asPartner).toMatchObject({ regionCell: 'u4pru' });
    expect(asPartner.bio).toBeUndefined();
    expect(asPartner.visibility).toBeUndefined();
    expect(w.identity.profiles.get(asActor(a.actor))).toMatchObject({ bio: 'Books and bikes', regionCell: 'u4pru' });
  });

  it('never leaks participant or private values through events', () => {
    const w = makeWorld();
    const u = register(w, 'Dana');
    const s = login(w, u);
    w.identity.profiles.update(asActor(s.actor), { bio: 'secret bio text', regionCell: 'u4pru' });
    const text = JSON.stringify(w.deps.store.events.read());
    expect(text).not.toContain('secret bio text');
    expect(text).not.toContain('u4pru');
    expect(eventsOfType(w, 'identity.profile.updated')[0]?.payload).toEqual({ accountId: u.id, changedFields: ['bio', 'regionCell'] });
  });

  it('rejects precise cells, bad languages, empty updates and foreign avatar refs; clears optional fields with null', () => {
    const w = makeWorld();
    const u = register(w, 'Evan');
    const s = login(w, u);
    const ctx = () => asActor(s.actor);
    expect(codeOf(() => w.identity.profiles.update(ctx(), { regionCell: 'u4pruydq' }))).toBe('GEO.TOO_PRECISE');
    expect(codeOf(() => w.identity.profiles.update(ctx(), { regionCell: 'u4!!' }))).toBe('GEO.INVALID_CELL');
    expect(codeOf(() => w.identity.profiles.update(ctx(), { languages: ['English'] }))).toBe('VALIDATION.INVALID_INPUT');
    expect(codeOf(() => w.identity.profiles.update(ctx(), {}))).toBe('IDENTITY.PROFILE_EMPTY_UPDATE');
    expect(codeOf(() => w.identity.profiles.update(ctx(), { avatarRef: 'nope' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(codeOf(() => w.identity.profiles.update(ctx(), { lat: 1 } as never))).toBe('VALIDATION.INVALID_INPUT');
    w.identity.profiles.update(ctx(), { displayName: 'Evan E', regionCell: 'u4pru' });
    const cleared = w.identity.profiles.update(ctx(), { displayName: null, regionCell: null });
    expect(cleared.displayName).toBeUndefined();
    expect(cleared.regionCell).toBeUndefined();
  });

  it('applies optimistic concurrency, authorization and idempotent replay', () => {
    const w = makeWorld();
    const u = register(w, 'Fiona');
    const s = login(w, u);
    const first = w.identity.profiles.update(asActor(s.actor, 'prof-key-001'), { displayName: 'Fi', expectedVersion: 0 });
    expect(w.identity.profiles.update(asActor(s.actor, 'prof-key-001'), { displayName: 'Fi', expectedVersion: 0 })).toEqual(first);
    expect(codeOf(() => w.identity.profiles.update(asActor(s.actor), { bio: 'x', expectedVersion: 0 }))).toBe('STORE.VERSION_CONFLICT');
    expect(codeOf(() => w.identity.profiles.update(asActor(s.actor, 'prof-key-001'), { displayName: 'Other' }))).toBe('IDEMPOTENCY.KEY_REUSED');
    expect(codeOf(() => w.identity.profiles.update(anon(), { displayName: 'x' }))).toBe('AUTH.REQUIRED');
  });

  it('hides blocked viewers, inactive accounts and unknown profiles', () => {
    const blocked = new Set<string>();
    const w = makeWorld({ blocks: { isBlocked: (a, b) => blocked.has(`${a}|${b}`) || blocked.has(`${b}|${a}`) } });
    const gwen = register(w, 'Gwen');
    const hugo = register(w, 'Hugo');
    const hugoSession = login(w, hugo);
    expect(w.identity.profiles.get(asActor(hugoSession.actor), { accountId: gwen.id }).pseudonym).toBe('Gwen');
    blocked.add(`${gwen.id}|${hugo.id}`);
    expect(codeOf(() => w.identity.profiles.get(asActor(hugoSession.actor), { accountId: gwen.id }))).toBe('IDENTITY.PROFILE_NOT_FOUND');
    expect(w.identity.profiles.get(asActor(login(w, gwen).actor)).accountId).toBe(gwen.id);
    expect(codeOf(() => w.identity.profiles.get(anon(), { accountId: 'acct_00000000000000000000000000' }))).toBe('IDENTITY.PROFILE_NOT_FOUND');
  });
});

describe('F07.S02.M01 portable identity', () => {
  function signedDoc(w: ReturnType<typeof makeWorld>, u: ReturnType<typeof register>) {
    const s = login(w, u);
    const document = w.identity.portable.document(asActor(s.actor));
    return { s, document, envelope: signEnvelope(u.keys, PORTABLE_CONTEXT, document) };
  }

  it('exports a versioned document with only public profile fields and verifies the client signature', () => {
    const w = makeWorld();
    const u = register(w, 'Ines');
    const s = login(w, u);
    w.identity.profiles.update(asActor(s.actor), { displayName: 'Ines I', bio: 'private bio', regionCell: 'u4pru', visibility: { bio: 'private' } });
    const { document, envelope } = signedDoc(w, u);
    expect(document).toMatchObject({ format: 'classrup.identity', version: 1, pseudonym: 'Ines', profile: { displayName: 'Ines I' } });
    expect(document.profile).not.toHaveProperty('bio');
    expect(document.profile).not.toHaveProperty('regionCell');
    expect(document.keys.signingKeyIds).toEqual([keyIdOf(u.keys.publicKey)]);
    expect(w.identity.portable.verify(anon(), { envelope })).toEqual({ valid: true, pseudonym: 'Ines', signerKeyId: keyIdOf(u.keys.publicKey), exportedAt: document.exportedAt });
    const tampered = { ...envelope, payload: { ...document, pseudonym: 'Impostor' } };
    expect(w.identity.portable.verify(anon(), { envelope: tampered })).toEqual({ valid: false, reason: 'signature' });
    const stranger = newKeys();
    const foreign = signEnvelope(stranger.keys, PORTABLE_CONTEXT, document);
    expect(w.identity.portable.verify(anon(), { envelope: foreign })).toEqual({ valid: false, reason: 'signer_not_listed' });
    const badFormat = signEnvelope(u.keys, PORTABLE_CONTEXT, { ...document, version: 2 });
    expect(w.identity.portable.verify(anon(), { envelope: badFormat })).toEqual({ valid: false, reason: 'format' });
  });

  it('refuses a document signed by a key that is not active on the importing account', () => {
    const origin = makeWorld();
    const u1 = register(origin, 'Jules');
    const { envelope } = signedDoc(origin, u1);
    const target = makeWorld({}, 99);
    const t = login(target, register(target, 'Julia'));
    expect(codeOf(() => target.identity.portable.import(asActor(t.actor), { envelope }))).toBe('IDENTITY.PORTABLE_KEY_MISMATCH');
  });

  it('proves continuity: the same device key registered on both relays', () => {
    const origin = makeWorld();
    const u1 = register(origin, 'Kara');
    const s1 = login(origin, u1);
    origin.identity.profiles.update(asActor(s1.actor), { displayName: 'Kara K', languages: ['de'], regionCell: 'u33db', visibility: { regionCell: 'public' } });
    const { envelope, document } = signedDoc(origin, u1);

    const target = makeWorld({}, 99);
    const { keys, box } = u1;
    const out = target.identity.accounts.register(anon(), {
      pseudonym: 'Kara_new',
      device: deviceInput(keys, box),
      proof: bindingProof(keys, box, 'register', 'kara_new'),
    });
    const t = login(target, { id: out.account.id, pseudonym: 'Kara_new', keys, box, recoveryCodes: [] });
    const result = target.identity.portable.import(asActor(t.actor, 'import-key-01'), { envelope, applyProfile: true });
    expect(result).toEqual({ imported: true, sourcePseudonym: 'Kara', applied: ['displayName', 'languages', 'regionCell'] });
    expect(target.identity.profiles.get(anon(), { accountId: out.account.id })).toMatchObject({ displayName: 'Kara K', languages: ['de'] });
    // Imported fields get this relay's conservative default visibility, so the region stays participants-only.
    expect(target.identity.profiles.get(anon(), { accountId: out.account.id }).regionCell).toBeUndefined();
    expect(target.identity.profiles.get(asActor(t.actor)).regionCell).toBe('u33db');
    expect(target.identity.portable.import(asActor(t.actor, 'import-key-01'), { envelope, applyProfile: true })).toEqual(result);
    expect(codeOf(() => target.identity.portable.import(asActor(t.actor), { envelope, applyProfile: true }))).toBe('IDENTITY.PORTABLE_ALREADY_IMPORTED');
    expect(eventsOfType(target, 'identity.portable.imported')).toHaveLength(1);

    target.deps.clock.advance(31 * DAY);
    const staleEnvelope = signEnvelope(keys, PORTABLE_CONTEXT, { ...document, exportedAt: document.exportedAt - 1 });
    expect(codeOf(() => target.identity.portable.import(asActor(t.actor), { envelope: staleEnvelope }))).toBe('IDENTITY.PORTABLE_STALE');
    const future = signEnvelope(keys, PORTABLE_CONTEXT, { ...document, exportedAt: target.deps.clock.now() + 10 * MINUTE });
    expect(codeOf(() => target.identity.portable.import(asActor(t.actor), { envelope: future }))).toBe('IDENTITY.PORTABLE_STALE');
    expect(codeOf(() => target.identity.portable.import(asActor(t.actor), { envelope: { ...envelope, sig: 'AAAA' } }))).toBe('IDENTITY.PORTABLE_INVALID');
  });

  it('requires authentication for export and import', () => {
    const w = makeWorld();
    const u = register(w, 'Lena');
    const { envelope } = signedDoc(w, u);
    expect(codeOf(() => w.identity.portable.document(anon()))).toBe('AUTH.REQUIRED');
    expect(codeOf(() => w.identity.portable.import(anon(), { envelope }))).toBe('AUTH.REQUIRED');
  });
});
