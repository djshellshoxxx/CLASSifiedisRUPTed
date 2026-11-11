// Domain event envelope (CTR-EVT-001) and event definitions; EventSink is notified after commit (EVT-2, EVT-8).
import type * as z from 'zod';

export type PrivacyClass = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
export type EnvelopeActorKind = 'user' | 'system' | 'relay' | 'federated' | 'operator';

export interface AggregateRef {
  readonly type: string;
  readonly id: string;
}

export interface EventEnvelope<P = unknown> {
  readonly eventId: string;
  readonly type: string;
  readonly version: number;
  readonly tenantId: string;
  readonly aggregate: AggregateRef;
  readonly revision: number;
  readonly actor: { readonly kind: EnvelopeActorKind; readonly id: string };
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly causationId: string;
  readonly privacy: PrivacyClass;
  readonly payload: P;
  readonly provenance: { readonly origin: string; readonly sig: string | null };
}

export interface EventDef<T extends string = string, S extends z.ZodType = z.ZodType> {
  readonly type: T;
  readonly version: number;
  readonly privacy: PrivacyClass;
  readonly payload: S;
}

export type PayloadOf<D> = D extends EventDef<string, infer S> ? z.output<S> : never;

/** Post-commit notification port: receives envelopes only after their transaction committed. */
export interface EventSink {
  publish(events: readonly EventEnvelope[]): void;
}

export const EVENT_TYPE_RE = /^[a-z0-9]+\.[a-z0-9_]+\.[a-z0-9_]+$/;
const PRIVACY = new Set<string>(['P0', 'P1', 'P2', 'P3', 'P4']);

/** Declares an event type `<slug>.<entity>.<past_tense_verb>` (EVT-1) with a strict payload schema. */
export function defineEvent<const T extends string, S extends z.ZodType>(type: T, version: number, privacy: PrivacyClass, payload: S): EventDef<T, S> {
  if (!EVENT_TYPE_RE.test(type)) throw new Error(`defineEvent: invalid type ${type}`);
  if (!Number.isInteger(version) || version < 1) throw new Error(`defineEvent: ${type} version must be an integer >= 1`);
  if (!PRIVACY.has(privacy)) throw new Error(`defineEvent: ${type} privacy ${privacy}`);
  return Object.freeze({ type, version, privacy, payload });
}

export interface EmitInput<P> {
  readonly aggregate: AggregateRef;
  readonly revision: number;
  readonly payload: P;
}

export interface EnvelopeContext {
  readonly eventId: string;
  readonly tenantId: string;
  readonly actor: { readonly kind: EnvelopeActorKind; readonly id: string };
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly causationId: string;
  readonly origin: string;
}

/** Builds an envelope; an invalid payload is a programmer error and throws (ERR-3, EVT-5). */
export function buildEnvelope<D extends EventDef>(def: D, input: EmitInput<PayloadOf<D>>, c: EnvelopeContext): EventEnvelope<PayloadOf<D>> {
  const parsed = def.payload.safeParse(input.payload);
  if (!parsed.success) throw new Error(`event ${def.type}: payload does not match its schema`);
  if (!Number.isInteger(input.revision) || input.revision < 1) throw new Error(`event ${def.type}: revision must be >= 1`);
  return {
    eventId: c.eventId,
    type: def.type,
    version: def.version,
    tenantId: c.tenantId,
    aggregate: { type: input.aggregate.type, id: input.aggregate.id },
    revision: input.revision,
    actor: c.actor,
    occurredAt: c.occurredAt,
    correlationId: c.correlationId,
    causationId: c.causationId,
    privacy: def.privacy,
    payload: parsed.data as PayloadOf<D>,
    provenance: { origin: c.origin, sig: null },
  };
}

export function collectingSink(): EventSink & { readonly events: EventEnvelope[] } {
  const events: EventEnvelope[] = [];
  return { events, publish: (list) => void events.push(...list) };
}
