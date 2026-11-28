# F15.S03 — 03_operations

**Status:** SPECIFIED. **Parent:** [F15](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F15.S03.M01 | [Observability](mod_observability/SPEC.md) | SPECIFIED | Structured logger with redaction, metrics registry and /metrics, health endpoints (CTR-OBS-001). |
| F15.S03.M02 | [Backups](mod_backups/SPEC.md) | SPECIFIED | Scheduled SQLite online backups, encryption, retention rotation, restore verification command. |
| F15.S03.M03 | [Disaster recovery](mod_recovery/SPEC.md) | SPECIFIED | Restore runbook and tooling, RPO 6 h/RTO 4 h targets, event replay from outbox archive, dead-letter replay. |

## Aggregation

Modules in this subfeature share the feature package `packages/platform` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| platform.backup.completed | F15.S03.M02 | F15.S03.M03 | internal |
| platform.backup.failed | F15.S03.M02 | F15.S03.M03 | internal |
