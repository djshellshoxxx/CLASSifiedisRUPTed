// Command, query and consumer definitions and the registry (ADR-0002 command bus).
import type * as z from 'zod';
import type { Clock } from '../clock/clock.ts';
import type { AppError } from '../errors/app-error.ts';
import type { Result } from '../errors/result.ts';
import { EVENT_TYPE_RE, type EmitInput, type EventDef, type EventEnvelope, type PayloadOf } from '../events/envelope.ts';
import type { IdGen } from '../ids/uuidv7.ts';
import type { Logger } from '../observability/logger.ts';
import type { ReadScope, WriteScope } from '../storage/scope.ts';
import type { Actor, Ports, ResourceRef } from './ports.ts';

/** Where a definition may be invoked: in the user's vault, on a relay over HTTP, or both (ADR-0016). */
export type Surface = 'vault' | 'relay' | 'both';

export interface HandlerContext {
  readonly actor: Actor;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly clock: Clock;
  readonly ids: IdGen;
  readonly ports: Ports;
  readonly log: Logger;
}

export type Emit = <D extends EventDef>(def: D, input: EmitInput<PayloadOf<D>>) => EventEnvelope<PayloadOf<D>>;

export interface CommandContext extends HandlerContext {
  readonly commandId: string;
  /** From DispatchOptions (e.g. HTTP If-Match); most commands carry expectedRevision in their input. */
  readonly expectedRevision: number | undefined;
  readonly tx: WriteScope;
  readonly emit: Emit;
}

export interface QueryContext extends HandlerContext {
  readonly tx: ReadScope;
}

export interface ConsumerContext extends HandlerContext {
  readonly causationId: string;
  readonly tx: WriteScope;
  readonly emit: Emit;
}

type Awaitable<T> = T | Promise<T>;

export interface CommandSpec<I extends z.ZodType, O> {
  readonly name: string;
  readonly module: string;
  readonly capability: string;
  readonly input: I;
  readonly output?: z.ZodType<O>;
  readonly idempotent: boolean;
  readonly surface?: Surface;
  readonly auth?: 'required' | 'public';
  /** Only deliveryEligible definitions may queue signed statements into the sync outbox. */
  readonly deliveryEligible?: boolean;
  /** Map FORBIDDEN to NOT_FOUND for resources the actor may not know exist (ERR-4). */
  readonly hideForbidden?: boolean;
  resource?(input: z.output<I>): ResourceRef | undefined;
  readonly successStatus?: 200 | 201 | 202;
  handler(ctx: CommandContext, input: z.output<I>): Awaitable<Result<O, AppError>>;
}

export interface QuerySpec<I extends z.ZodType, O> {
  readonly name: string;
  readonly module: string;
  readonly capability: string;
  readonly input: I;
  readonly output?: z.ZodType<O>;
  readonly surface?: Surface;
  readonly auth?: 'required' | 'public';
  readonly hideForbidden?: boolean;
  resource?(input: z.output<I>): ResourceRef | undefined;
  handler(ctx: QueryContext, input: z.output<I>): Awaitable<Result<O, AppError>>;
}

export interface SubscriberSpec<D extends EventDef> {
  /** Consumer ID used for inbox dedupe, e.g. `notify.offer_made`. */
  readonly name: string;
  readonly module: string;
  readonly events: readonly D[];
  readonly deliveryEligible?: boolean;
  handler(ctx: ConsumerContext, envelope: EventEnvelope<PayloadOf<D>>): Awaitable<Result<void, AppError>>;
}

export type CommandDef<I extends z.ZodType = z.ZodType, O = unknown> = CommandSpec<I, O> & { readonly kind: 'command'; readonly surface: Surface; readonly auth: 'required' | 'public' };
export type QueryDef<I extends z.ZodType = z.ZodType, O = unknown> = QuerySpec<I, O> & { readonly kind: 'query'; readonly surface: Surface; readonly auth: 'required' | 'public' };
export type SubscriberDef<D extends EventDef = EventDef> = SubscriberSpec<D> & { readonly kind: 'subscriber'; readonly types: readonly string[] };

// Definitions are stored type-erased in the registry (handlers are declared as methods, so their
// parameters are bivariant); each handler keeps its precise types where it is defined.
export type AnyCommand = CommandDef<z.ZodType, unknown>;
export type AnyQuery = QueryDef<z.ZodType, unknown>;
export type AnySubscriber = SubscriberDef<EventDef>;
export type AnyDefinition = AnyCommand | AnyQuery | AnySubscriber;

const OP_RE = EVENT_TYPE_RE;
const MODULE_RE = /^F\d\d(\.S\d\d(\.M\d\d)?)?$/;
const CONSUMER_RE = /^[a-z0-9]+(\.[a-z0-9_]+)+$/;

function checkOperation(kind: string, name: string, module: string, capability: string): void {
  if (!OP_RE.test(name)) throw new Error(`${kind} ${name}: name must be <slug>.<entity>.<verb>`);
  if (!OP_RE.test(capability)) throw new Error(`${kind} ${name}: capability ${capability} must be <slug>.<resource>.<action>`);
  if (!MODULE_RE.test(module)) throw new Error(`${kind} ${name}: module ${module} must be a module ID like F01.S04.M01`);
}

export function defineCommand<I extends z.ZodType, O>(spec: CommandSpec<I, O>): CommandDef<I, O> {
  checkOperation('command', spec.name, spec.module, spec.capability);
  return Object.freeze({ ...spec, kind: 'command' as const, surface: spec.surface ?? 'vault', auth: spec.auth ?? 'required' });
}

export function defineQuery<I extends z.ZodType, O>(spec: QuerySpec<I, O>): QueryDef<I, O> {
  checkOperation('query', spec.name, spec.module, spec.capability);
  return Object.freeze({ ...spec, kind: 'query' as const, surface: spec.surface ?? 'vault', auth: spec.auth ?? 'required' });
}

export function defineSubscriber<D extends EventDef>(spec: SubscriberSpec<D>): SubscriberDef<D> {
  if (!CONSUMER_RE.test(spec.name)) throw new Error(`subscriber ${spec.name}: name must be <slug>.<consumer>`);
  if (!MODULE_RE.test(spec.module)) throw new Error(`subscriber ${spec.name}: module ${spec.module}`);
  if (spec.events.length === 0) throw new Error(`subscriber ${spec.name}: events required`);
  return Object.freeze({ ...spec, kind: 'subscriber' as const, types: spec.events.map((e) => e.type) });
}

export interface Registry {
  add(...defs: readonly AnyDefinition[]): Registry;
  command(name: string): AnyCommand | undefined;
  query(name: string): AnyQuery | undefined;
  subscriber(name: string): AnySubscriber | undefined;
  commands(): readonly AnyCommand[];
  queries(): readonly AnyQuery[];
  subscribers(): readonly AnySubscriber[];
}

/** One registry per composition root; duplicate names are rejected at startup. */
export function createRegistry(): Registry {
  const commands = new Map<string, AnyCommand>();
  const queries = new Map<string, AnyQuery>();
  const subscribers = new Map<string, AnySubscriber>();
  const addOne = (d: AnyDefinition): void => {
    const map: Map<string, AnyDefinition> = d.kind === 'command' ? commands : d.kind === 'query' ? queries : subscribers;
    if (map.has(d.name) || (d.kind !== 'subscriber' && (commands.has(d.name) || queries.has(d.name)))) throw new Error(`duplicate ${d.kind} ${d.name}`);
    map.set(d.name, d);
  };
  const registry: Registry = {
    add: (...defs) => {
      for (const d of defs) addOne(d);
      return registry;
    },
    command: (n) => commands.get(n),
    query: (n) => queries.get(n),
    subscriber: (n) => subscribers.get(n),
    commands: () => [...commands.values()],
    queries: () => [...queries.values()],
    subscribers: () => [...subscribers.values()],
  };
  return registry;
}
