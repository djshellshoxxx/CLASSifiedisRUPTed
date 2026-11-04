// Builds the emit() function handed to handlers: envelope per CTR-EVT-001, written to the outbox in the same transaction.
import type { Clock } from '../clock/clock.ts';
import { buildEnvelope, type EventEnvelope } from '../events/envelope.ts';
import type { IdGen } from '../ids/uuidv7.ts';
import type { Tx } from '../storage/tx.ts';
import type { Emit } from './define.ts';
import { envelopeActor, type Actor } from './ports.ts';

export interface EmitterOptions {
  readonly tx: Tx;
  readonly tenantId: string;
  readonly actor: Actor;
  readonly ids: IdGen;
  readonly clock: Clock;
  readonly correlationId: string;
  readonly causationId: string;
  readonly origin: string;
  readonly collected: EventEnvelope[];
}

export function makeEmitter(o: EmitterOptions): Emit {
  return (def, input) => {
    const env = buildEnvelope(def, input, {
      eventId: o.ids.next(),
      tenantId: o.tenantId,
      actor: envelopeActor(o.actor),
      occurredAt: o.clock.iso(),
      correlationId: o.correlationId,
      causationId: o.causationId,
      origin: o.origin,
    });
    o.tx.outbox.append(env);
    o.collected.push(env);
    return env;
  };
}
