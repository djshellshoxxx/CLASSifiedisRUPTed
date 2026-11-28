# F16.S03 — 03_assurance

**Status:** SPECIFIED. **Parent:** [F16](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F16.S03.M01 | [Security threat model](mod_threats/SPEC.md) | SPECIFIED | STRIDE threat model per trust boundary with controls and tests; review cadence per release. |
| F16.S03.M02 | [Incident records](mod_incident/SPEC.md) | SPECIFIED | Incident detection hooks (auth anomaly, key compromise reports), severity matrix, incident records. |
| F16.S03.M03 | [Incident response](mod_response/SPEC.md) | SPECIFIED | Runbooks: key compromise, relay breach, data leak notification, containment switches (relay-wide read-only mode; relay-local federation kill switch gating relay-to-relay traffic only), postmortem template. |

## Aggregation

Modules in this subfeature share the feature package `packages/security` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| platform.relay_identity.rotated | F15.S02.M01 | F16.S03.M02 | external |
| security.key.revoked | F16.S02.M02 | F16.S03.M02 | external |
| moderation.rate.exceeded | F12.S03.M03 | F16.S03.M02 | external |
| federation.record.rejected | F11.S01.M02 | F16.S03.M02 | external |
| federation.peer.suspended | F11.S03.M01 | F16.S03.M02 | external |
| identity.session.revoked | F07.S01.M02 | F16.S03.M02 | external |
| security.role.assigned | F16.S01.M01 | F16.S03.M02 | external |
| security.role.revoked | F16.S01.M01 | F16.S03.M02 | external |
