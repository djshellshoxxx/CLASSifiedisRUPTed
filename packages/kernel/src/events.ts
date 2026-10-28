/**
 * CTR-EVT-001 (owner F15): versioned domain event envelope.
 * Events are facts in past tense, named `<area>.<aggregate>.<verb_past>` e.g. `bazaar.listing.published`.
 */
import type { Actor } from './actor';

export interface Provenance {
  readonly origin: 'local' | 'federated';
  /** Relay that accepted the event (federated origin). */
  readonly relayId?: string;
  /** Detached signature over the canonical payload (federated or signed records). */
  readonly signature?: string;
  readonly signerKeyId?: string;
}

export interface DomainEvent<P = unknown> {
  readonly eventId: string;
  readonly type: string;
  readonly schemaVersion: number;
  readonly aggregateType: string;
  readonly aggregateId: string;
  /** Aggregate revision after this event (1-based). */
  readonly revision: number;
  readonly tenantId: string;
  readonly actorId: string;
  readonly occurredAt: number;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly idempotencyKey?: string;
  readonly provenance: Provenance;
  readonly payload: P;
}

export interface EventInput<P> {
  type: string;
  aggregateType: string;
  aggregateId: string;
  revision: number;
  payload: P;
  schemaVersion?: number;
  causationId?: string;
}

const TYPE_RE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/;

export function isValidEventType(type: string): boolean {
  return TYPE_RE.test(type);
}

export type EventHandler = (event: DomainEvent) => void;

/** In-process publish/subscribe. Delivery is synchronous, after commit, and failures are isolated. */
export interface EventBus {
  publish(events: readonly DomainEvent[]): void;
  /** Subscribe to an exact type, a prefix ending with `.*`, or `*`. Returns unsubscribe. */
  subscribe(pattern: string, handler: EventHandler): () => void;
}

export interface EventBusOptions {
  onHandlerError?: (error: unknown, event: DomainEvent, pattern: string) => void;
}

export class InMemoryEventBus implements EventBus {
  readonly #subs = new Set<{ pattern: string; handler: EventHandler }>();
  readonly #onError: NonNullable<EventBusOptions['onHandlerError']>;
  #depth = 0;
  readonly #queue: DomainEvent[] = [];

  constructor(opts: EventBusOptions = {}) {
    this.#onError = opts.onHandlerError ?? (() => undefined);
  }

  static matches(pattern: string, type: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith('.*')) return type.startsWith(pattern.slice(0, -1));
    return pattern === type;
  }

  publish(events: readonly DomainEvent[]): void {
    this.#queue.push(...events);
    // Re-entrant publishes from handlers are queued so delivery order stays FIFO.
    if (this.#depth > 0) return;
    this.#depth++;
    try {
      while (this.#queue.length > 0) {
        const ev = this.#queue.shift() as DomainEvent;
        for (const sub of [...this.#subs]) {
          if (!InMemoryEventBus.matches(sub.pattern, ev.type)) continue;
          try {
            sub.handler(ev);
          } catch (e) {
            this.#onError(e, ev, sub.pattern);
          }
        }
      }
    } finally {
      this.#depth--;
    }
  }

  subscribe(pattern: string, handler: EventHandler): () => void {
    const sub = { pattern, handler };
    this.#subs.add(sub);
    return () => this.#subs.delete(sub);
  }
}
