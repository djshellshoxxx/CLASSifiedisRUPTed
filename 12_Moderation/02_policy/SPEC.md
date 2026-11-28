# F12.S02 — 02_policy

**Status:** SPECIFIED. **Parent:** [F12](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F12.S02.M01 | [Enforcement actions](mod_enforcement/SPEC.md) | SPECIFIED | Case queue, actions (remove content, restrict feature, suspend account, warn) with policy reference, statement of reasons, expiry. |
| F12.S02.M02 | [Spam detection](mod_spam/SPEC.md) | SPECIFIED | Deterministic heuristics: duplicate listing hash, link density, posting velocity, new-account limits; results are signals not auto-bans except velocity throttles. |
| F12.S02.M03 | [Abuse policy](mod_abuse/SPEC.md) | SPECIFIED | Versioned community policy rules with IDs referenced by actions and prohibited goods (F18). |

## Aggregation

Modules in this subfeature share the feature package `packages/moderation` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| moderation.report.received | F12.S01.M01 | F12.S02.M01 | external |
| moderation.spam.detected | F12.S02.M02 | F12.S02.M01 | internal |
| auctions.shill.suspected | F04.S02.M01 | F12.S02.M01 | external |
| moderation.appeal.decided | F12.S01.M03 | F12.S02.M01 | external |
| governance.prohibited_rule.changed | F18.S01.M02 | F12.S02.M01 | external |
| moderation.risk.elevated | F12.S03.M01 | F12.S02.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F12.S02.M01 | external |
| identity.session.started | F07.S01.M02 | F12.S02.M02 | external |
| federation.record.accepted | F11.S01.M02 | F12.S02.M02 | external |
| governance.policy_proposal.decided | F18.S02.M01 | F12.S02.M03 | external |
| governance.prohibited_rule.changed | F18.S01.M02 | F12.S02.M03 | external |
