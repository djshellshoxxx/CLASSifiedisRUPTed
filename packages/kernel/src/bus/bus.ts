// Command bus: one pipeline for vault (in-process) and relay (HTTP) dispatch (ADR-0002, ADR-0016).
// Order: flag → authn → rate limit → validation → authorize → idempotency → handler in Tx → outbox →
// idempotent response → audit. Each stage short-circuits with its CTR-ERR-001 code.
import type { Clock } from '../clock/clock.ts';
import { appError, AppErrorException, type AppError } from '../errors/app-error.ts';
import { err, ok, type Result } from '../errors/result.ts';
import type { EventEnvelope, EventSink } from '../events/envelope.ts';
import { jsonNormalize, requestHash } from '../hash/canonical.ts';
import { checkIdSkew, isUuidV7, type IdGen } from '../ids/uuidv7.ts';
import { noopLogger, type Logger } from '../observability/logger.ts';
import type { MetricsRegistry } from '../observability/metrics.ts';
import { readScope, writeScope } from '../storage/scope.ts';
import type { Storage } from '../storage/storage.ts';
import type { Tx } from '../storage/tx.ts';
import type { AnyCommand, AnyQuery, Registry } from './define.ts';
import { makeEmitter } from './emit.ts';
import { parseInput } from '../validation/parse.ts';
import {
  actorKey,
  allFlagsOn,
  envelopeActor,
  errorFromCode,
  noopAudit,
  unlimitedRate,
  type Actor,
  type AuditPort,
  type AuthzPort,
  type FlagPort,
  type Origin,
  type Ports,
  type RateLimitPort,
  type ResourceRef,
} from './ports.ts';

export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export interface BusOptions {
  readonly registry: Registry;
  readonly storage: Storage;
  readonly clock: Clock;
  readonly ids: IdGen;
  readonly authz: AuthzPort;
  readonly audit?: AuditPort;
  readonly flags?: FlagPort;
  readonly rateLimit?: RateLimitPort;
  readonly eventSink?: EventSink;
  readonly logger?: Logger;
  readonly metrics?: MetricsRegistry;
  readonly ports?: Ports;
  /** Envelope provenance origin, e.g. `vault:<id>` or `relay:<relayId>`. */
  readonly origin?: string;
  readonly idempotencyTtlMs?: number;
}

export interface DispatchContext {
  readonly actor: Actor;
  readonly tenantId: string;
  readonly correlationId?: string;
  /** `remote` (HTTP) reaches only relay-surface definitions. Default `local`. */
  readonly origin?: Origin;
}

export interface DispatchOptions {
  readonly idempotencyKey?: string;
  readonly expectedRevision?: number;
}

export interface CommandOutcome {
  readonly value: unknown;
  readonly status: number;
  readonly replayed: boolean;
  readonly events: readonly EventEnvelope[];
  readonly correlationId: string;
}

export interface QueryOutcome {
  readonly value: unknown;
  readonly status: 200;
  readonly correlationId: string;
}

export interface Bus {
  readonly registry: Registry;
  dispatch(ctx: DispatchContext, name: string, rawInput: unknown, opts?: DispatchOptions): Promise<Result<CommandOutcome, AppError>>;
  query(ctx: DispatchContext, name: string, rawInput: unknown): Promise<Result<QueryOutcome, AppError>>;
}

interface Call {
  readonly ctx: DispatchContext;
  readonly correlationId: string;
  readonly origin: Origin;
}

type Def = AnyCommand | AnyQuery;

function reachable(def: Def | undefined, origin: Origin): def is Def {
  return def !== undefined && (origin === 'local' || def.surface !== 'vault');
}

function validateKey(def: AnyCommand, key: string | undefined, now: number): Result<string | undefined, AppError> {
  if (!def.idempotent) return ok(undefined);
  if (key === undefined) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'idempotencyKey', code: 'REQUIRED' }] }));
  if (!isUuidV7(key)) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'idempotencyKey', code: 'INVALID_UUIDV7' }] }));
  const skew = checkIdSkew(key, now);
  return skew.ok ? ok(key) : skew;
}

function toAppError(e: unknown): AppError {
  return e instanceof AppErrorException ? e.error : appError('INTERNAL');
}

function outcomeLabel(r: Result<{ replayed?: boolean }, AppError>): string {
  if (r.ok) return r.value.replayed ? 'replayed' : 'ok';
  return r.error.status >= 500 ? 'failed' : 'rejected';
}

export function createBus(o: BusOptions): Bus {
  const flags = o.flags ?? allFlagsOn;
  const rate = o.rateLimit ?? unlimitedRate;
  const audit = o.audit ?? noopAudit;
  const log = o.logger ?? noopLogger;
  const origin = o.origin ?? 'local';
  const ttl = o.idempotencyTtlMs ?? IDEMPOTENCY_TTL_MS;
  const ports = o.ports ?? {};
  const m = o.metrics;
  const cmdTotal = m?.counter({ name: 'classrup_command_total', help: 'Commands dispatched by outcome.', labels: ['module', 'outcome', 'code'] });
  const cmdDuration = m?.histogram({ name: 'classrup_command_duration_ms', help: 'Command dispatch duration in milliseconds.', labels: ['module', 'outcome'] });
  const qTotal = m?.counter({ name: 'classrup_query_total', help: 'Queries executed by outcome.', labels: ['module', 'outcome', 'code'] });
  const qDuration = m?.histogram({ name: 'classrup_query_duration_ms', help: 'Query duration in milliseconds.', labels: ['module', 'outcome'] });

  async function gate(def: Def, call: Call, kind: 'command' | 'query', raw: unknown): Promise<Result<unknown, AppError>> {
    const { actor, tenantId } = call.ctx;
    if (!(await flags.isEnabled({ tenantId, module: def.module, actor, operation: def.name }))) return err(appError('FEATURE_DISABLED'));
    if (def.auth === 'required' && actor.kind === 'anonymous') return err(appError('UNAUTHENTICATED'));
    const rl = await rate.check({ tenantId, actor, operation: def.name, capability: def.capability, kind, now: o.clock.now() });
    if (!rl.allowed) return err(appError('RATE_LIMITED', { retryAfterMs: rl.retryAfterMs, params: { retryAfterMs: rl.retryAfterMs } }));
    return parseInput(def.input, raw);
  }

  async function authorize(def: Def, call: Call, kind: 'command' | 'query', resource: ResourceRef | undefined): Promise<Result<void, AppError>> {
    const d = await o.authz.authorize(call.ctx.actor, def.capability, resource, { tenantId: call.ctx.tenantId, operation: def.name, kind, origin: call.origin, now: o.clock.now() });
    if (d.allow) return ok(undefined);
    const code = d.code === 'FORBIDDEN' && def.hideForbidden ? 'NOT_FOUND' : d.code;
    return err(code === 'NOT_FOUND' ? appError('NOT_FOUND') : errorFromCode(code, d.params));
  }

  async function writeAudit(def: AnyCommand, call: Call, resource: ResourceRef | undefined, decision: 'allow' | 'deny', r: Result<{ replayed: boolean }, AppError>): Promise<void> {
    const outcome = decision === 'deny' ? 'denied' : r.ok ? (r.value.replayed ? 'replayed' : 'ok') : 'error';
    try {
      await audit.record({
        at: o.clock.iso(),
        tenantId: call.ctx.tenantId,
        actor: envelopeActor(call.ctx.actor),
        capability: def.capability,
        operation: def.name,
        ...(resource ? { resource: { type: resource.type, id: resource.id } } : {}),
        decision,
        outcome,
        ...(r.ok ? {} : { code: r.error.code }),
        correlationId: call.correlationId,
      });
    } catch (e) {
      log.error('audit.write_failed', { correlationId: call.correlationId, module: def.module, error: e });
    }
  }

  type Exec = { value: unknown; status: number; replayed: boolean };

  async function execute(def: AnyCommand, call: Call, input: unknown, raw: unknown, key: string | undefined, opts: DispatchOptions, events: EventEnvelope[]): Promise<Result<Exec, AppError>> {
    const hash = key === undefined ? undefined : await requestHash(raw);
    const { actor, tenantId } = call.ctx;
    const ref = key === undefined ? undefined : { tenant: tenantId, actor: actorKey(actor), command: def.name, key };
    const commandId = o.ids.next();
    return o.storage.transaction(async (tx: Tx): Promise<Result<Exec, AppError>> => {
      if (ref) {
        const prior = tx.idempotency.lookup(ref, o.clock.now());
        if (prior) return prior.requestHash === hash ? ok({ value: prior.response, status: prior.status, replayed: true }) : err(appError('IDEMPOTENCY_KEY_REUSED'));
      }
      const scope = writeScope({ tx, tenantId, clock: o.clock, ids: o.ids, deliveryEligible: def.deliveryEligible === true });
      const emit = makeEmitter({ tx, tenantId, actor, ids: o.ids, clock: o.clock, correlationId: call.correlationId, causationId: commandId, origin, collected: events });
      const hctx = { actor, tenantId, correlationId: call.correlationId, clock: o.clock, ids: o.ids, ports, log: log.child({ module: def.module, correlationId: call.correlationId }), commandId, expectedRevision: opts.expectedRevision, tx: scope, emit };
      const out = await def.handler(hctx, input);
      if (!out.ok) return out;
      const value = checkOutput(def, out.value);
      const status = def.successStatus ?? 200;
      if (ref && hash) {
        const now = o.clock.now();
        tx.idempotency.save({ ...ref, requestHash: hash, status, response: value ?? null, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + ttl).toISOString() });
      }
      return ok({ value, status, replayed: false });
    });
  }

  function checkOutput(def: Def, value: unknown): unknown {
    if (!def.output) return jsonNormalize(value);
    const r = def.output.safeParse(value);
    if (!r.success) throw new Error(`${def.name}: handler output does not match its schema`);
    return jsonNormalize(r.data);
  }

  async function runCommand(def: AnyCommand, call: Call, raw: unknown, opts: DispatchOptions, events: EventEnvelope[]): Promise<Result<Exec, AppError>> {
    const parsed = await gate(def, call, 'command', raw);
    if (!parsed.ok) return parsed;
    const key = validateKey(def, opts.idempotencyKey, o.clock.now());
    if (!key.ok) return key;
    const resource = def.resource?.(parsed.value);
    const authz = await authorize(def, call, 'command', resource);
    if (!authz.ok) {
      await writeAudit(def, call, resource, 'deny', authz);
      return authz;
    }
    let r: Result<Exec, AppError>;
    try {
      r = await execute(def, call, parsed.value, raw, key.value, opts, events);
    } catch (e) {
      await writeAudit(def, call, resource, 'allow', err(toAppError(e)));
      throw e;
    }
    await writeAudit(def, call, resource, 'allow', r);
    return r;
  }

  function finish(kind: 'command' | 'query', def: Def | undefined, call: Call, started: number, r: Result<{ replayed?: boolean }, AppError>, e?: unknown): void {
    const durationMs = Math.round((globalThis.performance.now() - started) * 1000) / 1000;
    const module = def?.module ?? 'unknown';
    const outcome = outcomeLabel(r);
    const code = r.ok ? 'OK' : r.error.code;
    (kind === 'command' ? cmdTotal : qTotal)?.inc({ module, outcome, code });
    (kind === 'command' ? cmdDuration : qDuration)?.observe({ module, outcome }, durationMs);
    const fields = { correlationId: call.correlationId, module, code, durationMs, operation: def?.name, outcome, ...(e === undefined ? {} : { error: e }) };
    if (e !== undefined) log.error(`${kind}.failed`, fields);
    else log.info(`${kind}.completed`, fields);
  }

  const callOf = (ctx: DispatchContext): Call => ({ ctx, correlationId: ctx.correlationId ?? o.ids.next(), origin: ctx.origin ?? 'local' });

  return {
    registry: o.registry,
    dispatch: async (ctx, name, rawInput, opts = {}) => {
      const started = globalThis.performance.now();
      const call = callOf(ctx);
      const found = o.registry.command(name);
      const def = reachable(found, call.origin) ? found : undefined;
      const events: EventEnvelope[] = [];
      let r: Result<Exec, AppError>;
      let thrown: unknown;
      try {
        r = def ? await runCommand(def, call, rawInput, opts, events) : err(appError('NOT_FOUND'));
      } catch (e) {
        thrown = e;
        r = err(toAppError(e));
      }
      if (r.ok && !r.value.replayed && events.length) o.eventSink?.publish(events);
      finish('command', def, call, started, r, thrown);
      return r.ok ? ok({ ...r.value, events: r.value.replayed ? [] : events, correlationId: call.correlationId }) : r;
    },
    query: async (ctx, name, rawInput) => {
      const started = globalThis.performance.now();
      const call = callOf(ctx);
      const found = o.registry.query(name);
      const def = reachable(found, call.origin) ? found : undefined;
      let r: Result<{ value: unknown }, AppError>;
      let thrown: unknown;
      try {
        r = def ? await runQuery(def, call, rawInput) : err(appError('NOT_FOUND'));
      } catch (e) {
        thrown = e;
        r = err(toAppError(e));
      }
      finish('query', def, call, started, r, thrown);
      return r.ok ? ok({ value: r.value.value, status: 200 as const, correlationId: call.correlationId }) : r;
    },
  };

  async function runQuery(def: AnyQuery, call: Call, raw: unknown): Promise<Result<{ value: unknown }, AppError>> {
    const parsed = await gate(def, call, 'query', raw);
    if (!parsed.ok) return parsed;
    const authz = await authorize(def, call, 'query', def.resource?.(parsed.value));
    if (!authz.ok) return authz;
    const { actor, tenantId } = call.ctx;
    return o.storage.transaction(
      async (tx) => {
        const hctx = { actor, tenantId, correlationId: call.correlationId, clock: o.clock, ids: o.ids, ports, log: log.child({ module: def.module, correlationId: call.correlationId }), tx: readScope({ tx, tenantId, clock: o.clock }) };
        const out = await def.handler(hctx, parsed.value);
        return out.ok ? ok({ value: checkOutput(def, out.value) }) : out;
      },
      { mode: 'read' },
    );
  }
}
