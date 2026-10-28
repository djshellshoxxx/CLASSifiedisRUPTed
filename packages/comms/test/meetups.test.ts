import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ANONYMOUS, DomainError, HOUR, MINUTE } from '@classrup/kernel';
import type { ConfirmResult, MeetupDto, SafeSpotDto, SharedMeetupView } from '../src/index';
import { decryptPlace, encryptPlace, generateHandoffCode, handoffCodeHash } from '../src/index';
import type { Fixture, Person } from './helpers';
import { fixture, makePerson, openThread } from './helpers';

const code = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof DomainError ? e.code : String(e);
  }
  return undefined;
};

function withMod() {
  const f = fixture(['alice', 'bob', 'carol']);
  const mod = makePerson('mod', ['moderator']);
  f.accounts.set('mod', { id: 'mod', tenantId: mod.actor.tenantId, pseudonym: 'mod', status: 'active', signingKeyIds: [mod.signId], boxKeyIds: [mod.boxId], createdAt: 0 });
  return { f, mod };
}

describe('safe spots (F08.S03.M01)', () => {
  it('lets moderators curate public spots and anyone browse them', () => {
    const { f, mod } = withMod();
    const spot = f.call<SafeSpotDto>('comms.safe_spot.create', mod, { name: 'Central Library lobby', kind: 'library', regionCell: 'u33db' });
    f.call('comms.safe_spot.create', mod, { name: 'Corner Cafe', kind: 'cafe', regionCell: 'u33dc' });
    const anon = ANONYMOUS('tnt_default');
    expect(f.call<{ safeSpots: SafeSpotDto[] }>('comms.safe_spot.list', anon).safeSpots.map((s) => s.name)).toEqual(['Central Library lobby', 'Corner Cafe']);
    expect(f.call<{ safeSpots: SafeSpotDto[] }>('comms.safe_spot.list', anon, { kind: 'cafe' }).safeSpots).toHaveLength(1);
    expect(f.call<{ safeSpots: SafeSpotDto[] }>('comms.safe_spot.list', anon, { regionCell: 'u33dc' }).safeSpots).toHaveLength(1);
    expect(JSON.stringify(spot)).not.toMatch(/lat|lng|address/i);
    f.call('comms.safe_spot.retire', mod, { safeSpotId: spot.id });
    expect(f.call<{ safeSpots: SafeSpotDto[] }>('comms.safe_spot.list', anon).safeSpots).toHaveLength(1);
    expect(f.call<{ tips: unknown[] }>('comms.safety.tips', anon).tips.length).toBeGreaterThan(3);
  });

  it('denies non-moderators and rejects precise cells, bad kinds and stale versions', () => {
    const { f, mod } = withMod();
    expect(code(() => f.call('comms.safe_spot.create', f.people.alice!, { name: 'Park', kind: 'cafe', regionCell: 'u33db' }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => f.call('comms.safe_spot.create', mod, { name: 'Park', kind: 'cafe', regionCell: 'u33dbcd' }))).toBe('GEO.TOO_PRECISE');
    expect(code(() => f.call('comms.safe_spot.create', mod, { name: 'Park', kind: 'garage', regionCell: 'u33db' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.call('comms.safe_spot.create', mod, { name: 'Park', kind: 'cafe', regionCell: 'u33db', lat: 1, lng: 2 }))).toBe('VALIDATION.INVALID_INPUT');
    const spot = f.call<SafeSpotDto>('comms.safe_spot.create', mod, { name: 'Park Cafe', kind: 'cafe', regionCell: 'u33db' });
    expect(code(() => f.call('comms.safe_spot.retire', mod, { safeSpotId: spot.id, expectedVersion: 9 }))).toBe('STORE.VERSION_CONFLICT');
    expect(code(() => f.call('comms.safe_spot.retire', f.people.alice!, { safeSpotId: spot.id }))).toBe('AUTHZ.FORBIDDEN');
  });
});

interface World {
  f: Fixture;
  threadId: string;
  spotId: string;
  start: number;
}

function world(): World {
  const { f, mod } = withMod();
  const spot = f.call<SafeSpotDto>('comms.safe_spot.create', mod, { name: 'Central Library lobby', kind: 'library', regionCell: 'u33db' });
  const threadId = openThread(f, 'alice', ['bob']);
  return { f, threadId, spotId: spot.id, start: f.deps.clock.now() + 2 * HOUR };
}

const win = (w: World, offsetMin = 0) => ({ startsAt: w.start + offsetMin * MINUTE, endsAt: w.start + offsetMin * MINUTE + HOUR });

function propose(w: World, who: Person = w.f.people.alice!, extra: Record<string, unknown> = {}): MeetupDto {
  return w.f.call<MeetupDto>('comms.meetup.propose', who, {
    threadId: w.threadId, participantIds: ['alice', 'bob'], window: win(w), place: { kind: 'safe_spot', safeSpotId: w.spotId }, ...extra,
  });
}

function confirmed(w: World): MeetupDto {
  const m = propose(w);
  return w.f.call<MeetupDto>('comms.meetup.accept', w.f.people.bob!, { meetupId: m.id, revision: 1 });
}

describe('meetup coordination (F08.S03.M03)', () => {
  it('proposes, accepts and confirms with every participant consenting', () => {
    const w = world();
    const m = propose(w);
    expect(m).toMatchObject({ state: 'proposed', revision: 1, acceptedBy: ['alice'], place: { kind: 'safe_spot', safeSpot: { name: 'Central Library lobby' } } });
    const done = w.f.call<MeetupDto>('comms.meetup.accept', w.f.people.bob!, { meetupId: m.id, revision: 1 });
    expect(done.state).toBe('confirmed');
    expect(w.f.call('comms.meetup.accept', w.f.people.bob!, { meetupId: m.id, revision: 1 })).toMatchObject({ state: 'confirmed' });
    const types = w.f.deps.store.events.read().map((e) => e.event.type).filter((t) => t.startsWith('comms.meetup.'));
    expect(types).toEqual(['comms.meetup.proposed', 'comms.meetup.confirmed']);
    expect(w.f.call<{ meetups: MeetupDto[] }>('comms.meetup.list', w.f.people.bob!, { threadId: w.threadId }).meetups).toHaveLength(1);
  });

  it('seals a private place to the participants and never stores it in plaintext', () => {
    const w = world();
    const { f } = w;
    const keys = f.call<{ recipients: { boxKeyIds: string[] }[] }>('comms.thread.keys', f.people.alice!, { threadId: w.threadId }).recipients.flatMap((r) => r.boxKeyIds);
    const sealed = encryptPlace({ text: '221B Baker Street, flat 2' }, keys, w.threadId);
    const m = propose(w, f.people.alice!, { place: { kind: 'private', sealed } });
    const bobView = f.call<MeetupDto>('comms.meetup.get', f.people.bob!, { meetupId: m.id });
    if (bobView.place.kind !== 'private') throw new Error('expected private place');
    const bob = f.people.bob!;
    expect(decryptPlace(bobView.place.sealed, bob.boxId, bob.box, w.threadId)).toEqual({ text: '221B Baker Street, flat 2' });
    expect(Object.keys(bobView.place.sealed.keys)).toEqual([bob.boxId]);
    const stored = JSON.stringify((f.deps.store as unknown as { exportSnapshot(): unknown }).exportSnapshot()) + JSON.stringify(f.deps.store.events.read());
    expect(stored).not.toContain('Baker Street');
    const wrongKeys = encryptPlace({ text: 'x' }, [f.people.alice!.boxId], w.threadId);
    expect(code(() => propose(w, f.people.alice!, { place: { kind: 'private', sealed: wrongKeys } }))).toBe('COMMS.KEYS_MISMATCH');
  });

  it('validates windows, participants, safe spots and blocks', () => {
    const w = world();
    const alice = w.f.people.alice!;
    const now = w.f.deps.clock.now();
    expect(code(() => propose(w, alice, { window: { startsAt: now - 1, endsAt: now + HOUR } }))).toBe('COMMS.WINDOW_INVALID');
    expect(code(() => propose(w, alice, { window: { startsAt: w.start, endsAt: w.start } }))).toBe('COMMS.WINDOW_INVALID');
    expect(code(() => propose(w, alice, { window: { startsAt: w.start, endsAt: w.start + 13 * HOUR } }))).toBe('COMMS.WINDOW_INVALID');
    expect(code(() => propose(w, alice, { window: { startsAt: now + 31 * 24 * HOUR, endsAt: now + 31 * 24 * HOUR + HOUR } }))).toBe('COMMS.WINDOW_INVALID');
    expect(code(() => propose(w, alice, { participantIds: ['alice', 'carol'] }))).toBe('COMMS.MEETUP_PARTICIPANTS_INVALID');
    expect(code(() => propose(w, alice, { participantIds: ['bob', 'bob'] }))).toBe('COMMS.MEETUP_PARTICIPANTS_INVALID');
    expect(code(() => propose(w, alice, { place: { kind: 'safe_spot', safeSpotId: w.f.deps.ids.next('msp') } }))).toBe('COMMS.SAFE_SPOT_UNAVAILABLE');
    w.f.blocked.add('alice|bob');
    expect(code(() => propose(w))).toBe('COMMS.BLOCKED');
  });

  it('requires fresh consent for every revision: counter resets acceptance, stale accept conflicts', () => {
    const w = world();
    const { f } = w;
    const m = propose(w);
    const countered = f.call<MeetupDto>('comms.meetup.counter', f.people.bob!, { meetupId: m.id, window: win(w, 60) });
    expect(countered).toMatchObject({ revision: 2, revisedBy: 'bob', acceptedBy: ['bob'], state: 'proposed' });
    expect(code(() => f.call('comms.meetup.accept', f.people.alice!, { meetupId: m.id, revision: 1 }))).toBe('COMMS.MEETUP_REVISION_STALE');
    expect(f.call<MeetupDto>('comms.meetup.accept', f.people.alice!, { meetupId: m.id, revision: 2 }).state).toBe('confirmed');
    const re = f.call<MeetupDto>('comms.meetup.reschedule', f.people.alice!, { meetupId: m.id, window: win(w, 120) });
    expect(re).toMatchObject({ state: 'proposed', revision: 3, acceptedBy: ['alice'] });
    expect(code(() => f.call('comms.meetup.reschedule', f.people.alice!, { meetupId: m.id, window: win(w, 180) }))).toBe('COMMS_MEETUP.INVALID_TRANSITION');
    expect(code(() => f.call('comms.meetup.counter', f.people.bob!, { meetupId: m.id }))).toBe('COMMS.REVISION_EMPTY');
  });

  it('cancels, rejects invalid transitions and applies optimistic concurrency', () => {
    const w = world();
    const { f } = w;
    const m = propose(w);
    expect(code(() => f.call('comms.meetup.accept', f.people.bob!, { meetupId: m.id, revision: 1, expectedVersion: 5 }))).toBe('STORE.VERSION_CONFLICT');
    const cancelled = f.call<MeetupDto>('comms.meetup.cancel', f.people.bob!, { meetupId: m.id, reason: 'unsafe' });
    expect(cancelled).toMatchObject({ state: 'cancelled', cancelReason: 'unsafe' });
    expect(code(() => f.call('comms.meetup.accept', f.people.bob!, { meetupId: m.id, revision: 1 }))).toBe('COMMS_MEETUP.INVALID_TRANSITION');
    expect(code(() => f.call('comms.meetup.cancel', f.people.alice!, { meetupId: m.id, reason: 'other' }))).toBe('COMMS_MEETUP.INVALID_TRANSITION');
    expect(code(() => f.call('comms.meetup.cancel', f.people.alice!, { meetupId: m.id, reason: 'because I felt like it' }))).toBe('VALIDATION.INVALID_INPUT');
  });

  it('is idempotent on propose and detects key reuse', () => {
    const w = world();
    const a = w.f.call<MeetupDto>('comms.meetup.propose', w.f.people.alice!, { threadId: w.threadId, participantIds: ['alice', 'bob'], window: win(w), place: { kind: 'safe_spot', safeSpotId: w.spotId } }, 'meetup-key-001');
    const b = w.f.call<MeetupDto>('comms.meetup.propose', w.f.people.alice!, { threadId: w.threadId, participantIds: ['alice', 'bob'], window: win(w), place: { kind: 'safe_spot', safeSpotId: w.spotId } }, 'meetup-key-001');
    expect(b.id).toBe(a.id);
    expect(w.f.deps.store.collection('comms_meetups').count()).toBe(1);
    expect(code(() => w.f.call('comms.meetup.propose', w.f.people.alice!, { threadId: w.threadId, participantIds: ['alice', 'bob'], window: win(w, 5), place: { kind: 'safe_spot', safeSpotId: w.spotId } }, 'meetup-key-001'))).toBe('IDEMPOTENCY.KEY_REUSED');
  });

  it('denies outsiders and expires unconfirmed proposals once the window starts', () => {
    const w = world();
    const { f } = w;
    const m = propose(w);
    expect(code(() => f.call('comms.meetup.get', f.people.carol!, { meetupId: m.id }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => f.call('comms.meetup.propose', f.people.carol!, { threadId: w.threadId, participantIds: ['carol', 'bob'], window: win(w), place: { kind: 'safe_spot', safeSpotId: w.spotId } }))).toBe('AUTHZ.FORBIDDEN');
    expect(f.sys<{ expired: number }>('comms.meetup.expire_due').expired).toBe(0);
    f.deps.clock.set(w.start);
    expect(code(() => f.call('comms.meetup.accept', f.people.bob!, { meetupId: m.id, revision: 1 }))).toBe('COMMS.WINDOW_PASSED');
    expect(f.sys<{ expired: number }>('comms.meetup.expire_due').expired).toBe(1);
    expect(f.call<MeetupDto>('comms.meetup.get', f.people.bob!, { meetupId: m.id }).state).toBe('expired');
    expect(code(() => f.call('comms.meetup.expire_due', f.people.alice!))).toBe('AUTHZ.FORBIDDEN');
  });

  it('records no-show claims after the window starts and flags contradicting check-ins', () => {
    const w = world();
    const { f } = w;
    const m = confirmed(w);
    expect(code(() => f.call('comms.meetup.report_no_show', f.people.alice!, { meetupId: m.id, accountId: 'bob' }))).toBe('COMMS.NO_SHOW_TOO_EARLY');
    f.deps.clock.set(w.start);
    f.call('comms.handoff.check_in', f.people.bob!, { meetupId: m.id });
    expect(code(() => f.call('comms.meetup.report_no_show', f.people.alice!, { meetupId: m.id, accountId: 'alice' }))).toBe('COMMS.NO_SHOW_INVALID');
    expect(code(() => f.call('comms.meetup.report_no_show', f.people.alice!, { meetupId: m.id, accountId: 'carol' }))).toBe('COMMS.NO_SHOW_INVALID');
    const r = f.call<{ contradictedByCheckIn: boolean; state: string }>('comms.meetup.report_no_show', f.people.alice!, { meetupId: m.id, accountId: 'bob' });
    expect(r).toEqual({ meetupId: m.id, accusedId: 'bob', contradictedByCheckIn: true, state: 'no_show' });
    f.call('comms.meetup.report_no_show', f.people.alice!, { meetupId: m.id, accountId: 'bob' });
    f.call('comms.meetup.report_no_show', f.people.bob!, { meetupId: m.id, accountId: 'alice' });
    expect(f.deps.store.collection('comms_no_shows').count()).toBe(2);
    expect(f.deps.store.events.read().filter((e) => e.event.type === 'comms.meetup.no_show_reported')).toHaveLength(2);
  });
});

describe('handoff (F08.S03.M02)', () => {
  const ready = () => {
    const w = world();
    const m = confirmed(w);
    w.f.deps.clock.set(w.start);
    return { ...w, m };
  };

  it('checks in only for confirmed meetups around their window, recording a claim once', () => {
    const w = world();
    const m = confirmed(w);
    expect(code(() => w.f.call('comms.handoff.check_in', w.f.people.bob!, { meetupId: m.id }))).toBe('COMMS.CHECK_IN_WINDOW');
    w.f.deps.clock.set(w.start - 10 * MINUTE);
    const first = w.f.call<{ arrivedAt: number }>('comms.handoff.check_in', w.f.people.bob!, { meetupId: m.id });
    w.f.deps.clock.advance(MINUTE);
    expect(w.f.call<{ arrivedAt: number }>('comms.handoff.check_in', w.f.people.bob!, { meetupId: m.id }).arrivedAt).toBe(first.arrivedAt);
    expect(w.f.deps.store.events.read().filter((e) => e.event.type === 'comms.handoff.checked_in')).toHaveLength(1);
    expect(code(() => w.f.call('comms.handoff.check_in', w.f.people.carol!, { meetupId: m.id }))).toBe('AUTHZ.FORBIDDEN');
    const unconfirmed = propose(w, w.f.people.alice!, { window: win(w, 300) });
    expect(code(() => w.f.call('comms.handoff.check_in', w.f.people.alice!, { meetupId: unconfirmed.id }))).toBe('COMMS.HANDOFF_STATE');
  });

  it('completes the meetup when the giver enters the receiver code and emits bilateral evidence', () => {
    const { f, m } = ready();
    const secret = generateHandoffCode();
    expect(secret).toMatch(/^\d{6}$/);
    f.call('comms.handoff.set_code', f.people.bob!, { meetupId: m.id, codeHash: handoffCodeHash(m.id, secret) });
    expect(f.call<ConfirmResult>('comms.handoff.confirm', f.people.alice!, { meetupId: m.id, code: secret })).toMatchObject({ outcome: 'confirmed' });
    expect(f.call<MeetupDto>('comms.meetup.get', f.people.alice!, { meetupId: m.id }).state).toBe('completed');
    const evidence = f.deps.store.events.read().find((e) => e.event.type === 'comms.handoff.confirmed_by_code')!.event;
    expect(evidence.payload).toMatchObject({ meetupId: m.id, receiverId: 'bob', giverId: 'alice', evidence: 'bilateral_code' });
    const stored = JSON.stringify((f.deps.store as unknown as { exportSnapshot(): unknown }).exportSnapshot());
    expect(stored).not.toContain(secret);
    expect(JSON.stringify(f.deps.store.events.read())).not.toContain(handoffCodeHash(m.id, secret));
    expect(code(() => f.call('comms.handoff.confirm', f.people.alice!, { meetupId: m.id, code: secret }))).toBe('COMMS.HANDOFF_STATE');
  });

  it('counts wrong attempts durably, locks after five and lets the receiver reset with a new code', () => {
    const { f, m } = ready();
    f.call('comms.handoff.set_code', f.people.bob!, { meetupId: m.id, codeHash: handoffCodeHash(m.id, '123456') });
    const wrong = (c: string) => f.call<ConfirmResult>('comms.handoff.confirm', f.people.alice!, { meetupId: m.id, code: c });
    expect(wrong('000000')).toEqual({ meetupId: m.id, outcome: 'wrong_code', attemptsLeft: 4 });
    for (let i = 0; i < 3; i++) wrong('000001');
    expect(wrong('000002').outcome).toBe('locked');
    expect(wrong('123456').outcome).toBe('locked');
    expect(f.call<MeetupDto>('comms.meetup.get', f.people.alice!, { meetupId: m.id }).state).toBe('confirmed');
    f.call('comms.handoff.set_code', f.people.bob!, { meetupId: m.id, codeHash: handoffCodeHash(m.id, '654321') });
    expect(wrong('654321').outcome).toBe('confirmed');
  });

  it('expires codes, forbids the receiver from confirming and requires a code first', () => {
    const { f, m } = ready();
    expect(code(() => f.call('comms.handoff.confirm', f.people.alice!, { meetupId: m.id, code: '111111' }))).toBe('COMMS.HANDOFF_NO_CODE');
    f.call('comms.handoff.set_code', f.people.bob!, { meetupId: m.id, codeHash: handoffCodeHash(m.id, '111111'), ttlMs: 5 * MINUTE });
    expect(code(() => f.call('comms.handoff.confirm', f.people.bob!, { meetupId: m.id, code: '111111' }))).toBe('COMMS.HANDOFF_ROLE');
    expect(code(() => f.call('comms.handoff.set_code', f.people.alice!, { meetupId: m.id, codeHash: handoffCodeHash(m.id, '222222') }))).toBe('COMMS.HANDOFF_STATE');
    expect(code(() => f.call('comms.handoff.confirm', f.people.alice!, { meetupId: m.id, code: 'abcdef' }))).toBe('VALIDATION.INVALID_INPUT');
    f.deps.clock.advance(6 * MINUTE);
    expect(f.call<ConfirmResult>('comms.handoff.confirm', f.people.alice!, { meetupId: m.id, code: '111111' }).outcome).toBe('expired');
    expect(code(() => f.call('comms.handoff.confirm', f.people.carol!, { meetupId: m.id, code: '111111' }))).toBe('AUTHZ.FORBIDDEN');
  });

  it('keeps the raw code out of the idempotency store and replays the same outcome', () => {
    const { f, m } = ready();
    f.call('comms.handoff.set_code', f.people.bob!, { meetupId: m.id, codeHash: handoffCodeHash(m.id, '424242') });
    const first = f.call<ConfirmResult>('comms.handoff.confirm', f.people.alice!, { meetupId: m.id, code: '000000' }, 'confirm-key-001');
    const replay = f.call<ConfirmResult>('comms.handoff.confirm', f.people.alice!, { meetupId: m.id, code: '000000' }, 'confirm-key-001');
    expect(replay).toEqual(first);
    expect(first).toMatchObject({ attemptsLeft: 4 });
    const record = f.deps.store.idempotency.get(`tnt_default:alice:comms.handoff.confirm:confirm-key-001`, f.deps.clock.now());
    expect(record?.fingerprint).not.toContain('000000');
    expect(code(() => f.call('comms.handoff.confirm', f.people.alice!, { meetupId: m.id, code: '424242' }, 'confirm-key-001'))).toBe('IDEMPOTENCY.KEY_REUSED');
  });

  it('hashes codes per meetup and generates uniform 6-digit codes (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999_999 }), (n) => {
        const c = String(n).padStart(6, '0');
        return handoffCodeHash('mtp_A', c) !== handoffCodeHash('mtp_B', c) && /^\d{6}$/.test(generateHandoffCode());
      }),
      { numRuns: 50 },
    );
  });

  it('shares only the window and the safe-spot name with a trusted contact', () => {
    const { f, m, start } = ready();
    const shared = f.call<{ shareId: string; token: string; expiresAt: number }>('comms.safety.share', f.people.alice!, { meetupId: m.id });
    const stranger = ANONYMOUS('tnt_default');
    const view = f.call<SharedMeetupView>('comms.safety.view_share', stranger, { token: shared.token });
    expect(view).toEqual({ state: 'confirmed', window: { startsAt: start, endsAt: start + HOUR }, safeSpotName: 'Central Library lobby' });
    expect(Object.keys(view).sort()).toEqual(['safeSpotName', 'state', 'window']);
    const stored = JSON.stringify(f.deps.store.collection('comms_shares').list());
    expect(stored).not.toContain(shared.token);
    expect(f.call<{ shares: { shareId: string }[] }>('comms.safety.list_shares', f.people.alice!, { meetupId: m.id }).shares[0]!.shareId).toBe(shared.shareId);
    expect(code(() => f.call('comms.safety.revoke_share', f.people.bob!, { shareId: shared.shareId }))).toBe('AUTHZ.FORBIDDEN');
    f.call('comms.safety.revoke_share', f.people.alice!, { shareId: shared.shareId });
    expect(code(() => f.call('comms.safety.view_share', stranger, { token: shared.token }))).toBe('COMMS.SHARE_NOT_FOUND');
  });

  it('hides private places from share links, expires tokens and rejects unknown ones', () => {
    const w = world();
    const { f } = w;
    const keys = f.call<{ recipients: { boxKeyIds: string[] }[] }>('comms.thread.keys', f.people.alice!, { threadId: w.threadId }).recipients.flatMap((r) => r.boxKeyIds);
    const m = propose(w, f.people.alice!, { place: { kind: 'private', sealed: encryptPlace({ text: 'my flat' }, keys, w.threadId) } });
    const shared = f.call<{ token: string; expiresAt: number }>('comms.safety.share', f.people.alice!, { meetupId: m.id, ttlMs: 30 * MINUTE });
    const anon = ANONYMOUS('tnt_default');
    expect(f.call<SharedMeetupView>('comms.safety.view_share', anon, { token: shared.token }).safeSpotName).toBeNull();
    f.deps.clock.advance(31 * MINUTE);
    expect(code(() => f.call('comms.safety.view_share', anon, { token: shared.token }))).toBe('COMMS.SHARE_NOT_FOUND');
    expect(code(() => f.call('comms.safety.view_share', anon, { token: 'A'.repeat(43) }))).toBe('COMMS.SHARE_NOT_FOUND');
    expect(code(() => f.call('comms.safety.view_share', anon, { token: 'short' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.call('comms.safety.share', f.people.carol!, { meetupId: m.id }))).toBe('AUTHZ.FORBIDDEN');
  });
});
