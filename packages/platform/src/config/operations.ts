/** Operations for F15.S04: flags (M02), module registry (M01) and tenants (M03). */
import type { CommandContext, Deps, Operation } from '@classrup/kernel';
import { runCommand, schemas, z } from '@classrup/kernel';
import { PERM } from '../policies';
import { authorize, expectedVersionSchema, operation, platformEvent, reasonSchema, tenantIdSchema } from '../support';
import type { FlagService, FlagState } from './flags';
import type { ModuleRegistry } from './registry';
import type { TenantRecord, TenantService } from './tenants';

const FLAG = 'platform.configuration';
const flagKey = z.string().regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/);

export interface ConfigServices {
  readonly flags: FlagService;
  readonly modules: ModuleRegistry;
  readonly tenants: TenantService;
}

const tenantRef = (id: string): { type: string; id: string } => ({ type: 'tenant', id });

export function flagStateDto(s: FlagState): Record<string, unknown> {
  return {
    key: s.key,
    killed: s.killed,
    ...(s.killReason !== undefined ? { killReason: s.killReason } : {}),
    overrides: { ...s.overrides },
    version: s.version,
    updatedAt: s.updatedAt,
  };
}

export function tenantDto(t: TenantRecord): Record<string, unknown> {
  return {
    id: t.id,
    name: t.name,
    status: t.status,
    defaultCurrency: t.defaultCurrency,
    defaultLocale: t.defaultLocale,
    jurisdiction: t.jurisdiction,
    limits: { ...t.limits },
    operatorAccountId: t.operatorAccountId,
    ...(t.suspendedReason !== undefined ? { suspendedReason: t.suspendedReason } : {}),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    version: t.version,
  };
}

const tenantFields = {
  name: schemas.text(2, 80),
  defaultCurrency: schemas.currency(),
  defaultLocale: z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8}){0,3}$/),
  jurisdiction: z.string().regex(/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/),
  limits: z
    .record(z.string().regex(/^[a-z][a-z0-9_.]{0,63}$/), z.number().int().nonnegative().max(1_000_000_000))
    .refine((o) => Object.keys(o).length <= 50, 'at most 50 limits'),
  operatorAccountId: schemas.id('acct'),
};

const flagListSchema = z.strictObject({ tenantId: tenantIdSchema.optional() });
const overrideSchema = z.strictObject({ key: flagKey, tenantId: tenantIdSchema, enabled: z.boolean(), expectedVersion: expectedVersionSchema });
const clearSchema = z.strictObject({ key: flagKey, tenantId: tenantIdSchema, expectedVersion: expectedVersionSchema });
const killSchema = z.strictObject({ key: flagKey, engaged: z.boolean(), reason: reasonSchema, expectedVersion: expectedVersionSchema });
const tenantCreateSchema = z.strictObject({ id: tenantIdSchema.optional(), ...tenantFields });
const tenantUpdateSchema = z.strictObject({
  id: tenantIdSchema,
  expectedVersion: z.number().int().nonnegative(),
  name: tenantFields.name.optional(),
  defaultCurrency: tenantFields.defaultCurrency.optional(),
  defaultLocale: tenantFields.defaultLocale.optional(),
  jurisdiction: tenantFields.jurisdiction.optional(),
  limits: tenantFields.limits.optional(),
  operatorAccountId: tenantFields.operatorAccountId.optional(),
});
const tenantSuspendSchema = z.strictObject({ id: tenantIdSchema, reason: reasonSchema, expectedVersion: z.number().int().nonnegative() });
const tenantReactivateSchema = z.strictObject({ id: tenantIdSchema, expectedVersion: z.number().int().nonnegative() });
const tenantGetSchema = z.strictObject({ id: tenantIdSchema });
const emptySchema = z.strictObject({});

export function configOperations(deps: Deps, svc: ConfigServices): readonly Operation[] {
  const { flags, modules, tenants } = svc;
  const command = <R>(ctx: CommandContext, name: string, request: unknown, handler: Parameters<typeof runCommand<R>>[3]): R =>
    runCommand(deps, ctx, { name, flag: FLAG, request }, handler);

  return [
    operation({ name: 'platform.flag.list', kind: 'query', flag: FLAG, summary: 'Effective flag state for a tenant' }, flagListSchema, (ctx, input) => {
      const tenantId = input.tenantId ?? ctx.actor.tenantId;
      authorize(deps, ctx, PERM.flagRead, tenantRef(tenantId));
      return flags.definitions().map((d) => {
        const decision = flags.decide(d.key, tenantId);
        const state = flags.state(d.key);
        return {
          key: d.key,
          description: d.description,
          default: d.default,
          dependsOn: [...d.dependsOn],
          killSwitch: d.killSwitch,
          enabled: decision.enabled,
          reason: decision.reason,
          ...(decision.via !== undefined ? { via: decision.via } : {}),
          killed: state?.killed ?? false,
          ...(state?.overrides[tenantId] !== undefined ? { override: state.overrides[tenantId] } : {}),
          version: state?.version ?? 0,
        };
      });
    }),

    operation({ name: 'platform.flag.set_override', kind: 'command', flag: FLAG, summary: 'Set a per-tenant flag override' }, overrideSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.flagOverride, tenantRef(input.tenantId));
      return command(ctx, 'platform.flag.set_override', input, () => {
        const state = flags.setOverride(input.key, input.tenantId, input.enabled, deps.clock.now(), input.expectedVersion);
        const payload = { key: input.key, tenantId: input.tenantId, enabled: input.enabled };
        return { result: flagStateDto(state), events: [platformEvent('platform.flag.override_set', 'flag', input.key, state.version, payload)] };
      });
    }),

    operation({ name: 'platform.flag.clear_override', kind: 'command', flag: FLAG, summary: 'Remove a per-tenant flag override' }, clearSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.flagOverride, tenantRef(input.tenantId));
      return command(ctx, 'platform.flag.clear_override', input, () => {
        const state = flags.clearOverride(input.key, input.tenantId, deps.clock.now(), input.expectedVersion);
        const payload = { key: input.key, tenantId: input.tenantId };
        return { result: flagStateDto(state), events: [platformEvent('platform.flag.override_cleared', 'flag', input.key, state.version, payload)] };
      });
    }),

    operation({ name: 'platform.flag.set_kill', kind: 'command', flag: FLAG, summary: 'Engage or release a runtime kill switch' }, killSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.flagKill);
      return command(ctx, 'platform.flag.set_kill', input, () => {
        const state = flags.setKilled(input.key, input.engaged, input.reason, deps.clock.now(), input.expectedVersion);
        const type = input.engaged ? 'platform.flag.kill_engaged' : 'platform.flag.kill_released';
        return { result: flagStateDto(state), events: [platformEvent(type, 'flag', input.key, state.version, { key: input.key })] };
      });
    }),

    operation({ name: 'platform.module.list', kind: 'query', flag: FLAG, summary: 'Modules and their enabled state', public: true }, emptySchema, (ctx) => {
      authorize(deps, ctx, PERM.moduleList);
      return modules.listPublic(ctx.actor.tenantId);
    }),

    operation({ name: 'platform.module.report', kind: 'query', flag: FLAG, summary: 'Module registry and flag dependency report' }, emptySchema, (ctx) => {
      authorize(deps, ctx, PERM.moduleReport);
      return { modules: modules.list(ctx.actor.tenantId), dependencies: modules.dependencyReport() };
    }),

    operation({ name: 'platform.tenant.create', kind: 'command', flag: FLAG, summary: 'Create a tenant' }, tenantCreateSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.tenantCreate);
      return command(ctx, 'platform.tenant.create', input, () => {
        const { id, ...config } = input;
        const tenant = tenants.create(id ?? deps.ids.next('tnt'), config, deps.clock.now());
        return { result: tenantDto(tenant), events: [platformEvent('platform.tenant.created', 'tenant', tenant.id, tenant.version, { tenantId: tenant.id })] };
      });
    }),

    operation({ name: 'platform.tenant.update', kind: 'command', flag: FLAG, summary: 'Update tenant configuration' }, tenantUpdateSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.tenantUpdate);
      return command(ctx, 'platform.tenant.update', input, () => {
        const { id, expectedVersion, ...patch } = input;
        const tenant = tenants.update(id, patch, deps.clock.now(), expectedVersion);
        const payload = { tenantId: id, changed: Object.keys(patch).sort() };
        return { result: tenantDto(tenant), events: [platformEvent('platform.tenant.updated', 'tenant', id, tenant.version, payload)] };
      });
    }),

    operation({ name: 'platform.tenant.suspend', kind: 'command', flag: FLAG, summary: 'Suspend a tenant' }, tenantSuspendSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.tenantSuspend);
      return command(ctx, 'platform.tenant.suspend', input, () => {
        const tenant = tenants.suspend(input.id, input.reason, deps.clock.now(), input.expectedVersion);
        return { result: tenantDto(tenant), events: [platformEvent('platform.tenant.suspended', 'tenant', input.id, tenant.version, { tenantId: input.id })] };
      });
    }),

    operation({ name: 'platform.tenant.reactivate', kind: 'command', flag: FLAG, summary: 'Reactivate a suspended tenant' }, tenantReactivateSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.tenantSuspend);
      return command(ctx, 'platform.tenant.reactivate', input, () => {
        const tenant = tenants.reactivate(input.id, deps.clock.now(), input.expectedVersion);
        return { result: tenantDto(tenant), events: [platformEvent('platform.tenant.reactivated', 'tenant', input.id, tenant.version, { tenantId: input.id })] };
      });
    }),

    operation({ name: 'platform.tenant.get', kind: 'query', flag: FLAG, summary: 'Read tenant configuration' }, tenantGetSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.tenantRead, tenantRef(input.id));
      return tenantDto(tenants.require(input.id));
    }),

    operation({ name: 'platform.tenant.list', kind: 'query', flag: FLAG, summary: 'List tenants (operators)' }, emptySchema, (ctx) => {
      authorize(deps, ctx, PERM.tenantRead);
      return tenants.list().map(tenantDto);
    }),
  ];
}
