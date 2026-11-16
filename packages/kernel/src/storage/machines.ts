// Delivery state machines declared in PS-119-03 (InboxEntry, sync outbox); tests compare them with the spec.
import { defineMachine } from '../machine/machine.ts';

/** Local outbox delivery per (consumer, eventId); `pending` means no inbox row yet. */
export const inboxMachine = defineMachine({
  initial: 'pending',
  terminal: ['done'],
  transitions: [
    { from: 'pending', to: 'done', on: 'succeed' },
    { from: 'pending', to: 'retry', on: 'fail' },
    { from: 'pending', to: 'dead', on: 'fail_final' },
    { from: 'retry', to: 'done', on: 'succeed' },
    { from: 'retry', to: 'retry', on: 'fail' },
    { from: 'retry', to: 'dead', on: 'fail_final' },
    { from: 'dead', to: 'retry', on: 'requeue' },
  ],
});
export type InboxState = (typeof inboxMachine.states)[number];

/** Signed-statement delivery per destination (CTR-IDM-001 IDM-7). */
export const syncMachine = defineMachine({
  initial: 'prepared',
  terminal: ['peer_accepted'],
  transitions: [
    { from: 'prepared', to: 'transport_acknowledged', on: 'transport_ack' },
    { from: 'prepared', to: 'peer_accepted', on: 'peer_ack' },
    { from: 'prepared', to: 'prepared', on: 'retry_later' },
    { from: 'prepared', to: 'failed', on: 'fail' },
    { from: 'transport_acknowledged', to: 'peer_accepted', on: 'peer_ack' },
    { from: 'failed', to: 'prepared', on: 'retry' },
    { from: 'failed', to: 'peer_accepted', on: 'peer_ack' },
  ],
});
export type SyncEvent = (typeof syncMachine.transitions)[number]['on'];
