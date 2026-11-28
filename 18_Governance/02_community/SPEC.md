# F18.S02 — 02_community

**Status:** SPECIFIED. **Parent:** [F18](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F18.S02.M01 | [Community governance](mod_governance/SPEC.md) | SPECIFIED | Operator-run policy change proposals with comment period and changelog; decisions recorded. |
| F18.S02.M02 | [Transparency reports](mod_transparency/SPEC.md) | SPECIFIED | Aggregate counts (reports, actions, appeals, legal requests) with k ≥ 10 suppression, periodic publication. |

## Aggregation

Modules in this subfeature share the feature package `packages/governance` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| privacy.deletion.requested | F10.S01.M04 | F18.S02.M01 | external |
| privacy.deletion.cancelled | F10.S01.M04 | F18.S02.M01 | external |
| moderation.report.received | F12.S01.M01 | F18.S02.M02 | external |
| moderation.action.applied | F12.S02.M01 | F18.S02.M02 | external |
| moderation.appeal.filed | F12.S01.M03 | F18.S02.M02 | external |
| moderation.appeal.decided | F12.S01.M03 | F18.S02.M02 | external |
| moderation.spam.detected | F12.S02.M02 | F18.S02.M02 | external |
| governance.policy_proposal.decided | F18.S02.M01 | F18.S02.M02 | internal |
