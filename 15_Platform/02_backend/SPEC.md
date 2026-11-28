# F15.S02 — 02_backend

**Status:** SPECIFIED. **Parent:** [F15](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F15.S02.M01 | [Relay service](mod_relays/SPEC.md) | SPECIFIED | Relay process: HTTP server, relay Ed25519 identity, configuration loading from env, graceful shutdown, outbox dispatcher. |
| F15.S02.M02 | [API and command bus](mod_api/SPEC.md) | SPECIFIED | Command/query registry, HTTP mapping, validation, authz, flags, rate limits, idempotency, audit, error mapping (CTR-ERR/IDM/EVT). |
| F15.S02.M03 | [Storage](mod_storage/SPEC.md) | SPECIFIED | Repository port with optimistic concurrency, SQLite adapter (node:sqlite, WAL), in-memory adapter for tests, migrations (CTR-SCH-001). |

## Aggregation

Modules in this subfeature share the feature package `packages/platform` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

_None._
