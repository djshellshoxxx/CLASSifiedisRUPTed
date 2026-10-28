import { describe, expect, it } from 'vitest';
import { DAY, DomainError, HOUR, MINUTE } from '@classrup/kernel';
import { keyIdOf, signEnvelope } from '@classrup/security';
import { anon, admin, asActor, eventsOfType, login, makeWorld, newKeys, register, system } from './helpers';

const codeOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof DomainError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
};

function challengeFor(w: ReturnType<typeof makeWorld>, u: ReturnType<typeof register>) {
  const challenge = w.identity.sessions.issueChallenge(anon(), { pseudonym: u.pseudonym, signingKeyId: keyIdOf(u.keys.publicKey) });
  const proof = signEnvelope(u.keys, 'auth-challenge', { challengeId: challenge.challengeId, nonce: challenge.nonce, accountId: u.id });
  return { challenge, proof };
}

describe('F07.S01.M02 sessions', () => {
  it('logs in with a signed challenge and authenticates the bearer token', () => {
    const w = makeWorld();
    const u = register(w, 'Alice');
    const { challenge, proof } = challengeFor(w, u);
    expect(challenge.expiresAt - w.deps.clock.now()).toBe(5 * MINUTE);
    const session = w.identity.sessions.login(anon(), { proof });
    expect(session.expiresAt - w.deps.clock.now()).toBe(30 * DAY);
    expect(session.idleExpiresAt - w.deps.clock.now()).toBe(7 * DAY);
    expect(w.identity.authenticate(session.token)).toEqual({ kind: 'user', id: u.id, roles: ['member'], tenantId: 'tnt_default', sessionId: session.sessionId });
  });

  it('stores only a token hash and never emits the token', () => {
    const w = makeWorld();
    const u = register(w, 'Bob');
    const s = login(w, u);
    const stored = JSON.stringify(w.deps.store.collection('identity_sessions').list());
    expect(stored).not.toContain(s.token.split('.')[1]);
    expect(stored).toContain('tokenHash');
    expect(JSON.stringify(w.deps.store.events.read())).not.toContain(s.token.split('.')[1]);
    expect(JSON.stringify(w.identity.sessions.list(asActor(s.actor)))).not.toMatch(/tokenHash|token"/);
  });

  it('challenges are single use, expire after five minutes and are bound to key, account and nonce', () => {
    const w = makeWorld();
    const u = register(w, 'Carol');
    const first = challengeFor(w, u);
    w.identity.sessions.login(anon(), { proof: first.proof });
    expect(codeOf(() => w.identity.sessions.login(anon(), { proof: first.proof }))).toBe('IDENTITY.CHALLENGE_USED');

    const stale = challengeFor(w, u);
    w.deps.clock.advance(5 * MINUTE);
    expect(codeOf(() => w.identity.sessions.login(anon(), { proof: stale.proof }))).toBe('IDENTITY.CHALLENGE_EXPIRED');

    const fresh = challengeFor(w, u);
    const attacker = newKeys();
    const forged = signEnvelope(attacker.keys, 'auth-challenge', { challengeId: fresh.challenge.challengeId, nonce: fresh.challenge.nonce, accountId: u.id });
    expect(codeOf(() => w.identity.sessions.login(anon(), { proof: forged }))).toBe('IDENTITY.LOGIN_FAILED');
    const wrongNonce = signEnvelope(u.keys, 'auth-challenge', { challengeId: fresh.challenge.challengeId, nonce: 'x', accountId: u.id });
    expect(codeOf(() => w.identity.sessions.login(anon(), { proof: wrongNonce }))).toBe('IDENTITY.LOGIN_FAILED');
    const wrongContext = signEnvelope(u.keys, 'other-context', { challengeId: fresh.challenge.challengeId, nonce: fresh.challenge.nonce, accountId: u.id });
    expect(codeOf(() => w.identity.sessions.login(anon(), { proof: wrongContext }))).toBe('IDENTITY.LOGIN_FAILED');
    expect(codeOf(() => w.identity.sessions.login(anon(), { proof: fresh.proof }))).not.toBe('IDENTITY.LOGIN_FAILED');
  });

  it('refuses challenges for unknown keys, unknown accounts and inactive accounts', () => {
    const w = makeWorld();
    const u = register(w, 'Dan');
    const other = newKeys();
    expect(codeOf(() => w.identity.sessions.issueChallenge(anon(), { accountId: u.id, signingKeyId: keyIdOf(other.keys.publicKey) }))).toBe('IDENTITY.LOGIN_FAILED');
    expect(codeOf(() => w.identity.sessions.issueChallenge(anon(), { pseudonym: 'ghost', signingKeyId: keyIdOf(u.keys.publicKey) }))).toBe('IDENTITY.ACCOUNT_NOT_FOUND');
    const boss = admin(w);
    w.identity.accounts.setStatus(asActor(boss.actor), { accountId: u.id, status: 'suspended', reason: 'under review' });
    expect(codeOf(() => login(w, u))).toBe('IDENTITY.ACCOUNT_INACTIVE');
  });

  it('suspension revokes live sessions and authenticate refuses them', () => {
    const w = makeWorld();
    const u = register(w, 'Eve');
    const s = login(w, u);
    const boss = admin(w);
    w.identity.accounts.setStatus(asActor(boss.actor), { accountId: u.id, status: 'suspended', reason: 'fraud flags' });
    expect(w.identity.authenticate(s.token)).toBeUndefined();
    expect(eventsOfType(w, 'identity.session.revoked').some((e) => (e.payload as { reason: string }).reason === 'account_status')).toBe(true);
  });

  it('idle expiry slides on use but absolute expiry does not', () => {
    const w = makeWorld();
    const u = register(w, 'Frank');
    const s = login(w, u);
    for (let day = 0; day < 4; day++) {
      w.deps.clock.advance(6 * DAY);
      expect(w.identity.authenticate(s.token)).toBeDefined();
    }
    w.deps.clock.advance(7 * DAY);
    expect(w.identity.authenticate(s.token)).toBeUndefined();

    const s2 = login(w, u);
    for (let i = 0; i < 4; i++) {
      w.deps.clock.advance(6 * DAY);
      expect(w.identity.authenticate(s2.token)).toBeDefined();
    }
    w.deps.clock.advance(6 * DAY);
    expect(w.identity.authenticate(s2.token)).toBeUndefined();
  });

  it('rejects malformed, foreign and tampered tokens', () => {
    const w = makeWorld();
    const u = register(w, 'Gina');
    const s = login(w, u);
    expect(w.identity.authenticate('')).toBeUndefined();
    expect(w.identity.authenticate('garbage')).toBeUndefined();
    expect(w.identity.authenticate(`${s.sessionId}.AAAA`)).toBeUndefined();
    expect(w.identity.authenticate(`${s.token}x`)).toBeUndefined();
  });

  it('lists, revokes one and revokes all other sessions, owner only', () => {
    const w = makeWorld();
    const u = register(w, 'Hank');
    const other = register(w, 'Ivy');
    const a = login(w, u);
    const b = login(w, u);
    const c = login(w, u);
    const list = w.identity.sessions.list(asActor(a.actor));
    expect(list).toHaveLength(3);
    expect(list.filter((s) => s.current)).toHaveLength(1);
    expect(codeOf(() => w.identity.sessions.revoke(asActor(login(w, other).actor), { sessionId: b.sessionId }))).toBe('AUTHZ.FORBIDDEN');
    expect(w.identity.sessions.revoke(asActor(a.actor), { sessionId: b.sessionId }).status).toBe('revoked');
    expect(w.identity.sessions.revoke(asActor(a.actor), { sessionId: b.sessionId }).status).toBe('revoked');
    expect(w.identity.authenticate(b.token)).toBeUndefined();
    expect(w.identity.sessions.revokeAll(asActor(a.actor))).toEqual({ revoked: 1 });
    expect(w.identity.authenticate(a.token)).toBeDefined();
    expect(w.identity.authenticate(c.token)).toBeUndefined();
    expect(w.identity.sessions.revoke(asActor(a.actor), { sessionId: a.sessionId }).status).toBe('revoked');
    expect(w.identity.authenticate(a.token)).toBeUndefined();
    expect(codeOf(() => w.identity.sessions.list(anon()))).toBe('AUTH.REQUIRED');
  });

  it('caps live sessions per account by revoking the oldest', () => {
    const w = makeWorld();
    const u = register(w, 'Jack');
    const first = login(w, u);
    for (let i = 0; i < 20; i++) {
      w.deps.clock.advance(1000);
      login(w, u);
    }
    expect(w.identity.authenticate(first.token)).toBeUndefined();
    expect(w.identity.sessions.list(asActor(login(w, u).actor)).filter((s) => s.status === 'active')).toHaveLength(20);
  });

  it('expire_due closes lapsed sessions, purges old records and is system-only', () => {
    const w = makeWorld();
    const u = register(w, 'Kim');
    const s = login(w, u);
    expect(codeOf(() => w.identity.sessions.expireDue(asActor(s.actor)))).toBe('AUTHZ.FORBIDDEN');
    w.deps.clock.advance(8 * DAY);
    expect(w.identity.sessions.expireDue(system())).toEqual({ expiredSessions: 1, purgedSessions: 0, purgedChallenges: 1 });
    expect(eventsOfType(w, 'identity.session.expired')).toHaveLength(1);
    w.deps.clock.advance(31 * DAY + HOUR);
    expect(w.identity.sessions.expireDue(system())).toEqual({ expiredSessions: 0, purgedSessions: 1, purgedChallenges: 0 });
  });

  it('replays login idempotently and rejects key reuse with another proof', () => {
    const w = makeWorld();
    const u = register(w, 'Leo');
    const a = challengeFor(w, u);
    const first = w.identity.sessions.login(anon('login-key-01'), { proof: a.proof });
    expect(w.identity.sessions.login(anon('login-key-01'), { proof: a.proof })).toEqual(first);
    expect(w.deps.store.collection('identity_sessions').count()).toBe(1);
    const b = challengeFor(w, u);
    expect(codeOf(() => w.identity.sessions.login(anon('login-key-01'), { proof: b.proof }))).toBe('IDEMPOTENCY.KEY_REUSED');
  });
});
