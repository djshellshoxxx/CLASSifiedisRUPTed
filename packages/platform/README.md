# @classrup/platform

F15 Platform operations (PWA support, observability, backups, recovery, configuration) and F16.S03 assurance
(threat register, incidents, response playbooks). Browser-safe: no `node:` imports. Area/permission/event prefix: `platform`.

```ts
const flags = new FlagService(store);                 // install as deps.flags
const metrics = new MetricsRegistry();                // install as deps.metrics
const platform = createPlatform(deps, { flags, metrics, operatorKey, backupStore, moduleSources });
platform.operations   // mount at POST /v1/ops/<name>
```

## Module map

| Module | Code | What it does |
|---|---|---|
| F15.S01.M01 offline | `src/pwa/offline.ts` | `OfflineQueue` (ADR-0009): per-aggregate FIFO, stable idempotency keys, backoff + full jitter, 8 attempts, conflicts surfaced |
| F15.S01.M02 cache | `src/pwa/cache.ts` | cache rules, `resolveCachePolicy`, `isCacheableResponse`, versioned cache names, purge lists |
| F15.S01.M03 install | `src/pwa/install.ts` | manifest builder/validator, install-prompt state machine (14 day cooldown) |
| F15.S03.M01 observability | `src/ops/{logger,metrics,health,slo}.ts` | `JsonLogger`, `MetricsRegistry` (+Prometheus text), `HealthRegistry`, `errorBudget`/`SloTracker` |
| F15.S03.M02 backups | `src/ops/backups.ts`, `backup-service.ts` | signed snapshot v1, verify, `restoreBackup` into an empty store, GFS retention |
| F15.S03.M03 recovery | `src/ops/{recovery,runbooks,drills}.ts` | checkpointed `replayEvents`, `rebuildProjection`, `redeliverOutbox`, DR runbooks, drill tracking |
| F15.S04.M01 feature | `src/config/registry.ts` | `ModuleRegistry`: unique ids, flag validation, single owner per event/collection, dependency report |
| F15.S04.M02 flags | `src/config/{flags,catalog}.ts` | `FlagService` (kernel `FeatureFlags`), `DEFAULT_FLAGS` |
| F15.S04.M03 tenants | `src/config/tenants.ts` | `TenantService`, `assertTenantActive`, limits |
| F16.S03.M01 threats | `src/assurance/{threats,threat-ops}.ts` | 37 STRIDE entries, reviews |
| F16.S03.M02 incident | `src/assurance/{incidents,incident-ops}.ts` | lifecycle, SEV1-4 targets, SLA sweeper |
| F16.S03.M03 response | `src/assurance/playbooks.ts` | four playbooks, tracked execution |

## Operations

Commands take `Idempotency-Key`. `public` = anonymous allowed. Flag column is the gating flag.

| Operation | Kind | Permission | Flag |
|---|---|---|---|
| `platform.flag.list` | query | `platform.flag:read` | configuration |
| `platform.flag.set_override` / `clear_override` | command | `platform.flag:override` | configuration |
| `platform.flag.set_kill` | command | `platform.flag:kill` (operator) | configuration |
| `platform.module.list` | query, public | `platform.module:list` | configuration |
| `platform.module.report` | query | `platform.module:report` | configuration |
| `platform.tenant.create` | command | `platform.tenant:create` (operator) | configuration |
| `platform.tenant.update` | command | `platform.tenant:update` (operator) | configuration |
| `platform.tenant.suspend` / `reactivate` | command | `platform.tenant:suspend` (operator) | configuration |
| `platform.tenant.get` / `list` | query | `platform.tenant:read` | configuration |
| `platform.health.check` | query, public | `platform.health:check` | operations |
| `platform.health.report` | query | `platform.health:report` | operations |
| `platform.metrics.export` | query | `platform.metrics:export` | operations |
| `platform.backup.create` | command | `platform.backup:create` | operations |
| `platform.backup.verify` | command | `platform.backup:verify` | operations |
| `platform.backup.purge_due` | command (sweeper) | `platform.backup:prune` | operations |
| `platform.backup.list` | query | `platform.backup:read` | operations |
| `platform.runbook.list` | query | `platform.runbook:read` | operations |
| `platform.drill.schedule` / `start` / `complete_step` / `finish` / `abort` | command | `platform.drill:manage` | operations |
| `platform.drill.get` / `status` | query | `platform.drill:read` | operations |
| `platform.pwa.manifest` | query, public | `platform.pwa:manifest` | pwa |
| `platform.pwa.cache_policy` | query, public | `platform.pwa:cache_policy` | pwa |
| `platform.threat.list` | query | `platform.threat:read` | assurance |
| `platform.threat.review` | command | `platform.threat:review` | assurance |
| `platform.incident.report` | command | `platform.incident:report` | assurance |
| `platform.incident.advance` | command | `platform.incident:triage` (to triaged/dismissed) or `:manage` | assurance |
| `platform.incident.set_severity` | command | `platform.incident:triage` | assurance |
| `platform.incident.add_note` | command | `platform.incident:annotate` | assurance |
| `platform.incident.get` / `list` | query | `platform.incident:read` | assurance |
| `platform.incident.escalate_due` | command (sweeper) | `platform.incident:sweep` (system) | assurance |
| `platform.playbook.list` | query | `platform.playbook:read` | assurance |
| `platform.incident.start_playbook` / `complete_step` | command | `platform.incident:manage` | assurance |

Flags: `platform.pwa`, `platform.operations`, `platform.configuration` (protected: cannot be disabled), `platform.assurance`.

## Events and collections

Events: `platform.flag.{override_set,override_cleared,kill_engaged,kill_released}`, `platform.tenant.{created,updated,suspended,reactivated}`,
`platform.backup.{created,verified,pruned}`, `platform.drill.{scheduled,started,step_completed,completed,aborted}`,
`platform.threat.reviewed`, `platform.incident.{reported,status_changed,severity_changed,note_added,sla_breached,playbook_started,playbook_step_completed,playbook_completed}`.
Payloads hold ids and enum values only; incident notes and summaries never appear in events.

Collections: `platform_flags`, `platform_tenants`, `platform_backups`, `platform_drills`, `platform_checkpoints`, `platform_threat_reviews`, `platform_incidents`.
ID prefixes used: `bkp`, `inc`, `thm` (threat reviews), `rbook` (drill records), `oq` (offline queue items), `tnt` (generated tenant ids).

## Ports

Provided: `FlagService` implements kernel `FeatureFlags`; `MetricsRegistry` implements `Metrics`; `JsonLogger` implements `Logger`;
`TenantService` implements `TenantLookup` (`get(tenantId)` incl. `operatorAccountId`, `limits`).
Consumed (all optional, `PlatformPorts`): `flags`, `metrics`, `health`, `moduleSources`, `backupStore`, `snapshotSource`
(default: `deps.store` when it has `exportSnapshot`), `operatorKey`, `retention`, `cacheVersion`.

## Relay wiring

- Register every package: `platform.registerModules('bazaar', BAZAAR_MODULES)` (or `moduleSources`). Unknown flags throw; reconcile names against `DEFAULT_FLAGS` or `flags.define(...)`.
- Schedule `platform.incident.escalate_due` and `platform.backup.purge_due` (both match the scheduler's sweeper suffixes) and `platform.backup.create` from a system actor.
- Use `platform.assertTenantActive(tenantId)` where suspended tenants must be refused.
- Feed `SloTracker`s via `platform.addSlo`, register `HealthRegistry` checks, expose `platform.metrics.export`.
- The PWA imports `OfflineQueue`, cache and install helpers directly and supplies an IndexedDB `QueueStorage`.

## Limits

- Backups contain private records and are not encrypted by this package: the `BackupStore` must encrypt at rest. Tenant-scoped backups include only records carrying a `tenantId` property. Idempotency records are not backed up.
- Restore replays record versions one put at a time (the store only exposes `expectedVersion + 1`), so cost is proportional to the sum of versions.
- Replay and outbox redelivery are synchronous like the store; asynchronous peer delivery needs its own driver around the checkpoint store.
- Health checks are synchronous; a slow check is reported as failed after it returns, it is not interrupted.
- Flag evaluation inside a transaction that also changes flags may observe uncommitted state; commands never do this.
- The threat register statuses are assertions to re-verify during integration; entries reference other packages at directory level.
