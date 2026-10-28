import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DomainError } from '@classrup/kernel';
import type { ThreadDto } from '../src/index';
import { fixture, openThread } from './helpers';

const code = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof DomainError ? e.code : String(e);
  }
  return undefined;
};

describe('threads (F08.S01.M02)', () => {
  it('creates a thread with the creator active and invitees invited', () => {
    const f = fixture(['alice', 'bob']);
    const lst = f.deps.ids.next('lst');
    const t = f.call<ThreadDto>('comms.thread.create', f.people.alice!, { invitees: ['bob'], subject: { type: 'listing', id: lst } });
    expect(t.subject).toEqual({ type: 'listing', id: lst });
    expect(t.participants.map((p) => [p.accountId, p.status])).toEqual([['alice', 'active'], ['bob', 'invited']]);
    expect(f.notifier.sent.map((n) => [n.recipientId, n.template])).toEqual([['bob', 'comms.thread.invited']]);
    const types = f.deps.store.events.read().map((e) => e.event.type);
    expect(types).toEqual(['comms.thread.created', 'comms.participant.joined', 'comms.participant.invited']);
  });

  it('rejects invalid input: duplicates, self-invite, bad subject prefix, too many invitees', () => {
    const f = fixture(['alice', 'bob']);
    const a = f.people.alice!;
    expect(code(() => f.call('comms.thread.create', a, { invitees: ['bob', 'bob'] }))).toBe('COMMS.INVITEES_INVALID');
    expect(code(() => f.call('comms.thread.create', a, { invitees: ['alice'] }))).toBe('COMMS.INVITEES_INVALID');
    expect(code(() => f.call('comms.thread.create', a, { invitees: [] }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.call('comms.thread.create', a, { invitees: Array.from({ length: 20 }, (_, i) => `u${i}`) }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.call('comms.thread.create', a, { invitees: ['bob'], subject: { type: 'trade', id: f.deps.ids.next('lst') } }))).toBe('COMMS.REF_INVALID');
    expect(code(() => f.call('comms.thread.create', a, { invitees: ['ghost'] }))).toBe('COMMS.ACCOUNT_UNAVAILABLE');
    expect(code(() => f.call('comms.thread.create', a, { invitees: ['bob'], extra: 1 }))).toBe('VALIDATION.INVALID_INPUT');
  });

  it('rejects blocked pairs on create, invite and accept', () => {
    const f = fixture(['alice', 'bob', 'carol']);
    f.blocked.add('bob|alice');
    expect(code(() => f.call('comms.thread.create', f.people.alice!, { invitees: ['bob'] }))).toBe('COMMS.BLOCKED');
    const id = openThread(f, 'alice', ['carol']);
    expect(code(() => f.call('comms.thread.invite', f.people.alice!, { threadId: id, accountId: 'bob' }))).toBe('COMMS.BLOCKED');
    f.blocked.clear();
    f.call('comms.thread.invite', f.people.alice!, { threadId: id, accountId: 'bob' });
    f.blocked.add('carol|bob');
    expect(code(() => f.call('comms.thread.respond', f.people.bob!, { threadId: id, accept: true }))).toBe('COMMS.BLOCKED');
  });

  it('invitation requires acceptance; invitee cannot read keys until active', () => {
    const f = fixture(['alice', 'bob']);
    const t = f.call<ThreadDto>('comms.thread.create', f.people.alice!, { invitees: ['bob'] });
    expect(code(() => f.call('comms.thread.keys', f.people.bob!, { threadId: t.id }))).toBe('AUTHZ.FORBIDDEN');
    f.call('comms.thread.respond', f.people.bob!, { threadId: t.id, accept: true });
    const keys = f.call<{ recipients: { accountId: string }[] }>('comms.thread.keys', f.people.bob!, { threadId: t.id });
    expect(keys.recipients.map((r) => r.accountId).sort()).toEqual(['alice', 'bob']);
  });

  it('declined and left participants can be re-invited; invalid repeats are rejected', () => {
    const f = fixture(['alice', 'bob']);
    const t = f.call<ThreadDto>('comms.thread.create', f.people.alice!, { invitees: ['bob'] });
    f.call('comms.thread.respond', f.people.bob!, { threadId: t.id, accept: false });
    expect(code(() => f.call('comms.thread.respond', f.people.bob!, { threadId: t.id, accept: true }))).toBe('AUTHZ.FORBIDDEN');
    f.call('comms.thread.invite', f.people.alice!, { threadId: t.id, accountId: 'bob' });
    expect(code(() => f.call('comms.thread.invite', f.people.alice!, { threadId: t.id, accountId: 'bob' }))).toBe('COMMS.ALREADY_PARTICIPANT');
    f.call('comms.thread.respond', f.people.bob!, { threadId: t.id, accept: true });
    f.call('comms.thread.leave', f.people.bob!, { threadId: t.id });
    expect(code(() => f.call('comms.thread.leave', f.people.bob!, { threadId: t.id }))).toBe('AUTHZ.FORBIDDEN');
    f.call('comms.thread.invite', f.people.alice!, { threadId: t.id, accountId: 'bob' });
  });

  it('archive and mute are per participant and never reveal each other', () => {
    const f = fixture(['alice', 'bob']);
    const id = openThread(f, 'alice', ['bob']);
    f.call('comms.thread.archive', f.people.bob!, { threadId: id, archived: true });
    f.call('comms.thread.mute', f.people.bob!, { threadId: id, muted: true });
    const asAlice = f.call<ThreadDto>('comms.thread.get', f.people.alice!, { threadId: id });
    expect(asAlice.participants.find((p) => p.accountId === 'bob')).toEqual({ accountId: 'bob', status: 'active', readReceipts: false });
    expect(asAlice.participants.find((p) => p.accountId === 'alice')).toMatchObject({ archived: false, muted: false });
    expect(f.call<{ threads: ThreadDto[] }>('comms.thread.list', f.people.alice!).threads).toHaveLength(1);
    expect(f.call<{ threads: ThreadDto[] }>('comms.thread.list', f.people.bob!).threads).toHaveLength(0);
    expect(f.call<{ threads: ThreadDto[] }>('comms.thread.list', f.people.bob!, { archived: true }).threads).toHaveLength(1);
  });

  it('denies outsiders and anonymous callers', () => {
    const f = fixture(['alice', 'bob', 'eve']);
    const id = openThread(f, 'alice', ['bob']);
    for (const op of ['comms.thread.get', 'comms.thread.keys', 'comms.thread.leave']) {
      expect(code(() => f.call(op, f.people.eve!, { threadId: id }))).toBe('AUTHZ.FORBIDDEN');
    }
    expect(code(() => f.call('comms.thread.invite', f.people.eve!, { threadId: id, accountId: 'alice' }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => f.call('comms.thread.set_disappearing', f.people.bob!, { threadId: id, disappearingTtlMs: 60_000 }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => f.call('comms.thread.create', { kind: 'anonymous', id: 'anonymous', roles: [], tenantId: 'tnt_default' }, { invitees: ['bob'] }))).toBe('AUTH.REQUIRED');
  });

  it('enforces the 20 participant cap', () => {
    const names = Array.from({ length: 22 }, (_, i) => `u${i}`);
    const f = fixture(names);
    const t = f.call<ThreadDto>('comms.thread.create', f.people.u0!, { invitees: names.slice(1, 20) });
    expect(t.participants).toHaveLength(20);
    expect(code(() => f.call('comms.thread.invite', f.people.u0!, { threadId: t.id, accountId: 'u20' }))).toBe('COMMS.THREAD_FULL');
  });

  it('is idempotent per key and rejects key reuse with a different request', () => {
    const f = fixture(['alice', 'bob', 'carol']);
    const first = f.call<ThreadDto>('comms.thread.create', f.people.alice!, { invitees: ['bob'] }, 'create-key-0001');
    const again = f.call<ThreadDto>('comms.thread.create', f.people.alice!, { invitees: ['bob'] }, 'create-key-0001');
    expect(again.id).toBe(first.id);
    expect(f.deps.store.collection('comms_threads').count()).toBe(1);
    expect(code(() => f.call('comms.thread.create', f.people.alice!, { invitees: ['carol'] }, 'create-key-0001'))).toBe('IDEMPOTENCY.KEY_REUSED');
  });

  it('applies optimistic concurrency on participant and thread changes', () => {
    const f = fixture(['alice', 'bob']);
    const id = openThread(f, 'alice', ['bob']);
    const t = f.call<ThreadDto>('comms.thread.get', f.people.alice!, { threadId: id });
    f.call('comms.thread.archive', f.people.bob!, { threadId: id, archived: true });
    expect(code(() => f.call('comms.thread.archive', f.people.bob!, { threadId: id, archived: false, expectedVersion: 1 }))).toBe('STORE.VERSION_CONFLICT');
    f.call('comms.thread.set_disappearing', f.people.alice!, { threadId: id, disappearingTtlMs: 60_000, expectedVersion: t.version });
    expect(code(() => f.call('comms.thread.set_disappearing', f.people.alice!, { threadId: id, disappearingTtlMs: null, expectedVersion: t.version }))).toBe('STORE.VERSION_CONFLICT');
  });

  it('honours the feature flag', () => {
    const f = fixture(['alice', 'bob']);
    (f.deps as { flags: unknown }).flags = { isEnabled: (flag: string) => flag !== 'comms.threads' };
    expect(code(() => f.call('comms.thread.create', f.people.alice!, { invitees: ['bob'] }))).toBe('FEATURE.DISABLED');
  });

  it('never exceeds 20 live participants under random invite/respond/leave sequences (property)', () => {
    const names = Array.from({ length: 24 }, (_, i) => `u${i}`);
    const action = fc.record({ kind: fc.constantFrom('invite', 'accept', 'decline', 'leave'), who: fc.integer({ min: 1, max: 23 }) });
    fc.assert(
      fc.property(fc.array(action, { maxLength: 60 }), (steps) => {
        const f = fixture(names);
        const t = f.call<ThreadDto>('comms.thread.create', f.people.u0!, { invitees: names.slice(1, 15) });
        for (const s of steps) {
          const target = names[s.who] as string;
          try {
            if (s.kind === 'invite') f.call('comms.thread.invite', f.people.u0!, { threadId: t.id, accountId: target });
            else if (s.kind === 'leave') f.call('comms.thread.leave', f.people[target]!, { threadId: t.id });
            else f.call('comms.thread.respond', f.people[target]!, { threadId: t.id, accept: s.kind === 'accept' });
          } catch (e) {
            if (!(e instanceof DomainError)) throw e;
          }
          const live = f.deps.store.collection<{ id: string; version: number; status: string }>('comms_participants').count((p) => p.status === 'active' || p.status === 'invited');
          if (live > 20) return false;
        }
        return true;
      }),
      { numRuns: 25 },
    );
  });
});
