import { describe, expect, it } from 'vitest';
import { DomainError, MINUTE } from '@classrup/kernel';
import { sha256B64, signEnvelope } from '@classrup/security';
import type { SignedEnvelope } from '@classrup/security';
import type { CardDto, ConsentDto, ConsentStatement } from '../src/index';
import type { Fixture, Person } from './helpers';
import { fixture, openThread } from './helpers';

const code = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof DomainError ? e.code : String(e);
  }
  return undefined;
};

const rev = (n: string): string => `sha256:${sha256B64(n)}`;

describe('negotiation cards (F08.S02.M01)', () => {
  it('posts cards that point at canonical records and supersedes older revisions', () => {
    const f = fixture(['alice', 'bob']);
    const id = openThread(f, 'alice', ['bob']);
    const ofr = f.deps.ids.next('ofr');
    const first = f.call<CardDto>('comms.card.post', f.people.alice!, { threadId: id, refType: 'offer', refId: ofr, revisionHash: rev('r1'), summary: 'Bike for 120 USD' });
    expect(first).toMatchObject({ refType: 'offer', refId: ofr, status: 'current' });
    f.call('comms.card.post', f.people.bob!, { threadId: id, refType: 'offer', refId: ofr, revisionHash: rev('r2'), summary: 'Counter 100 USD' });
    const cards = f.call<{ cards: CardDto[] }>('comms.card.list', f.people.alice!, { threadId: id }).cards;
    expect(cards.map((c) => c.status)).toEqual(['superseded', 'current']);
    expect(f.deps.store.events.read().filter((e) => e.event.type === 'comms.card.posted')).toHaveLength(2);
  });

  it('validates reference ids, duplicates and membership', () => {
    const f = fixture(['alice', 'bob', 'eve']);
    const id = openThread(f, 'alice', ['bob']);
    const base = { threadId: id, refType: 'offer', refId: f.deps.ids.next('ofr'), revisionHash: rev('r1'), summary: 'x' };
    expect(code(() => f.call('comms.card.post', f.people.alice!, { ...base, refId: f.deps.ids.next('cyc') }))).toBe('COMMS.REF_INVALID');
    expect(code(() => f.call('comms.card.post', f.people.alice!, { ...base, revisionHash: 'abc' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.call('comms.card.post', f.people.alice!, { ...base, summary: '' }))).toBe('VALIDATION.INVALID_INPUT');
    f.call('comms.card.post', f.people.alice!, base);
    expect(code(() => f.call('comms.card.post', f.people.bob!, base))).toBe('COMMS.CARD_DUPLICATE');
    expect(code(() => f.call('comms.card.post', f.people.eve!, base))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => f.call('comms.card.list', f.people.eve!, { threadId: id }))).toBe('AUTHZ.FORBIDDEN');
  });
});

function statement(who: Person, over: Partial<ConsentStatement> & { subjectId: string; revisionHash: string }, f: Fixture): ConsentStatement {
  return { accountId: who.id, subjectType: 'proposal', decision: 'accept', at: f.deps.clock.now(), ...over };
}

const sign = (who: Person, s: ConsentStatement): SignedEnvelope<ConsentStatement> => signEnvelope(who.sign, 'consent', s);

describe('consent (F08.S02.M02)', () => {
  const setup = () => {
    const f = fixture(['alice', 'bob', 'eve']);
    const threadId = openThread(f, 'alice', ['bob']);
    const subjectId = f.deps.ids.next('trd');
    const revisionHash = rev('v1');
    return { f, threadId, subjectId, revisionHash };
  };

  it('records signed accept statements and reports all-party consent per exact revision', () => {
    const { f, threadId, subjectId, revisionHash } = setup();
    const alice = f.people.alice!;
    const bob = f.people.bob!;
    f.call('comms.consent.record', alice, { envelope: sign(alice, statement(alice, { subjectId, revisionHash }, f)) });
    const status1 = f.call<{ allAccepted: boolean }>('comms.consent.status', bob, { threadId, subjectType: 'proposal', subjectId, revisionHash });
    expect(status1.allAccepted).toBe(false);
    f.call('comms.consent.record', bob, { envelope: sign(bob, statement(bob, { subjectId, revisionHash }, f)) });
    const status2 = f.call<{ allAccepted: boolean; decisions: ConsentDto[] }>('comms.consent.status', bob, { threadId, subjectType: 'proposal', subjectId, revisionHash });
    expect(status2.allAccepted).toBe(true);
    expect(f.comms.hasAllConsent('tnt_default', 'proposal', subjectId, revisionHash, ['alice', 'bob'])).toBe(true);
    expect(f.comms.hasAllConsent('tnt_default', 'proposal', subjectId, rev('v2'), ['alice', 'bob'])).toBe(false);
    expect(f.comms.hasAllConsent('tnt_default', 'proposal', subjectId, revisionHash, [])).toBe(false);
    const events = JSON.stringify(f.deps.store.events.read().filter((e) => e.event.type === 'comms.consent.recorded'));
    expect(events).not.toContain('"sig"');
    expect(events).not.toContain(alice.signId);
  });

  it('follows the accept -> revoke -> accept transition table', () => {
    const { f, subjectId, revisionHash } = setup();
    const alice = f.people.alice!;
    const rec = (decision: ConsentStatement['decision']) => f.call('comms.consent.record', alice, { envelope: sign(alice, statement(alice, { subjectId, revisionHash, decision }, f)) });
    expect(code(() => rec('revoke'))).toBe('COMMS_CONSENT.INVALID_TRANSITION');
    rec('accept');
    expect(code(() => rec('decline'))).toBe('COMMS_CONSENT.INVALID_TRANSITION');
    f.deps.clock.advance(1000);
    rec('revoke');
    expect(f.comms.hasAllConsent('tnt_default', 'proposal', subjectId, revisionHash, ['alice'])).toBe(false);
    f.deps.clock.advance(1000);
    rec('accept');
    expect(f.comms.hasAllConsent('tnt_default', 'proposal', subjectId, revisionHash, ['alice'])).toBe(true);
    expect(f.deps.store.collection('comms_consents').count()).toBe(3);
  });

  it('rejects forged, foreign, unregistered-key, tampered and stale statements', () => {
    const { f, subjectId, revisionHash } = setup();
    const alice = f.people.alice!;
    const bob = f.people.bob!;
    const eve = f.people.eve!;
    const good = sign(alice, statement(alice, { subjectId, revisionHash }, f));
    const reason = (env: unknown, who: Person = alice): string | undefined => {
      try {
        f.call('comms.consent.record', who, { envelope: env });
      } catch (e) {
        return e instanceof DomainError ? String(e.details.reason ?? e.code) : String(e);
      }
      return undefined;
    };
    expect(reason({ ...good, payload: { ...good.payload, decision: 'decline' } })).toBe('bad_signature');
    expect(reason(sign(eve, statement(alice, { subjectId, revisionHash }, f)))).toBe('key_not_registered');
    expect(reason(good, bob)).toBe('account_mismatch');
    expect(reason({ ...good, ctx: 'other' })).toBe('malformed');
    expect(reason('nonsense')).toBe('malformed');
    expect(reason(signEnvelope(alice.sign, 'federated-record', good.payload))).toBe('malformed');
    f.accounts.set('alice', { ...f.accounts.get('alice')!, status: 'suspended' });
    expect(reason(good)).toBe('unknown_account');
    f.accounts.set('alice', { ...f.accounts.get('alice')!, status: 'active' });
    f.deps.clock.advance(11 * MINUTE);
    expect(code(() => f.call('comms.consent.record', alice, { envelope: good }))).toBe('COMMS.CONSENT_STALE');
    expect(code(() => f.call('comms.consent.record', alice, { envelope: sign(alice, statement(alice, { subjectId: f.deps.ids.next('cyc'), revisionHash }, f)) }))).toBe('COMMS.REF_INVALID');
  });

  it('is idempotent for a replayed statement even under a different idempotency key', () => {
    const { f, subjectId, revisionHash } = setup();
    const alice = f.people.alice!;
    const env = sign(alice, statement(alice, { subjectId, revisionHash }, f));
    const a = f.call<ConsentDto>('comms.consent.record', alice, { envelope: env }, 'consent-key-001');
    const b = f.call<ConsentDto>('comms.consent.record', alice, { envelope: env }, 'consent-key-002');
    const c = f.call<ConsentDto>('comms.consent.record', alice, { envelope: env }, 'consent-key-001');
    expect(b.id).toBe(a.id);
    expect(c.id).toBe(a.id);
    expect(f.deps.store.collection('comms_consents').count()).toBe(1);
    const other = sign(alice, statement(alice, { subjectId, revisionHash, decision: 'revoke' }, f));
    expect(code(() => f.call('comms.consent.record', alice, { envelope: other }, 'consent-key-001'))).toBe('IDEMPOTENCY.KEY_REUSED');
  });

  it('exposes verifyConsent for other features and hides status from non-members', () => {
    const { f, threadId, subjectId, revisionHash } = setup();
    const alice = f.people.alice!;
    const env = sign(alice, statement(alice, { subjectId, revisionHash }, f));
    expect(f.comms.verifyConsent(env)).toMatchObject({ valid: true, signerKeyId: alice.signId });
    expect(f.comms.verifyConsent(env, 'bob')).toEqual({ valid: false, reason: 'account_mismatch' });
    expect(code(() => f.call('comms.consent.status', f.people.eve!, { threadId, subjectType: 'proposal', subjectId, revisionHash }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => f.call('comms.consent.record', { kind: 'anonymous', id: 'anonymous', roles: [], tenantId: 'tnt_default' }, { envelope: env }))).toBe('AUTH.REQUIRED');
  });
});
