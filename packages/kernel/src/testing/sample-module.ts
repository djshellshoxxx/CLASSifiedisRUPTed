// Sample module used by kernel tests (bus, HTTP, outbox): one record type, commands, a query and an event.
import * as z from 'zod';
import { appError, AppErrorException } from '../errors/app-error.ts';
import { err, ok } from '../errors/result.ts';
import { defineEvent } from '../events/envelope.ts';
import { defineRepo } from '../storage/repo.ts';
import { defineCommand, defineQuery, defineSubscriber } from '../bus/define.ts';
import { uuidv7 } from '../validation/schemas.ts';

export const SAMPLE_MODULE = 'F99.S01.M01';
export const itemRepo = defineRepo({ type: 'sample.item', schema: z.strictObject({ name: z.string(), owner: z.string() }), indexes: { owner: (d) => d.owner } });
export const itemCreated = defineEvent('sample.item.created', 1, 'P1', z.strictObject({ itemId: z.string(), name: z.string() }));
export const itemRenamed = defineEvent('sample.item.renamed', 1, 'P1', z.strictObject({ itemId: z.string(), name: z.string() }));

export interface SampleCounters {
  create: number;
  consumed: string[];
  failConsumer: number;
}

export function sampleDefinitions(counters: SampleCounters = { create: 0, consumed: [], failConsumer: 0 }) {
  const create = defineCommand({
    name: 'sample.item.create',
    module: SAMPLE_MODULE,
    capability: 'sample.item.create',
    input: z.strictObject({ itemId: uuidv7(), name: z.string().min(1).max(40) }),
    output: z.strictObject({ itemId: z.string(), revision: z.int() }),
    idempotent: true,
    surface: 'both',
    successStatus: 201,
    handler: (ctx, input) => {
      counters.create += 1;
      const owner = ctx.actor.kind === 'anonymous' ? 'anonymous' : ctx.actor.id;
      const r = ctx.tx.repo(itemRepo).put(input.itemId, { name: input.name, owner }, { expectedRevision: 0 });
      if (!r.ok) return r;
      ctx.emit(itemCreated, { aggregate: { type: 'item', id: input.itemId }, revision: 1, payload: { itemId: input.itemId, name: input.name } });
      return ok({ itemId: input.itemId, revision: r.value.revision });
    },
  });
  const rename = defineCommand({
    name: 'sample.item.rename',
    module: SAMPLE_MODULE,
    capability: 'sample.item.rename',
    input: z.strictObject({ itemId: uuidv7(), name: z.string().min(1), expectedRevision: z.int().min(1) }),
    idempotent: true,
    hideForbidden: true,
    resource: (i) => ({ type: 'item', id: i.itemId }),
    handler: (ctx, input) => {
      const repo = ctx.tx.repo(itemRepo);
      const cur = repo.require(input.itemId);
      if (!cur.ok) return cur;
      const r = repo.put(input.itemId, { ...cur.value.data, name: input.name }, { expectedRevision: input.expectedRevision });
      if (!r.ok) return r;
      ctx.emit(itemRenamed, { aggregate: { type: 'item', id: input.itemId }, revision: r.value.revision, payload: { itemId: input.itemId, name: input.name } });
      return ok({ itemId: input.itemId, revision: r.value.revision });
    },
  });
  const failing = defineCommand({
    name: 'sample.item.fail',
    module: SAMPLE_MODULE,
    capability: 'sample.item.create',
    input: z.strictObject({ itemId: uuidv7(), mode: z.enum(['err', 'throw', 'busy', 'sync']) }),
    idempotent: true,
    handler: (ctx, input) => {
      ctx.tx.repo(itemRepo).put(input.itemId, { name: 'doomed', owner: 'x' }, { expectedRevision: 0 });
      ctx.emit(itemCreated, { aggregate: { type: 'item', id: input.itemId }, revision: 1, payload: { itemId: input.itemId, name: 'doomed' } });
      if (input.mode === 'throw') throw new Error('handler exploded: secret detail');
      if (input.mode === 'busy') throw new AppErrorException(appError('DEPENDENCY_UNAVAILABLE'));
      if (input.mode === 'sync') ctx.tx.sync.enqueue('relay:a', { cid: 'sha256-x', type: 'classrup.sample.statement/v1' });
      return err(appError('CONFLICT_STATE', { params: { state: 'doomed' } }));
    },
  });
  const publish = defineCommand({
    name: 'sample.item.publish',
    module: SAMPLE_MODULE,
    capability: 'sample.item.publish',
    input: z.strictObject({ itemId: uuidv7(), destination: z.string() }),
    idempotent: true,
    deliveryEligible: true,
    handler: (ctx, input) => {
      const e = ctx.tx.sync.enqueue(input.destination, { cid: `sha256-${input.itemId}`, type: 'classrup.sample.item/v1', payload: { itemId: input.itemId } });
      return ok({ syncId: e.id, state: e.state });
    },
  });
  const ping = defineCommand({ name: 'sample.relay.ping', module: SAMPLE_MODULE, capability: 'sample.relay.ping', input: z.strictObject({}), idempotent: false, surface: 'relay', auth: 'public', handler: () => ok({ pong: true }) });
  const get = defineQuery({
    name: 'sample.item.get',
    module: SAMPLE_MODULE,
    capability: 'sample.item.read',
    input: z.strictObject({ itemId: uuidv7() }),
    surface: 'both',
    handler: (ctx, input) => {
      const r = ctx.tx.repo(itemRepo).require(input.itemId);
      return r.ok ? ok({ itemId: r.value.id, name: r.value.data.name, revision: r.value.revision }) : r;
    },
  });
  const consumer = defineSubscriber({
    name: 'sample.item_projection',
    module: SAMPLE_MODULE,
    events: [itemCreated, itemRenamed],
    handler: (_ctx, env) => {
      if (counters.failConsumer > 0) {
        counters.failConsumer -= 1;
        return err(appError('DEPENDENCY_UNAVAILABLE'));
      }
      counters.consumed.push(`${env.type}:${env.aggregate.id}:${env.revision}`);
      return ok(undefined);
    },
  });
  return { create, rename, failing, publish, ping, get, consumer, all: [create, rename, failing, publish, ping, get, consumer] as const };
}
