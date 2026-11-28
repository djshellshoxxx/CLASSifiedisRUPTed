# F16.S01 — 01_authz

**Status:** SPECIFIED. **Parent:** [F16](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F16.S01.M01 | [Authorization policy](mod_authorization/SPEC.md) | SPECIFIED | authorize() policy engine, role assignments, relationship predicates, audit log (CTR-CAP-001). |
| F16.S01.M02 | [Secrets handling](mod_secrets/SPEC.md) | SPECIFIED | Server secrets from env/files only, never logged; token hashing; constant-time compare; secret scanning in CI. |

## Aggregation

Modules in this subfeature share the feature package `packages/security` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| identity.session.revoked | F07.S01.M02 | F16.S01.M01 | external |
| identity.portable_doc.published | F07.S02.M01 | F16.S01.M01 | external |
| moderation.action.applied | F12.S02.M01 | F16.S01.M01 | external |
| moderation.action.reverted | F12.S02.M01 | F16.S01.M01 | external |
| privacy.legal_hold.placed | F10.S01.M02 | F16.S01.M01 | external |
| privacy.legal_hold.released | F10.S01.M02 | F16.S01.M01 | external |
