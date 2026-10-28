import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ANONYMOUS, DomainError, ctxFor, testActor } from '@classrup/kernel';
import { createTestDeps, staticFlags } from '@classrup/kernel';
import { PolicyAuthorizer } from '@classrup/security';
import { createIdentity, MODULES, normalizePseudonym, POLICIES } from '../src/index';
import { anon, admin, asActor, bindingProof, deviceInput, eventsOfType, login, makeWorld, newKeys, register, system } from './helpers';

const codeOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof DomainError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
};

describe('F07.S01.M01 pseudonym rules', () => {
  it('normalises with NFKC and folds case for uniqueness', () => {
    expect(normalizePseudonym('Ｂob_1').display).toBe('Bob_1');
    expect(normalizePseudonym('Bob.Smith').key).toBe('bob.smith');
  });

  it.each([
    ['ab', 'IDENTITY.PSEUDONYM_INVALID'],
    ['x'.repeat(33), 'IDENTITY.PSEUDONYM_INVALID'],
    ['has space', 'IDENTITY.PSEUDONYM_INVALID'],
    ['emoji😀name', 'IDENTITY.PSEUDONYM_INVALID'],
    ['bob@home', 'IDENTITY.PSEUDONYM_INVALID'],
    ['pаypal', 'IDENTITY.PSEUDONYM_INVALID'],
    ['Admin', 'IDENTITY.PSEUDONYM_RESERVED'],
    ['mod.erator', 'IDENTITY.PSEUDONYM_RESERVED'],
    ['SYSTEM', 'IDENTITY.PSEUDONYM_RESERVED'],
    ['deleted_abc', 'IDENTITY.PSEUDONYM_RESERVED'],
  ])('rejects %s', (name, code) => {
    expect(codeOf(() => normalizePseudonym(name))).toBe(code);
  });

  it('accepts any allowed string and the key is stable under re-normalisation (property)', () => {
    const chars = [...'abcXYZ019_.-éß漢'];
    const name = fc.array(fc.constantFrom(...chars), { minLength: 3, maxLength: 32 }).map((a) => a.join(''));
    fc.assert(
      fc.property(name, (n) => {
        try {
          const a = normalizePseudonym(n);
          const b = normalizePseudonym(a.display);
          return a.key === b.key && a.display === b.display;
        } catch (e) {
          return e instanceof DomainError && e.code.startsWith('IDENTITY.PSEUDONYM_');
        }
      }),
    );
  });
});

describe('F07.S01.M01 accounts', () => {
  it('registers with only a pseudonym and device keys, issuing ten recovery codes once', () => {
    const w = makeWorld();
    const { keys, box } = newKeys();
    const out = w.identity.accounts.register(anon(), { pseudonym: 'Alice', device: deviceInput(keys, box), proof: bindingProof(keys, box, 'register', 'alice') });
    expect(out.account).toMatchObject({ pseudonym: 'Alice', status: 'active', roles: ['member'], keyEpoch: 0 });
    expect(out.account.devices).toHaveLength(1);
    expect(out.recoveryCodes).toHaveLength(10);
    expect(new Set(out.recoveryCodes).size).toBe(10);
    expect(JSON.stringify(out.account)).not.toMatch(/email|phone|password/i);
    expect(w.identity.accountLookup.get(out.account.id)).toMatchObject({ pseudonym: 'Alice', signingKeyIds: [out.account.devices[0]?.signingKeyId] });
  });

  it('enforces pseudonym uniqueness case-insensitively per tenant', () => {
    const w = makeWorld();
    register(w, 'Alice');
    const { keys, box } = newKeys();
    const attempt = () => w.identity.accounts.register(anon(), { pseudonym: 'aLiCe', device: deviceInput(keys, box), proof: bindingProof(keys, box, 'register', 'alice') });
    expect(codeOf(attempt)).toBe('IDENTITY.PSEUDONYM_TAKEN');
    const other = ctxFor(ANONYMOUS('tnt_other'));
    expect(w.identity.accounts.register(other, { pseudonym: 'aLiCe', device: deviceInput(keys, box), proof: bindingProof(keys, box, 'register', 'alice') }).account.tenantId).toBe('tnt_other');
  });

  it('rejects a device key without proof of possession', () => {
    const w = makeWorld();
    const a = newKeys();
    const b = newKeys();
    const attempt = () =>
      w.identity.accounts.register(anon(), { pseudonym: 'mallory', device: deviceInput(a.keys, a.box), proof: bindingProof(b.keys, b.box, 'register', 'mallory') });
    expect(codeOf(attempt)).toBe('IDENTITY.KEY_PROOF_INVALID');
    const wrongSubject = () =>
      w.identity.accounts.register(anon(), { pseudonym: 'mallory', device: deviceInput(a.keys, a.box), proof: bindingProof(a.keys, a.box, 'register', 'someone-else') });
    expect(codeOf(wrongSubject)).toBe('IDENTITY.KEY_PROOF_INVALID');
    expect(codeOf(() => w.identity.accounts.register(anon(), { pseudonym: 'mallory' } as never))).toBe('VALIDATION.INVALID_INPUT');
  });

  it('replays an idempotent registration and rejects key reuse with a different request', () => {
    const w = makeWorld();
    const { keys, box } = newKeys();
    const input = { pseudonym: 'Carol', device: deviceInput(keys, box), proof: bindingProof(keys, box, 'register', 'carol') };
    const first = w.identity.accounts.register(anon('reg-key-0001'), input);
    const second = w.identity.accounts.register(anon('reg-key-0001'), input);
    expect(second).toEqual(first);
    expect(w.deps.store.collection('identity_accounts').count()).toBe(1);
    const other = newKeys();
    const different = { pseudonym: 'Dave', device: deviceInput(other.keys, other.box), proof: bindingProof(other.keys, other.box, 'register', 'dave') };
    expect(codeOf(() => w.identity.accounts.register(anon('reg-key-0001'), different))).toBe('IDEMPOTENCY.KEY_REUSED');
  });

  it('emits public-only events without secrets or hashes', () => {
    const w = makeWorld();
    const u = register(w, 'Erin');
    const text = JSON.stringify(w.deps.store.events.read());
    for (const code of u.recoveryCodes) expect(text).not.toContain(code.replace(/-/g, ''));
    expect(text).not.toMatch(/hash|token|secret/i);
    expect(eventsOfType(w, 'identity.account.registered')).toHaveLength(1);
    expect(eventsOfType(w, 'identity.recovery.codes_issued')[0]?.payload).toEqual({ accountId: u.id, count: 10 });
  });

  it('can be disabled by feature flag', () => {
    const deps = createTestDeps({ authz: new PolicyAuthorizer(POLICIES), flags: staticFlags(['identity.pseudonyms']) });
    const identity = createIdentity(deps);
    const { keys, box } = newKeys();
    expect(codeOf(() => identity.accounts.register(anon(), { pseudonym: 'Frank', device: deviceInput(keys, box), proof: bindingProof(keys, box, 'register', 'frank') }))).toBe('FEATURE.DISABLED');
  });
});

describe('F07.S01.M01 authorization', () => {
  it('denies anonymous and non-admin callers with the policy authorizer', () => {
    const w = makeWorld();
    const u = register(w, 'Grace');
    const victim = register(w, 'Heidi');
    const member = login(w, u);
    expect(codeOf(() => w.identity.accounts.me(anon()))).toBe('AUTH.REQUIRED');
    expect(codeOf(() => w.identity.accounts.setStatus(asActor(member.actor), { accountId: victim.id, status: 'suspended', reason: 'because' }))).toBe('AUTHZ.FORBIDDEN');
    expect(codeOf(() => w.identity.accounts.grantRole(asActor(member.actor), { accountId: u.id, role: 'admin' }))).toBe('AUTHZ.FORBIDDEN');
    expect(codeOf(() => w.identity.accounts.erase(asActor(member.actor), { accountId: victim.id }))).toBe('AUTHZ.FORBIDDEN');
    expect(codeOf(() => w.identity.accounts.me(asActor(testActor(u.id, ['member'], 'tnt_other'))))).toBe('IDENTITY.ACCOUNT_NOT_FOUND');
  });

  it('exposes only anonymous-safe operations as public', () => {
    const w = makeWorld();
    const publicOps = w.identity.operations.filter((o) => o.public).map((o) => o.name).sort();
    expect(publicOps).toEqual([
      'identity.account.lookup', 'identity.account.register', 'identity.evidence.list_public', 'identity.feedback.list', 'identity.portable.verify',
      'identity.profile.get', 'identity.recovery.recover', 'identity.reputation.get', 'identity.session.challenge', 'identity.session.login',
    ]);
    const publicPolicies = POLICIES.filter((p) => p.public).map((p) => p.permission);
    expect(publicPolicies).toHaveLength(publicOps.length);
    expect(MODULES.map((m) => m.id)).toHaveLength(7);
  });

  it('lets only admins grant roles, keeps member, and protects against self lockout', () => {
    const w = makeWorld();
    const boss = admin(w);
    const u = register(w, 'Ivan');
    const granted = w.identity.accounts.grantRole(asActor(boss.actor), { accountId: u.id, role: 'moderator' });
    expect(granted.roles).toEqual(['member', 'moderator']);
    const again = w.identity.accounts.grantRole(asActor(boss.actor), { accountId: u.id, role: 'moderator' });
    expect(again.version).toBe(granted.version);
    expect(w.identity.accounts.revokeRole(asActor(boss.actor), { accountId: u.id, role: 'moderator' }).roles).toEqual(['member']);
    expect(codeOf(() => w.identity.accounts.revokeRole(asActor(boss.actor), { accountId: boss.user.id, role: 'admin' }))).toBe('IDENTITY.SELF_LOCKOUT');
    expect(codeOf(() => w.identity.accounts.grantRole(asActor(boss.actor), { accountId: u.id, role: 'system' as never }))).toBe('VALIDATION.INVALID_INPUT');
  });
});

describe('F07.S01.M01 status lifecycle', () => {
  it('moves through the transition table and rejects invalid transitions', () => {
    const w = makeWorld();
    const boss = admin(w);
    const u = register(w, 'Judy');
    const suspended = w.identity.accounts.setStatus(asActor(boss.actor), { accountId: u.id, status: 'suspended', reason: 'spam reports' });
    expect(suspended.status).toBe('suspended');
    expect(w.identity.accountLookup.get(u.id)?.status).toBe('suspended');
    expect(w.identity.accounts.setStatus(asActor(boss.actor), { accountId: u.id, status: 'active', reason: 'appeal upheld' }).status).toBe('active');
    w.identity.accounts.erase(system(), { accountId: u.id });
    expect(codeOf(() => w.identity.accounts.setStatus(asActor(boss.actor), { accountId: u.id, status: 'active', reason: 'try revive' }))).toBe('IDENTITY.INVALID_TRANSITION');
  });

  it('detects stale expectedVersion', () => {
    const w = makeWorld();
    const boss = admin(w);
    const u = register(w, 'Karl');
    const stale = w.identity.accounts.setStatus(asActor(boss.actor), { accountId: u.id, status: 'suspended', reason: 'review' });
    expect(codeOf(() => w.identity.accounts.setStatus(asActor(boss.actor), { accountId: u.id, status: 'active', reason: 'review done', expectedVersion: stale.version - 1 }))).toBe('STORE.VERSION_CONFLICT');
  });

  it('lets the owner deactivate and blocks login afterwards', () => {
    const w = makeWorld();
    const u = register(w, 'Liam');
    const s = login(w, u);
    expect(w.identity.accounts.deactivate(asActor(s.actor)).status).toBe('deactivated');
    expect(w.identity.authenticate(s.token)).toBeUndefined();
    expect(codeOf(() => login(w, u))).toBe('IDENTITY.ACCOUNT_INACTIVE');
  });

  it('public lookup shows pseudonym only', () => {
    const w = makeWorld();
    const u = register(w, 'Mona');
    const found = w.identity.accounts.lookup(anon(), { pseudonym: 'MONA' });
    expect(found).toEqual({ id: u.id, pseudonym: 'Mona', active: true, createdAt: expect.any(Number) });
    expect(codeOf(() => w.identity.accounts.lookup(anon(), { pseudonym: 'nobody' }))).toBe('IDENTITY.ACCOUNT_NOT_FOUND');
    expect(codeOf(() => w.identity.accounts.lookup(anon(), {}))).toBe('VALIDATION.INVALID_INPUT');
  });
});

describe('F07.S01.M01 erasure and export', () => {
  it('pseudonymises, revokes keys and sessions, frees the pseudonym and reports what is retained', () => {
    const w = makeWorld();
    const u = register(w, 'Nina');
    const s = login(w, u);
    w.identity.profiles.update(asActor(s.actor), { displayName: 'Nina N', bio: 'hello' });
    const exported = JSON.stringify(w.identity.accounts.exportData(u.id));
    expect(exported).toContain('Nina N');
    expect(exported).not.toMatch(/tokenHash|codes|nonce/);
    const result = w.identity.accounts.erase(system('erase-0001'), { accountId: u.id });
    expect(result.erased).toBeGreaterThanOrEqual(3);
    expect(result.retained[0]).toMatch(/^content:/);
    expect(w.identity.authenticate(s.token)).toBeUndefined();
    expect(w.identity.accountLookup.get(u.id)).toMatchObject({ status: 'deleted', signingKeyIds: [] });
    expect(w.identity.accountLookup.get(u.id)?.pseudonym).toMatch(/^deleted_/);
    expect(register(w, 'Nina').id).not.toBe(u.id);
    expect(w.identity.accounts.erase(system(), { accountId: u.id }).erased).toBe(0);
  });
});
