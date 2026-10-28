/** F12.S03.M02 signals: append-only risk signals whose influence halves every 30 days. */
import type { CommandContext, EventInput } from '@classrup/kernel';
import { DAY, parse, runCommand, schemas, z } from '@classrup/kernel';
import { authorize, event, operation, pageOf } from '../common';
import type { Env } from '../common';
import type { SignalKind, SignalRecord } from '../types';
import { SIGNAL_KINDS } from '../types';

export const HALF_LIFE_MS = 30 * DAY;
/** Signals older than ten half-lives contribute < 0.1% and are ignored. */
export const SIGNAL_HORIZON_MS = 10 * HALF_LIFE_MS;

export const DEFAULT_SIGNAL_WEIGHTS: Readonly<Record<SignalKind, number>> = {
  payment_failed: 10,
  dispute_lost: 25,
  txhash_reuse: 40,
  rapid_account_creation: 20,
  report_upheld: 20,
  chargeback_claim: 30,
  spam_detected: 15,
};

const recordSchema = z.object({
  accountId: schemas.text(1, 64),
  kind: z.enum(SIGNAL_KINDS),
  weight: z.number().int().min(1).max(100).optional(),
  sourceRef: schemas.text(1, 100).optional(),
});
const listSchema = z.object({
  accountId: schemas.text(1, 64),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export type RecordSignalInput = z.input<typeof recordSchema>;

export interface SignalDto {
  readonly id: string;
  readonly accountId: string;
  readonly kind: SignalKind;
  readonly weight: number;
  /** Weight after exponential decay at the time of the query, rounded to two decimals. */
  readonly currentWeight: number;
  readonly at: number;
  readonly sourceRef?: string;
  readonly revoked: boolean;
}

export const decayedWeight = (weight: number, ageMs: number): number => weight * Math.pow(0.5, Math.max(0, ageMs) / HALF_LIFE_MS);

export interface NewSignal {
  readonly tenantId: string;
  readonly accountId: string;
  readonly kind: SignalKind;
  readonly weight?: number | undefined;
  readonly sourceRef?: string | undefined;
}

export function insertSignal(env: Env, input: NewSignal): SignalRecord {
  return env.cols.signals.put(
    {
      id: env.deps.ids.next('rsig'),
      tenantId: input.tenantId,
      accountId: input.accountId,
      kind: input.kind,
      weight: input.weight ?? DEFAULT_SIGNAL_WEIGHTS[input.kind],
      at: env.deps.clock.now(),
      ...(input.sourceRef !== undefined ? { sourceRef: input.sourceRef } : {}),
    },
    0,
  );
}

export const signalEvent = (s: SignalRecord): EventInput<unknown> =>
  event('moderation.signal.recorded', 'signal', s.id, s.version, { signalId: s.id, accountId: s.accountId, kind: s.kind, weight: s.weight });

/** Signals tied to a decision that is later overturned stop counting; the record itself is kept. */
export function revokeBySource(env: Env, sourceRef: string): number {
  const now = env.deps.clock.now();
  const matching = env.cols.signals.list((s) => s.sourceRef === sourceRef && s.revokedAt === undefined);
  for (const s of matching) env.cols.signals.put({ ...s, revokedAt: now }, s.version);
  return matching.length;
}

export function liveSignals(env: Env, accountId: string, now: number): SignalRecord[] {
  return env.cols.signals.list((s) => s.accountId === accountId && s.revokedAt === undefined && now - s.at <= SIGNAL_HORIZON_MS);
}

export function createSignals(env: Env) {
  const toDto = (s: SignalRecord, now: number): SignalDto => ({
    id: s.id,
    accountId: s.accountId,
    kind: s.kind,
    weight: s.weight,
    currentWeight: Math.round(decayedWeight(s.weight, now - s.at) * 100) / 100,
    at: s.at,
    ...(s.sourceRef !== undefined ? { sourceRef: s.sourceRef } : {}),
    revoked: s.revokedAt !== undefined,
  });

  /** System-only: other features report facts (failed payment, lost dispute...) through the relay. */
  function record(ctx: CommandContext, input: RecordSignalInput): SignalDto {
    authorize(env, ctx, 'moderation.signal:record', 'signal');
    const v = parse(recordSchema, input);
    return runCommand(env.deps, ctx, { name: 'moderation.signal.record', flag: 'moderation.signals', request: v }, () => {
      const rec = insertSignal(env, { tenantId: ctx.actor.tenantId, ...v });
      return { result: toDto(rec, env.deps.clock.now()), events: [signalEvent(rec)] };
    });
  }

  function list(ctx: CommandContext, input: z.input<typeof listSchema>): SignalDto[] {
    authorize(env, ctx, 'moderation.signal:read', 'signal');
    const v = parse(listSchema, input);
    const now = env.deps.clock.now();
    const all = env.cols.signals.list((s) => s.accountId === v.accountId && s.tenantId === ctx.actor.tenantId).sort((a, b) => b.at - a.at);
    return pageOf(all, v.offset, v.limit).map((s) => toDto(s, now));
  }

  const operations = [
    operation('moderation.signal.record', 'command', 'moderation.signals', 'Record a risk signal for an account (system)', record),
    operation('moderation.signal.list', 'query', 'moderation.signals', 'List risk signals of an account (staff)', list),
  ];
  return { record, list, operations };
}
