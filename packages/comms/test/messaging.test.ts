import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DAY, DomainError, MINUTE, rateLimited, type RateLimitPort } from '@classrup/kernel';
import { decryptMessage, encryptMessage } from '../src/index';
import type { MessageDto } from '../src/index';
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

function keyIds(f: Fixture, who: Person, threadId: string): string[] {
  return f.call<{ recipients: { boxKeyIds: string[] }[] }>('comms.thread.keys', who, { threadId }).recipients.flatMap((r) => r.boxKeyIds);
}

function send(f: Fixture, who: Person, threadId: string, body: unknown, key?: string): MessageDto {
  const ciphertext = encryptMessage({ type: 'text', text: String(body) }, keyIds(f, who, threadId), threadId);
  return f.call<MessageDto>('comms.message.send', who, { threadId, ciphertext }, key);
}

describe('private messaging (F08.S01.M01)', () => {
  it('delivers ciphertext that only participants can decrypt, and the relay never stores plaintext', () => {
    const f = fixture(['alice', 'bob', 'eve']);
    const id = openThread(f, 'alice', ['bob']);
    const secret = 'meet at 12 Elm Street, bring cash 4711';
    const sent = send(f, f.people.alice!, id, secret);
    expect(sent.sequence).toBe(1);

    const inbox = f.call<{ messages: MessageDto[] }>('comms.message.list', f.people.bob!, { threadId: id }).messages;
    expect(inbox).toHaveLength(1);
    const bob = f.people.bob!;
    expect(decryptMessage(inbox[0]!.ciphertext, bob.boxId, bob.box, id)).toEqual({ type: 'text', text: secret });
    expect(Object.keys(inbox[0]!.ciphertext.keys)).toEqual([bob.boxId]);
    expect(() => decryptMessage(inbox[0]!.ciphertext, bob.boxId, bob.box, 'thr_OTHER')).toThrow();

    const stored = JSON.stringify((f.deps.store as unknown as { exportSnapshot(): unknown }).exportSnapshot());
    expect(stored).not.toContain('Elm Street');
    expect(stored).not.toContain('4711');
    expect(JSON.stringify(f.deps.store.events.read())).not.toContain('Elm Street');
    expect(f.notifier.sent.every((n) => !JSON.stringify(n).includes('Elm'))).toBe(true);
    expect(code(() => f.call('comms.message.list', f.people.eve!, { threadId: id }))).toBe('AUTHZ.FORBIDDEN');
  });

  it('requires ciphertext sealed to exactly the current participants', () => {
    const f = fixture(['alice', 'bob', 'carol']);
    const id = openThread(f, 'alice', ['bob']);
    const alice = f.people.alice!;
    const stale = encryptMessage({ t: 1 }, [alice.boxId], id);
    expect(code(() => f.call('comms.message.send', alice, { threadId: id, ciphertext: stale }))).toBe('COMMS.KEYS_MISMATCH');
    const extra = encryptMessage({ t: 1 }, [alice.boxId, f.people.bob!.boxId, f.people.carol!.boxId], id);
    expect(code(() => f.call('comms.message.send', alice, { threadId: id, ciphertext: extra }))).toBe('COMMS.KEYS_MISMATCH');
  });

  it('validates ciphertext structure and the 64KB limit', () => {
    const f = fixture(['alice', 'bob']);
    const id = openThread(f, 'alice', ['bob']);
    const alice = f.people.alice!;
    const good = encryptMessage({ t: 1 }, keyIds(f, alice, id), id);
    expect(code(() => f.call('comms.message.send', alice, { threadId: id, ciphertext: { ...good, extra: 1 } }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.call('comms.message.send', alice, { threadId: id, ciphertext: { ...good, nonce: 'short' } }))).toBe('VALIDATION.INVALID_INPUT');
    expect(code(() => f.call('comms.message.send', alice, { threadId: id, ciphertext: { ...good, keys: { notakey: good.keys[alice.boxId] } } }))).toBe('VALIDATION.INVALID_INPUT');
    const big = encryptMessage({ blob: 'x'.repeat(70_000) }, keyIds(f, alice, id), id);
    expect(code(() => f.call('comms.message.send', alice, { threadId: id, ciphertext: big }))).toBe('VALIDATION.INVALID_INPUT');
    const nearLimit = encryptMessage({ blob: 'x'.repeat(60_000) }, keyIds(f, alice, id), id);
    expect(f.call<MessageDto>('comms.message.send', alice, { threadId: id, ciphertext: nearLimit }).sequence).toBe(1);
  });

  it('keeps invited members and strangers out of the send path', () => {
    const f = fixture(['alice', 'bob', 'eve']);
    const t = f.call<{ id: string }>('comms.thread.create', f.people.alice!, { invitees: ['bob'] });
    const ct = encryptMessage({ t: 1 }, [f.people.alice!.boxId], t.id);
    expect(code(() => f.call('comms.message.send', f.people.alice!, { threadId: t.id, ciphertext: ct }))).toBe('COMMS.THREAD_NOT_READY');
    expect(code(() => f.call('comms.message.send', f.people.bob!, { threadId: t.id, ciphertext: ct }))).toBe('AUTHZ.FORBIDDEN');
    expect(code(() => f.call('comms.message.send', f.people.eve!, { threadId: t.id, ciphertext: ct }))).toBe('AUTHZ.FORBIDDEN');
  });

  it('rate limits per sender and rejects blocked recipients', () => {
    let calls = 0;
    const rateLimit: RateLimitPort = {
      consume: (key) => {
        if (key.startsWith('comms.send:') && ++calls > 2) throw rateLimited('RATE.LIMITED', 'slow down');
      },
    };
    const f = fixture(['alice', 'bob'], { rateLimit });
    const id = openThread(f, 'alice', ['bob']);
    send(f, f.people.alice!, id, 'one');
    send(f, f.people.alice!, id, 'two');
    expect(code(() => send(f, f.people.alice!, id, 'three'))).toBe('RATE.LIMITED');
    const g = fixture(['alice', 'bob']);
    const gid = openThread(g, 'alice', ['bob']);
    g.blocked.add('bob|alice');
    expect(code(() => send(g, g.people.alice!, gid, 'hi'))).toBe('COMMS.BLOCKED');
  });

  it('is idempotent per key and detects key reuse', () => {
    const f = fixture(['alice', 'bob']);
    const id = openThread(f, 'alice', ['bob']);
    const ct = encryptMessage({ t: 'a' }, keyIds(f, f.people.alice!, id), id);
    const first = f.call<MessageDto>('comms.message.send', f.people.alice!, { threadId: id, ciphertext: ct }, 'send-key-00001');
    const replay = f.call<MessageDto>('comms.message.send', f.people.alice!, { threadId: id, ciphertext: ct }, 'send-key-00001');
    expect(replay).toEqual(first);
    expect(f.deps.store.collection('comms_messages').count()).toBe(1);
    const other = encryptMessage({ t: 'b' }, keyIds(f, f.people.alice!, id), id);
    expect(code(() => f.call('comms.message.send', f.people.alice!, { threadId: id, ciphertext: other }, 'send-key-00001'))).toBe('IDEMPOTENCY.KEY_REUSED');
  });

  it('assigns monotonic gapless sequences and lists since a sequence (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom('alice', 'bob', 'carol'), { minLength: 1, maxLength: 12 }), fc.nat(12), (senders, since) => {
        const f = fixture(['alice', 'bob', 'carol']);
        const id = openThread(f, 'alice', ['bob', 'carol']);
        const seqs = senders.map((s, i) => send(f, f.people[s]!, id, `m${i}`).sequence);
        const gapless = seqs.every((s, i) => s === i + 1);
        const listed = f.call<{ messages: MessageDto[] }>('comms.message.list', f.people.carol!, { threadId: id, sinceSequence: since }).messages;
        return gapless && listed.every((m) => m.sequence > since) && listed.length === Math.max(0, senders.length - since);
      }),
      { numRuns: 20 },
    );
  });

  it('paginates with hasMore', () => {
    const f = fixture(['alice', 'bob']);
    const id = openThread(f, 'alice', ['bob']);
    for (let i = 0; i < 5; i++) send(f, f.people.alice!, id, `m${i}`);
    const page = f.call<{ messages: MessageDto[]; hasMore: boolean }>('comms.message.list', f.people.bob!, { threadId: id, limit: 3 });
    expect(page.messages.map((m) => m.sequence)).toEqual([1, 2, 3]);
    expect(page.hasMore).toBe(true);
  });

  it('keeps messages from before a participant joined unreadable and invisible to them', () => {
    const f = fixture(['alice', 'bob', 'carol']);
    const id = openThread(f, 'alice', ['bob']);
    send(f, f.people.alice!, id, 'early');
    f.call('comms.thread.invite', f.people.alice!, { threadId: id, accountId: 'carol' });
    f.call('comms.thread.respond', f.people.carol!, { threadId: id, accept: true });
    send(f, f.people.alice!, id, 'late');
    const seen = f.call<{ messages: MessageDto[] }>('comms.message.list', f.people.carol!, { threadId: id }).messages;
    expect(seen.map((m) => m.sequence)).toEqual([2]);
  });

  it('delete-for-me hides for one participant and removes the record once everyone deleted it', () => {
    const f = fixture(['alice', 'bob']);
    const id = openThread(f, 'alice', ['bob']);
    const m = send(f, f.people.alice!, id, 'x');
    expect(f.call('comms.message.delete_for_me', f.people.bob!, { messageId: m.id })).toEqual({ messageId: m.id, removed: false });
    expect(f.call<{ messages: unknown[] }>('comms.message.list', f.people.bob!, { threadId: id }).messages).toHaveLength(0);
    expect(f.call<{ messages: unknown[] }>('comms.message.list', f.people.alice!, { threadId: id }).messages).toHaveLength(1);
    expect(f.call('comms.message.delete_for_me', f.people.alice!, { messageId: m.id })).toEqual({ messageId: m.id, removed: true });
    expect(f.deps.store.collection('comms_messages').count()).toBe(0);
    expect(code(() => f.call('comms.message.delete_for_me', f.people.bob!, { messageId: m.id }))).toBe('COMMS.MESSAGE_NOT_FOUND');
  });

  it('purges disappearing messages after their TTL', () => {
    const f = fixture(['alice', 'bob']);
    const id = openThread(f, 'alice', ['bob'], { disappearingTtlMs: 10 * MINUTE });
    send(f, f.people.alice!, id, 'ephemeral');
    f.deps.clock.advance(9 * MINUTE);
    expect(f.sys<{ purged: number }>('comms.message.expire_due').purged).toBe(0);
    f.deps.clock.advance(2 * MINUTE);
    expect(f.call<{ messages: unknown[] }>('comms.message.list', f.people.bob!, { threadId: id }).messages).toHaveLength(0);
    expect(f.sys<{ purged: number }>('comms.message.expire_due').purged).toBe(1);
    expect(f.deps.store.collection('comms_messages').count()).toBe(0);
    expect(f.deps.store.events.read().some((e) => e.event.type === 'comms.message.purged')).toBe(true);
    expect(code(() => f.call('comms.message.expire_due', f.people.alice!))).toBe('AUTHZ.FORBIDDEN');
  });

  it('sets the TTL only for later messages and lets the creator clear it', () => {
    const f = fixture(['alice', 'bob']);
    const id = openThread(f, 'alice', ['bob']);
    const before = send(f, f.people.alice!, id, 'before');
    f.call('comms.thread.set_disappearing', f.people.alice!, { threadId: id, disappearingTtlMs: DAY });
    const during = send(f, f.people.alice!, id, 'during');
    f.call('comms.thread.set_disappearing', f.people.alice!, { threadId: id, disappearingTtlMs: null });
    expect(before.expiresAt).toBeUndefined();
    expect(during.expiresAt).toBe(f.deps.clock.now() + DAY);
    expect(send(f, f.people.alice!, id, 'after').expiresAt).toBeUndefined();
    expect(code(() => f.call('comms.thread.set_disappearing', f.people.alice!, { threadId: id, disappearingTtlMs: 5 }))).toBe('VALIDATION.INVALID_INPUT');
  });

  it('shares read receipts only for participants who opted in', () => {
    const f = fixture(['alice', 'bob']);
    const id = openThread(f, 'alice', ['bob']);
    send(f, f.people.alice!, id, 'x');
    f.call('comms.receipt.mark', f.people.bob!, { threadId: id, upToSequence: 1 });
    expect(f.call<{ receipts: unknown[] }>('comms.receipt.list', f.people.alice!, { threadId: id }).receipts).toEqual([]);
    expect(f.deps.store.events.read().some((e) => e.event.type === 'comms.receipt.marked')).toBe(false);
    f.call('comms.receipt.set_enabled', f.people.bob!, { threadId: id, enabled: true });
    send(f, f.people.alice!, id, 'y');
    f.call('comms.receipt.mark', f.people.bob!, { threadId: id, upToSequence: 2 });
    expect(f.call<{ receipts: { accountId: string; upToSequence: number }[] }>('comms.receipt.list', f.people.alice!, { threadId: id }).receipts).toMatchObject([{ accountId: 'bob', upToSequence: 2 }]);
    expect(f.call<{ own: number }>('comms.receipt.list', f.people.bob!, { threadId: id }).own).toBe(2);
    expect(code(() => f.call('comms.receipt.mark', f.people.bob!, { threadId: id, upToSequence: 99 }))).toBe('COMMS.SEQUENCE_UNKNOWN');
    expect(f.call('comms.receipt.mark', f.people.bob!, { threadId: id, upToSequence: 1 })).toMatchObject({ upToSequence: 2 });
  });

  it('does not notify muted participants and carries no message content in notifications', () => {
    const f = fixture(['alice', 'bob', 'carol']);
    const id = openThread(f, 'alice', ['bob', 'carol']);
    f.call('comms.thread.mute', f.people.bob!, { threadId: id, muted: true });
    f.notifier.sent.length = 0;
    send(f, f.people.alice!, id, 'psst');
    expect(f.notifier.sent.map((n) => n.recipientId)).toEqual(['carol']);
    expect(f.notifier.sent[0]!.data).toEqual({ threadId: id });
  });
});
