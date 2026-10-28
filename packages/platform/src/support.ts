/** Small helpers shared by the platform services: event construction, op helpers and common schemas. */
import type { CommandContext, Deps, EventInput, Operation, Permission } from '@classrup/kernel';
import { parse, z } from '@classrup/kernel';

export type PlatformDeps = Deps;

/** Build an event input for the `platform` area. Payloads carry ids and non-sensitive data only. */
export function platformEvent<P>(type: string, aggregateType: string, aggregateId: string, revision: number, payload: P): EventInput<P> {
  return { type, aggregateType, aggregateId, revision, payload };
}

export const expectedVersionSchema = z.number().int().nonnegative().optional();

export const tenantIdSchema = z.string().regex(/^tnt_[A-Za-z0-9]{2,40}$/, 'expected tenant id');

export const reasonSchema = z.string().trim().min(3).max(500);

export const authorize = (deps: Deps, ctx: CommandContext, permission: Permission, resource?: Parameters<Deps['authz']['authorize']>[2]): void =>
  deps.authz.authorize(ctx.actor, permission, resource);

type Handler<S extends z.ZodType> = (ctx: CommandContext, input: z.output<S>) => unknown;

/** Operation whose handler receives schema-validated input. */
export function operation<S extends z.ZodType>(
  spec: { name: string; kind: Operation['kind']; flag: string; summary: string; public?: boolean },
  schema: S,
  handler: Handler<S>,
): Operation {
  return { ...spec, handler: (ctx, input) => handler(ctx, parse(schema, input)) };
}

export const sortBy = <T>(items: readonly T[], key: (item: T) => string | number): T[] =>
  [...items].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
