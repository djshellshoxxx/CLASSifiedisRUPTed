# F12 — Moderation and safety

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `moderation`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F12.S01 01_reporting](01_reporting/SPEC.md) — 3 modules
- [F12.S02 02_policy](02_policy/SPEC.md) — 3 modules
- [F12.S03 03_antifraud](03_antifraud/SPEC.md) — 4 modules

## Aggregation

The feature is enabled by flag `F12` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F06, F07, F08, F10, F11, F15, F16, F18.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| moderation.case.opened | F12.S02.M01 | F12.S01.M01 | internal |
| moderation.case.closed | F12.S02.M01 | F12.S01.M01 | internal |
| privacy.deletion.completed | F10.S01.M04 | F12.S01.M01 | external |
| privacy.legal_hold.placed | F10.S01.M02 | F12.S01.M02 | external |
| privacy.legal_hold.released | F10.S01.M02 | F12.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F12.S01.M02 | external |
| moderation.action.applied | F12.S02.M01 | F12.S01.M03 | internal |
| moderation.action.reverted | F12.S02.M01 | F12.S01.M03 | internal |
| security.role.revoked | F16.S01.M01 | F12.S01.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F12.S01.M03 | external |
| moderation.report.received | F12.S01.M01 | F12.S02.M01 | internal |
| auctions.shill.suspected | F04.S02.M01 | F12.S02.M01 | external |
| moderation.appeal.decided | F12.S01.M03 | F12.S02.M01 | internal |
| governance.prohibited_rule.changed | F18.S01.M02 | F12.S02.M01 | external |
| moderation.risk.elevated | F12.S03.M01 | F12.S02.M01 | internal |
| privacy.deletion.completed | F10.S01.M04 | F12.S02.M01 | external |
| identity.session.started | F07.S01.M02 | F12.S02.M02 | external |
| federation.record.accepted | F11.S01.M02 | F12.S02.M02 | external |
| governance.policy_proposal.decided | F18.S02.M01 | F12.S02.M03 | external |
| governance.prohibited_rule.changed | F18.S01.M02 | F12.S02.M03 | external |
| identity.session.started | F07.S01.M02 | F12.S03.M01 | external |
| federation.record.accepted | F11.S01.M02 | F12.S03.M01 | external |
| identity.account.created | F07.S01.M01 | F12.S03.M01 | external |
| moderation.spam.detected | F12.S02.M02 | F12.S03.M02 | internal |
| auctions.shill.suspected | F04.S02.M01 | F12.S03.M02 | external |
| auctions.result.voided | F04.S02.M03 | F12.S03.M02 | external |
| commerce.dispute.opened | F09.S02.M02 | F12.S03.M02 | external |
| commerce.dispute.resolved | F09.S02.M02 | F12.S03.M02 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F12.S03.M02 | external |
| commerce.payment.disputed | F09.S01.M01 | F12.S03.M02 | external |
| commerce.payment.expired | F09.S01.M01 | F12.S03.M02 | external |
| commerce.deal.completed | F09.S01.M01 | F12.S03.M02 | external |
| comms.meetup.no_show | F08.S03.M02 | F12.S03.M02 | external |
| comms.meetup.no_show_contradicted | F08.S03.M02 | F12.S03.M02 | external |
| mutiny.cycle.participant_dropped | F02.S03.M03 | F12.S03.M02 | external |
| rentals.damage.resolved | F05.S02.M03 | F12.S03.M02 | external |
| moderation.action.applied | F12.S02.M01 | F12.S03.M02 | internal |
| moderation.action.reverted | F12.S02.M01 | F12.S03.M02 | internal |
| moderation.report.dismissed | F12.S01.M01 | F12.S03.M02 | internal |
| privacy.deletion.completed | F10.S01.M04 | F12.S03.M02 | external |
| moderation.spam.detected | F12.S02.M02 | F12.S03.M03 | internal |
| moderation.action.applied | F12.S02.M01 | F12.S03.M04 | internal |
| moderation.action.reverted | F12.S02.M01 | F12.S03.M04 | internal |
| identity.session.started | F07.S01.M02 | F12.S03.M04 | external |
| privacy.deletion.completed | F10.S01.M04 | F12.S03.M04 | external |
