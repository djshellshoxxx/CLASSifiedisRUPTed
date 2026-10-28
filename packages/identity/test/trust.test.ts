import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DAY, DomainError } from '@classrup/kernel';
import { keyIdOf, signEnvelope } from '@classrup/security';
import type { InteractionVerifier } from '../src/index';
import { ATTESTATION_CONTEXT, bayesianScore, PRIOR_MEAN, PRIOR_WEIGHT } from '../src/index';
import { admin, anon, asActor, eventsOfType, login, makeWorld, newKeys, register, system } from './helpers';
import type { World } from './helpers';

const codeOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof DomainError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
};

const trades = (pairs: string[]): InteractionVerifier => ({
  wasCounterparty: (rater, ratee, type, id) => pairs.includes(`${rater}|${ratee}|${type}|${id}`),
});

describe('bayesian score', () => {
  it('equals the prior with no ratings and stays within 1..5 (property)', () => {
    expect(bayesianScore(0, 0)).toBe(PRIOR_MEAN);
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 5 }), { maxLength: 200 }), (ratings) => {
        const score = bayesianScore(ratings.reduce((a, b) => a + b, 0), ratings.length);
        return score >= 1 && score <= 5;
      }),
    );
  });

  it('is monotone in the number of identical five-star ratings and converges to the mean (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 500 }), (n) => bayesianScore(5 * (n + 1), n + 1) >= bayesianScore(5 * n, n)),
    );
    expect(bayesianScore(5, 1)).toBeLessThan(4);
    expect(Math.abs(bayesianScore(4 * 10_000, 10_000) - 4)).toBeLessThan(0.01);
    expect(PRIOR_WEIGHT).toBe(5);
  });
});

describe('F07.S03.M01 reputation', () => {
  const setup = (extraBlocked: [string, string][] = []) => {
    const approved: string[] = [];
    const blocked = extraBlocked;
    const w = makeWorld({
      interactions: { wasCounterparty: (...args) => trades(approved).wasCounterparty(...args) },
      blocks: { isBlocked: (a, b) => blocked.some(([x, y]) => (x === a && y === b) || (x === b && y === a)) },
    });
    const seller = register(w, 'Seller');
    const buyer = register(w, 'Buyer');
    return { w, approved, blocked, seller, buyer, buyerSession: login(w, buyer), sellerSession: login(w, seller) };
  };

  it('accepts feedback only from real counterparties, once per subject, never self, never when blocked', () => {
    const { w, approved, blocked, seller, buyer, buyerSession, sellerSession } = setup();
    const input = { rateeId: seller.id, subjectType: 'trade', subjectId: 'trd_1', rating: 5, comment: 'Smooth handoff' };
    expect(codeOf(() => w.identity.reputation.submit(asActor(buyerSession.actor), input))).toBe('IDENTITY.NOT_COUNTERPARTY');
    approved.push(`${buyer.id}|${seller.id}|trade|trd_1`, `${seller.id}|${seller.id}|trade|trd_1`);
    expect(codeOf(() => w.identity.reputation.submit(asActor(sellerSession.actor), { ...input, rateeId: seller.id }))).toBe('IDENTITY.SELF_RATING');
    blocked.push([buyer.id, seller.id]);
    expect(codeOf(() => w.identity.reputation.submit(asActor(buyerSession.actor), input))).toBe('IDENTITY.BLOCKED');
    blocked.length = 0;
    const fb = w.identity.reputation.submit(asActor(buyerSession.actor), input);
    expect(fb).toMatchObject({ rating: 5, raterPseudonym: 'Buyer', comment: 'Smooth handoff', edited: false });
    expect(codeOf(() => w.identity.reputation.submit(asActor(buyerSession.actor), { ...input, rating: 1 }))).toBe('IDENTITY.FEEDBACK_EXISTS');
    expect(w.identity.reputation.get(anon(), { accountId: seller.id })).toMatchObject({ count: 1, average: 5, score: bayesianScore(5, 1), histogram: [0, 0, 0, 0, 1] });
    expect(eventsOfType(w, 'identity.feedback.submitted')[0]?.payload).not.toHaveProperty('comment');
  });

  it('defaults to denying every rating when no verifier is wired', () => {
    const w = makeWorld();
    const seller = register(w, 'Seller');
    const buyer = register(w, 'Buyer');
    const s = login(w, buyer);
    expect(codeOf(() => w.identity.reputation.submit(asActor(s.actor), { rateeId: seller.id, subjectType: 'trade', subjectId: 't1', rating: 3 }))).toBe('IDENTITY.NOT_COUNTERPARTY');
  });

  it('validates input and requires authentication', () => {
    const { w, approved, seller, buyer, buyerSession } = setup();
    approved.push(`${buyer.id}|${seller.id}|trade|t1`);
    const base = { rateeId: seller.id, subjectType: 'trade', subjectId: 't1' };
    expect(codeOf(() => w.identity.reputation.submit(asActor(buyerSession.actor), { ...base, rating: 6 }))).toBe('VALIDATION.INVALID_INPUT');
    expect(codeOf(() => w.identity.reputation.submit(asActor(buyerSession.actor), { ...base, rating: 0 }))).toBe('VALIDATION.INVALID_INPUT');
    expect(codeOf(() => w.identity.reputation.submit(asActor(buyerSession.actor), { ...base, rating: 3.5 }))).toBe('VALIDATION.INVALID_INPUT');
    expect(codeOf(() => w.identity.reputation.submit(asActor(buyerSession.actor), { ...base, rating: 3, comment: 'x'.repeat(281) }))).toBe('VALIDATION.INVALID_INPUT');
    expect(codeOf(() => w.identity.reputation.submit(anon(), { ...base, rating: 3 }))).toBe('AUTH.REQUIRED');
    expect(codeOf(() => w.identity.reputation.get(anon(), { accountId: 'acct_00000000000000000000000000' }))).toBe('IDENTITY.ACCOUNT_NOT_FOUND');
  });

  it('edits within 14 days only, by the rater only, updating the aggregate', () => {
    const { w, approved, seller, buyer, buyerSession, sellerSession } = setup();
    approved.push(`${buyer.id}|${seller.id}|trade|t1`);
    const fb = w.identity.reputation.submit(asActor(buyerSession.actor), { rateeId: seller.id, subjectType: 'trade', subjectId: 't1', rating: 2 });
    expect(codeOf(() => w.identity.reputation.edit(asActor(sellerSession.actor), { feedbackId: fb.id, rating: 5 }))).toBe('AUTHZ.FORBIDDEN');
    w.deps.clock.advance(13 * DAY);
    const edited = w.identity.reputation.edit(asActor(buyerSession.actor), { feedbackId: fb.id, rating: 4, comment: 'Updated after follow-up', expectedVersion: 1 });
    expect(edited).toMatchObject({ rating: 4, edited: true, version: 2 });
    expect(w.identity.reputation.get(anon(), { accountId: seller.id })).toMatchObject({ count: 1, histogram: [0, 0, 0, 1, 0] });
    expect(codeOf(() => w.identity.reputation.edit(asActor(buyerSession.actor), { feedbackId: fb.id, rating: 5, expectedVersion: 1 }))).toBe('STORE.VERSION_CONFLICT');
    expect(w.identity.reputation.edit(asActor(buyerSession.actor), { feedbackId: fb.id, comment: null }).comment).toBeUndefined();
    w.deps.clock.advance(2 * DAY);
    expect(codeOf(() => w.identity.reputation.edit(asActor(buyerSession.actor), { feedbackId: fb.id, rating: 1 }))).toBe('IDENTITY.FEEDBACK_LOCKED');
    expect(codeOf(() => w.identity.reputation.edit(asActor(buyerSession.actor), { feedbackId: fb.id }))).toBe('VALIDATION.INVALID_INPUT');
  });

  it('lets moderators remove feedback and lists only active public items newest first', () => {
    const { w, approved, seller, buyer, buyerSession } = setup();
    const other = register(w, 'Other');
    approved.push(`${buyer.id}|${seller.id}|trade|t1`, `${other.id}|${seller.id}|trade|t2`);
    const first = w.identity.reputation.submit(asActor(buyerSession.actor), { rateeId: seller.id, subjectType: 'trade', subjectId: 't1', rating: 1 });
    w.deps.clock.advance(1000);
    w.identity.reputation.submit(asActor(login(w, other).actor), { rateeId: seller.id, subjectType: 'trade', subjectId: 't2', rating: 5 });
    expect(w.identity.reputation.list(anon(), { accountId: seller.id }).map((f) => f.rating)).toEqual([5, 1]);
    expect(codeOf(() => w.identity.reputation.remove(asActor(buyerSession.actor), { feedbackId: first.id, reason: 'mine' }))).toBe('AUTHZ.FORBIDDEN');
    const boss = admin(w);
    expect(w.identity.reputation.remove(asActor(boss.actor), { feedbackId: first.id, reason: 'abusive comment' })).toEqual({ removed: true });
    expect(w.identity.reputation.list(anon(), { accountId: seller.id })).toHaveLength(1);
    expect(w.identity.reputation.get(anon(), { accountId: seller.id })).toMatchObject({ count: 1, histogram: [0, 0, 0, 0, 1] });
    expect(codeOf(() => w.identity.reputation.edit(asActor(buyerSession.actor), { feedbackId: first.id, rating: 3 }))).toBe('IDENTITY.FEEDBACK_NOT_FOUND');
  });

  it('keeps the aggregate equal to a recomputation after any sequence of submit, edit and remove (property)', () => {
    const operation = fc.oneof(
      fc.record({ kind: fc.constant('submit' as const), rater: fc.integer({ min: 0, max: 2 }), subject: fc.integer({ min: 0, max: 2 }), rating: fc.integer({ min: 1, max: 5 }) }),
      fc.record({ kind: fc.constant('edit' as const), pick: fc.nat(10), rating: fc.integer({ min: 1, max: 5 }) }),
      fc.record({ kind: fc.constant('remove' as const), pick: fc.nat(10) }),
    );
    fc.assert(
      fc.property(fc.array(operation, { maxLength: 14 }), (ops) => {
        const w = makeWorld({ interactions: { wasCounterparty: () => true } });
        const ratee = register(w, 'Ratee');
        const raters = ['Rater_a', 'Rater_b', 'Rater_c'].map((n) => register(w, n));
        const sessions = raters.map((r) => login(w, r));
        const boss = admin(w);
        const created: { id: string; rater: number }[] = [];
        for (const op of ops) {
          if (op.kind === 'submit') {
            const r = sessions[op.rater];
            if (!r) continue;
            const result = trySubmit(w, r.actor, ratee.id, `s${op.subject}`, op.rating);
            if (result) created.push({ id: result, rater: op.rater });
          } else if (created.length > 0) {
            const target = created[op.pick % created.length];
            if (!target) continue;
            const session = sessions[target.rater];
            if (!session) continue;
            try {
              if (op.kind === 'edit') w.identity.reputation.edit(asActor(session.actor), { feedbackId: target.id, rating: op.rating });
              else w.identity.reputation.remove(asActor(boss.actor), { feedbackId: target.id, reason: 'property test' });
            } catch (e) {
              if (!(e instanceof DomainError)) throw e;
            }
          }
        }
        const active = w.identity.reputation.list(anon(), { accountId: ratee.id, limit: 50 });
        const rep = w.identity.reputation.get(anon(), { accountId: ratee.id });
        const sum = active.reduce((acc, f) => acc + f.rating, 0);
        return rep.count === active.length && rep.score === bayesianScore(sum, active.length) && rep.histogram.reduce((a, b) => a + b, 0) === active.length;
      }),
      { numRuns: 25 },
    );
  });
});

function trySubmit(w: World, actor: Parameters<typeof asActor>[0], rateeId: string, subjectId: string, rating: number): string | undefined {
  try {
    return w.identity.reputation.submit(asActor(actor), { rateeId, subjectType: 'trade', subjectId, rating }).id;
  } catch (e) {
    if (e instanceof DomainError && e.code === 'IDENTITY.FEEDBACK_EXISTS') return undefined;
    throw e;
  }
}

describe('F07.S03.M02 evidence', () => {
  function attestation(w: World, attester: ReturnType<typeof newKeys>, accountId: string, kind: string, extra: { expiresAt?: number; issuedAt?: number } = {}) {
    return signEnvelope(attester.keys, ATTESTATION_CONTEXT, { accountId, kind, issuedAt: extra.issuedAt ?? w.deps.clock.now(), ...(extra.expiresAt ? { expiresAt: extra.expiresAt } : {}) });
  }

  it('records self-attested claims as unverified and exposes only kind and flag publicly', () => {
    const w = makeWorld();
    const u = register(w, 'Ann');
    const s = login(w, u);
    const claim = w.identity.evidence.claim(asActor(s.actor), { kind: 'local_resident', note: 'lives near the market, ID 12345' });
    expect(claim).toMatchObject({ level: 'self_attested', status: 'active', verified: false });
    expect(w.identity.evidence.listPublic(anon(), { accountId: u.id })).toEqual([{ kind: 'local_resident', verified: false, issuedAt: claim.issuedAt }]);
    expect(JSON.stringify(w.identity.evidence.listPublic(anon(), { accountId: u.id }))).not.toContain('12345');
    expect(w.identity.evidence.listMine(asActor(s.actor))[0]?.note).toContain('12345');
    expect(codeOf(() => w.identity.evidence.claim(asActor(s.actor), { kind: 'local_resident' }))).toBe('IDENTITY.EVIDENCE_EXISTS');
    expect(codeOf(() => w.identity.evidence.claim(asActor(s.actor), { kind: 'Bad Kind' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(codeOf(() => w.identity.evidence.claim(asActor(s.actor), { kind: 'trader', expiresAt: 1 }))).toBe('IDENTITY.EVIDENCE_EXPIRY_PAST');
    expect(JSON.stringify(w.deps.store.events.read())).not.toContain('12345');
  });

  it('verifies attestations signed by trusted attesters only, bound to kind, subject and freshness', () => {
    const w = makeWorld();
    const boss = admin(w);
    const attester = newKeys();
    const u = register(w, 'Ben');
    const s = login(w, u);
    const attesterId = keyIdOf(attester.keys.publicKey);
    const att = attestation(w, attester, u.id, 'id_verified');
    expect(codeOf(() => w.identity.evidence.attest(asActor(s.actor), { attestation: att }))).toBe('IDENTITY.ATTESTER_UNTRUSTED');
    expect(codeOf(() => w.identity.evidence.registerAttester(asActor(s.actor), { keyId: attesterId, label: 'Notary', kinds: ['id_verified'] }))).toBe('AUTHZ.FORBIDDEN');
    w.identity.evidence.registerAttester(asActor(boss.actor), { keyId: attesterId, label: 'Notary', kinds: ['id_verified'] });
    expect(codeOf(() => w.identity.evidence.registerAttester(asActor(boss.actor), { keyId: attesterId, label: 'Notary', kinds: ['id_verified'] }))).toBe('IDENTITY.ATTESTER_EXISTS');
    expect(codeOf(() => w.identity.evidence.registerAttester(asActor(boss.actor), { keyId: 'nonsense', label: 'Bad', kinds: ['id_verified'] }))).toBe('SIGNATURE.KEY_ID_INVALID');

    const wrongKind = attestation(w, attester, u.id, 'business_licence');
    expect(codeOf(() => w.identity.evidence.attest(asActor(s.actor), { attestation: wrongKind }))).toBe('IDENTITY.ATTESTER_UNTRUSTED');
    const other = register(w, 'Other');
    expect(codeOf(() => w.identity.evidence.attest(asActor(s.actor), { attestation: attestation(w, attester, other.id, 'id_verified') }))).toBe('IDENTITY.ATTESTATION_SUBJECT');
    expect(codeOf(() => w.identity.evidence.attest(asActor(s.actor), { attestation: { ...att, sig: 'AAAA' } }))).toBe('IDENTITY.ATTESTATION_INVALID');
    expect(codeOf(() => w.identity.evidence.attest(asActor(s.actor), { attestation: attestation(w, attester, u.id, 'id_verified', { expiresAt: 5 }) }))).toBe('IDENTITY.ATTESTATION_EXPIRED');

    const ev = w.identity.evidence.attest(asActor(s.actor), { attestation: att });
    expect(ev).toMatchObject({ level: 'verified', verified: true, status: 'active' });
    expect(w.identity.evidence.listPublic(anon(), { accountId: u.id })).toEqual([{ kind: 'id_verified', verified: true, issuedAt: ev.issuedAt }]);
    expect(codeOf(() => w.identity.evidence.attest(asActor(s.actor), { attestation: att }))).toBe('IDENTITY.ATTESTATION_DUPLICATE');
    expect(eventsOfType(w, 'identity.evidence.attested')[0]?.payload).toMatchObject({ kind: 'id_verified', attesterKeyId: attesterId });
  });

  it('turns verified evidence unverified when the attester is revoked and revokes evidence on request', () => {
    const w = makeWorld();
    const boss = admin(w);
    const attester = newKeys();
    const attesterId = keyIdOf(attester.keys.publicKey);
    w.identity.evidence.registerAttester(asActor(boss.actor), { keyId: attesterId, label: 'Notary', kinds: ['id_verified'] });
    const u = register(w, 'Cy_user');
    const s = login(w, u);
    const ev = w.identity.evidence.attest(asActor(s.actor), { attestation: attestation(w, attester, u.id, 'id_verified') });
    w.identity.evidence.revokeAttester(asActor(boss.actor), { keyId: attesterId });
    expect(w.identity.evidence.listPublic(anon(), { accountId: u.id })[0]?.verified).toBe(false);
    expect(w.identity.evidence.listAttesters(asActor(boss.actor))[0]?.status).toBe('revoked');
    w.identity.evidence.registerAttester(asActor(boss.actor), { keyId: attesterId, label: 'Notary again', kinds: ['id_verified'] });
    expect(w.identity.evidence.listPublic(anon(), { accountId: u.id })[0]?.verified).toBe(true);

    const stranger = register(w, 'Stranger');
    expect(codeOf(() => w.identity.evidence.revoke(asActor(login(w, stranger).actor), { evidenceId: ev.id, reason: 'not mine' }))).toBe('AUTHZ.FORBIDDEN');
    const revoked = w.identity.evidence.revoke(asActor(boss.actor), { evidenceId: ev.id, reason: 'attester recalled' });
    expect(revoked).toMatchObject({ status: 'revoked', verified: false });
    expect(w.identity.evidence.revoke(asActor(boss.actor), { evidenceId: ev.id, reason: 'again' }).version).toBe(revoked.version);
    expect(w.identity.evidence.listPublic(anon(), { accountId: u.id })).toEqual([]);
  });

  it('expires evidence by time, in views immediately and through the system sweeper', () => {
    const w = makeWorld();
    const u = register(w, 'Dee_user');
    const s = login(w, u);
    const soon = w.deps.clock.now() + 2 * DAY;
    w.identity.evidence.claim(asActor(s.actor), { kind: 'trader', expiresAt: soon });
    w.identity.evidence.claim(asActor(s.actor), { kind: 'local_resident' });
    expect(w.identity.evidence.listPublic(anon(), { accountId: u.id })).toHaveLength(2);
    w.deps.clock.advance(3 * DAY);
    expect(w.identity.evidence.listPublic(anon(), { accountId: u.id }).map((e) => e.kind)).toEqual(['local_resident']);
    expect(codeOf(() => w.identity.evidence.expireDue(asActor(s.actor)))).toBe('AUTHZ.FORBIDDEN');
    expect(w.identity.evidence.expireDue(system())).toEqual({ expired: 1 });
    expect(w.identity.evidence.expireDue(system())).toEqual({ expired: 0 });
    expect(w.identity.evidence.listMine(asActor(s.actor)).find((e) => e.kind === 'trader')?.status).toBe('expired');
  });
});
