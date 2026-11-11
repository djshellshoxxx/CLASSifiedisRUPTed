// Storage state machines declared in PS-119-03 (InboxEntry, MediaBlob); tests compare them with the spec.
// Storage has no sync outbox machine: F15.S01.M01 owns the OutboxEntry machine (N24).
import { defineMachine } from '../machine/machine.ts';

/**
 * Local outbox delivery per (consumer, eventId); `pending` means no inbox row yet. A requeued dead letter
 * (dead -> retry) returns to dead after 8 more failures, when its consumer is disabled or 7 days after it
 * was requeued without delivery; `purged` is the purge primitive deleting the dead letter and inbox rows.
 */
export const inboxMachine = defineMachine({
  initial: 'pending',
  terminal: ['done', 'purged'],
  transitions: [
    { from: 'pending', to: 'done', on: 'succeed' },
    { from: 'pending', to: 'retry', on: 'fail' },
    { from: 'pending', to: 'dead', on: 'fail_final' },
    { from: 'retry', to: 'done', on: 'succeed' },
    { from: 'retry', to: 'retry', on: 'fail' },
    { from: 'retry', to: 'dead', on: 'fail_final' },
    { from: 'dead', to: 'retry', on: 'requeue' },
    { from: 'retry', to: 'dead', on: 'disable' },
    { from: 'retry', to: 'dead', on: 'expire' },
    { from: 'dead', to: 'purged', on: 'purge' },
  ],
});
export type InboxState = (typeof inboxMachine.states)[number];
export type InboxEvent = (typeof inboxMachine.transitions)[number]['on'];

/** MediaBlob lifecycle: content-addressed bytes with holder rows; deleted with the last holder or by the orphan sweep. */
export const blobMachine = defineMachine({
  initial: 'stored',
  terminal: ['deleted'],
  transitions: [
    { from: 'stored', to: 'referenced', on: 'attach' },
    { from: 'referenced', to: 'referenced', on: 'holders_changed' },
    { from: 'referenced', to: 'deleted', on: 'detach_last' },
    { from: 'stored', to: 'deleted', on: 'sweep' },
  ],
});
export type BlobState = (typeof blobMachine.states)[number];
