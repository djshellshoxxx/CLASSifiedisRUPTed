# F18 — Governance and compliance

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `governance`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F18.S01 01_policy](01_policy/SPEC.md) — 3 modules
- [F18.S02 02_community](02_community/SPEC.md) — 2 modules

## Aggregation

The feature is enabled by flag `F18` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F07, F10, F11, F12, F15, F16.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| governance.policy_proposal.decided | F18.S02.M01 | F18.S01.M01 | internal |
| governance.policy_proposal.decided | F18.S02.M01 | F18.S01.M02 | internal |
| governance.policy_proposal.decided | F18.S02.M01 | F18.S01.M03 | internal |
| privacy.deletion.requested | F10.S01.M04 | F18.S02.M01 | external |
| privacy.deletion.cancelled | F10.S01.M04 | F18.S02.M01 | external |
| moderation.report.received | F12.S01.M01 | F18.S02.M02 | external |
| moderation.action.applied | F12.S02.M01 | F18.S02.M02 | external |
| moderation.appeal.filed | F12.S01.M03 | F18.S02.M02 | external |
| moderation.appeal.decided | F12.S01.M03 | F18.S02.M02 | external |
| moderation.spam.detected | F12.S02.M02 | F18.S02.M02 | external |
