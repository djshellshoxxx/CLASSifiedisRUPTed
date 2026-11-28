# F12.S01 — 01_reporting

**Status:** SPECIFIED. **Parent:** [F12](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F12.S01.M01 | [Content flags](mod_flags/SPEC.md) | SPECIFIED | Report any user content with reason taxonomy, dedupe per reporter, reporter protection (P3). |
| F12.S01.M02 | [Moderation evidence](mod_evidence/SPEC.md) | SPECIFIED | Immutable hashed snapshots of reported content at report time, access-logged, retention RET-EVIDENCE. |
| F12.S01.M03 | [Appeals](mod_appeals/SPEC.md) | SPECIFIED | One appeal per decision within 30 days, different moderator reviews, outcome notice with reason. |

## Aggregation

Modules in this subfeature share the feature package `packages/moderation` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| moderation.case.opened | F12.S02.M01 | F12.S01.M01 | external |
| moderation.case.closed | F12.S02.M01 | F12.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F12.S01.M01 | external |
| privacy.legal_hold.placed | F10.S01.M02 | F12.S01.M02 | external |
| privacy.legal_hold.released | F10.S01.M02 | F12.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F12.S01.M02 | external |
| moderation.action.applied | F12.S02.M01 | F12.S01.M03 | external |
| moderation.action.reverted | F12.S02.M01 | F12.S01.M03 | external |
| security.role.revoked | F16.S01.M01 | F12.S01.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F12.S01.M03 | external |
