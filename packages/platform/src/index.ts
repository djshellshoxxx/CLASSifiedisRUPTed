/**
 * @classrup/platform: F15 platform operations (PWA support, observability, backups, recovery,
 * configuration) and F16.S03 assurance (threat register, incidents, response playbooks).
 *
 * Wiring (apps/relay):
 *  - Build `new FlagService(store)` and `new MetricsRegistry()` first and install them as `deps.flags` / `deps.metrics`,
 *    then pass the same instances as `ports.flags` / `ports.metrics`.
 *  - `platform.registerModules('<package>', MODULES)` for every other package (or `ports.moduleSources`).
 *  - Schedule system sweepers: `platform.incident.escalate_due`, `platform.backup.purge_due`; schedule
 *    `platform.backup.create` from a system actor.
 *  - Call `platform.assertTenantActive(tenantId)` for tenants that must be refused when suspended.
 * Browser-only pieces (OfflineQueue, cache policy, install state machine) are exported for the PWA directly.
 */
import type { DataStore, ModuleDescriptor, Operation } from '@classrup/kernel';
import { defineOperations } from '@classrup/kernel';
import { configOperations } from './config/operations';
import { FlagService } from './config/flags';
import { ModuleRegistry } from './config/registry';
import { TenantService } from './config/tenants';
import { incidentOperations } from './assurance/incident-ops';
import { threatOperations } from './assurance/threat-ops';
import { MODULES } from './modules';
import { backupOperations } from './ops/backup-service';
import type { BackupSnapshot, RestoreSummary } from './ops/backups';
import { backupSignerId, isSnapshotSource, parseBackup, restoreBackup } from './ops/backups';
import { drillOperations } from './ops/drills';
import { HealthRegistry } from './ops/health';
import { observabilityOperations } from './ops/observability-ops';
import type { ProjectionRebuild, ReplayHandler, ReplayResult } from './ops/recovery';
import { redeliverOutbox, rebuildProjection, replayEvents, StoreCheckpointStore } from './ops/recovery';
import type { SloTracker } from './ops/slo';
import { pwaOperations } from './pwa/operations';
import { MemoryBackupStore } from './ports';
import type { PlatformPorts } from './ports';
import type { PlatformDeps } from './support';

export { POLICIES, PERM } from './policies';
export { MODULES } from './modules';
export type { PlatformPorts, BackupStore } from './ports';
export { MemoryBackupStore } from './ports';
export * from './config/catalog';
export * from './config/flags';
export * from './config/registry';
export * from './config/tenants';
export * from './ops/logger';
export * from './ops/metrics';
export * from './ops/health';
export * from './ops/slo';
export * from './ops/backups';
export * from './ops/recovery';
export * from './ops/runbooks';
export { DRILL_INTERVAL_MS, DRILL_TRANSITIONS } from './ops/drills';
export * from './pwa/offline';
export * from './pwa/cache';
export * from './pwa/install';
export * from './assurance/threats';
export * from './assurance/playbooks';
export * from './assurance/incidents';

export interface Platform {
  readonly operations: readonly Operation[];
  readonly flags: FlagService;
  readonly modules: ModuleRegistry;
  readonly tenants: TenantService;
  readonly health: HealthRegistry;
  /** Register a package's ModuleDescriptor list (validated against the flag catalog and ownership rules). */
  registerModules(source: string, modules: readonly ModuleDescriptor[]): void;
  /** Throws TENANT.NOT_FOUND / TENANT.SUSPENDED; returns the tenant configuration otherwise. */
  assertTenantActive: TenantService['assertTenantActive'];
  /** Track an SLO in `platform.health.report`. */
  addSlo(tracker: SloTracker): void;
  readonly backups: {
    /** Parse, verify against the operator key and restore into an empty store. Not an operation: it replaces a store, it does not write to a live one. */
    restore(target: DataStore, snapshot: string | BackupSnapshot): RestoreSummary;
  };
  readonly recovery: {
    replay(name: string, handler: ReplayHandler): ReplayResult;
    rebuild(projection: ProjectionRebuild): ReplayResult;
    redeliver(name: string, send: ReplayHandler): ReplayResult;
  };
}

/** Cache build id for the service worker; the PWA build overrides it per deploy. */
const DEFAULT_CACHE_VERSION = '1';

export function createPlatform(deps: PlatformDeps, ports: PlatformPorts = {}): Platform {
  const flags = ports.flags ?? new FlagService(deps.store);
  const modules = new ModuleRegistry(flags);
  const tenants = new TenantService(deps.store);
  const health = ports.health ?? new HealthRegistry(deps.clock);
  const slos: SloTracker[] = [];
  const checkpoints = new StoreCheckpointStore(deps.store);
  const source = ports.snapshotSource ?? (isSnapshotSource(deps.store) ? deps.store : undefined);

  modules.register('platform', MODULES);
  for (const [name, descriptors] of Object.entries(ports.moduleSources ?? {})) modules.register(name, descriptors);

  const operations = defineOperations([
    ...configOperations(deps, { flags, modules, tenants }),
    ...observabilityOperations(deps, { health, slos, ...(ports.metrics ? { metrics: ports.metrics } : {}) }),
    ...backupOperations(deps, {
      store: ports.backupStore ?? new MemoryBackupStore(),
      ...(source ? { source } : {}),
      ...(ports.operatorKey ? { key: ports.operatorKey } : {}),
      ...(ports.retention ? { retention: ports.retention } : {}),
    }),
    ...drillOperations(deps),
    ...pwaOperations(deps, { tenants, cacheVersion: ports.cacheVersion ?? DEFAULT_CACHE_VERSION }),
    ...threatOperations(deps),
    ...incidentOperations(deps),
  ]);

  return {
    operations,
    flags,
    modules,
    tenants,
    health,
    registerModules: (name, descriptors) => modules.register(name, descriptors),
    assertTenantActive: (tenantId) => tenants.assertTenantActive(tenantId),
    addSlo: (tracker) => {
      slos.push(tracker);
    },
    backups: {
      restore(target, snapshot) {
        if (!ports.operatorKey) throw new TypeError('restore requires ports.operatorKey to verify the backup signer');
        const parsed = typeof snapshot === 'string' ? parseBackup(snapshot) : snapshot;
        const summary = restoreBackup(target, parsed, backupSignerId(ports.operatorKey));
        if (target === deps.store) flags.invalidate();
        return summary;
      },
    },
    recovery: {
      replay: (name, handler) => replayEvents(deps.store.events, handler, checkpoints, { name }),
      rebuild: (projection) => rebuildProjection(deps.store.events, projection, checkpoints),
      redeliver: (name, send) => redeliverOutbox(deps.store.events, send, checkpoints, name),
    },
  };
}
