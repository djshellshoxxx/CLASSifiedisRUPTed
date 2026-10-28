/** Environment and helpers shared by every comms module. */
import type { AccountSnapshot, Actor, Collection, Deps, Permission } from '@classrup/kernel';
import { forbidden, notFound, precondition, conflict } from '@classrup/kernel';
import type { MultiRecipientCiphertext } from '@classrup/security';
import type { ResolvedCommsPorts } from './ports';
import type { Participant, ParticipantStatus, Thread } from './types';

export interface Env {
  readonly deps: Deps;
  readonly ports: ResolvedCommsPorts;
}

export const FLAGS = {
  threads: 'comms.threads',
  private: 'comms.private',
  attachments: 'comms.attachments',
  offers: 'comms.offers',
  consent: 'comms.consent',
  safe: 'comms.safe',
  handoff: 'comms.handoff',
  coordination: 'comms.coordination',
} as const;

export const COLLECTIONS = {
  threads: 'comms_threads',
  participants: 'comms_participants',
  counters: 'comms_counters',
  messages: 'comms_messages',
  readMarks: 'comms_read_marks',
  attachments: 'comms_attachments',
  cards: 'comms_cards',
  consents: 'comms_consents',
  safeSpots: 'comms_safe_spots',
  meetups: 'comms_meetups',
  noShows: 'comms_no_shows',
  handoffs: 'comms_handoffs',
  shares: 'comms_shares',
} as const;

export const MAX_PARTICIPANTS = 20;

export function col<T extends { id: string; version: number }>(env: Env, name: string): Collection<T> {
  return env.deps.store.collection<T>(name);
}

export const participantId = (threadId: string, accountId: string): string => `${threadId}:${accountId}`;

export interface ThreadView {
  readonly thread: Thread;
  readonly participants: readonly Participant[];
  readonly self: Participant | undefined;
}

export function loadThread(env: Env, actor: Actor, threadId: string): ThreadView {
  const thread = col<Thread>(env, COLLECTIONS.threads).get(threadId);
  if (!thread || thread.tenantId !== actor.tenantId) throw notFound('COMMS.THREAD_NOT_FOUND', 'thread not found');
  const participants = col<Participant>(env, COLLECTIONS.participants).list((p) => p.threadId === threadId);
  return { thread, participants, self: participants.find((p) => p.accountId === actor.id) };
}

export const withStatus = (view: ThreadView, ...statuses: ParticipantStatus[]): Participant[] =>
  view.participants.filter((p) => statuses.includes(p.status));

/** Authorizes against the participants holding one of `statuses` (default: active members only). */
export function authorizeThread(env: Env, actor: Actor, permission: Permission, view: ThreadView, statuses: ParticipantStatus[] = ['active']): void {
  env.deps.authz.authorize(actor, permission, {
    type: 'comms.thread',
    id: view.thread.id,
    ownerId: view.thread.createdBy,
    tenantId: view.thread.tenantId,
    participantIds: withStatus(view, ...statuses).map((p) => p.accountId),
  });
}

export function requireActiveAccount(env: Env, actor: Actor, accountId: string): AccountSnapshot {
  const acct = env.ports.accounts.get(accountId);
  if (!acct || acct.tenantId !== actor.tenantId || acct.status !== 'active') {
    throw precondition('COMMS.ACCOUNT_UNAVAILABLE', 'account is not available for communication');
  }
  return acct;
}

/** Rejects when `a` and `b` (either direction) are blocked. The error never says who blocked whom. */
export function assertNotBlocked(env: Env, a: string, others: readonly string[]): void {
  if (others.some((b) => env.ports.blocks.isBlocked(a, b))) throw forbidden('COMMS.BLOCKED', 'communication with this account is not possible');
}

/** accountId -> box key ids; rejects participants that cannot receive encrypted content. */
export function resolveRecipientKeys(env: Env, actor: Actor, accountIds: readonly string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const id of accountIds) {
    const acct = requireActiveAccount(env, actor, id);
    if (acct.boxKeyIds.length === 0) throw precondition('COMMS.RECIPIENT_NO_KEY', 'a participant has no encryption key registered');
    out[id] = [...acct.boxKeyIds];
  }
  return out;
}

/** The ciphertext must be sealed to exactly the expected key ids: no extra readers, no missing ones. */
export function assertKeysMatch(ciphertext: MultiRecipientCiphertext, recipients: Readonly<Record<string, readonly string[]>>): void {
  const expected = new Set(Object.values(recipients).flat());
  const given = new Set(Object.keys(ciphertext.keys));
  const missing = [...expected].filter((k) => !given.has(k)).length;
  const unexpected = [...given].filter((k) => !expected.has(k)).length;
  if (missing > 0 || unexpected > 0) {
    throw conflict('COMMS.KEYS_MISMATCH', 'ciphertext recipients do not match the current participants; refresh keys and re-encrypt', { missing, unexpected });
  }
}

/** Ciphertext reduced to the caller's own sealed keys, so one recipient never receives the others' wrappers. */
export function trimCiphertext(ciphertext: MultiRecipientCiphertext, keyIds: readonly string[]): MultiRecipientCiphertext {
  const keys: Record<string, MultiRecipientCiphertext['keys'][string]> = {};
  for (const id of keyIds) {
    const sealed = ciphertext.keys[id];
    if (sealed) keys[id] = sealed;
  }
  return { v: ciphertext.v, nonce: ciphertext.nonce, ct: ciphertext.ct, keys };
}

export function notifyEach(env: Env, tenantId: string, recipientIds: readonly string[], topic: string, template: string, data: Record<string, string | number>): void {
  for (const recipientId of recipientIds) env.ports.notify.notify({ tenantId, recipientId, topic, template, data });
}
