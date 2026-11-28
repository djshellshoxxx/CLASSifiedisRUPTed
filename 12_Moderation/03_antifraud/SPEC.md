# F12.S03 — 03_antifraud

**Status:** SPECIFIED. **Parent:** [F12](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F12.S03.M01 | [Risk scoring](mod_risk/SPEC.md) | SPECIFIED | Combine signals into explainable risk levels (low/medium/high) per account/transaction; high triggers friction (extra confirmation, limits), never silent bans. |
| F12.S03.M02 | [Fraud signals](mod_signals/SPEC.md) | SPECIFIED | Append-only signal ingestion from modules (shill, spam, disputes, no-shows, fake payment claims) with weights and decay. |
| F12.S03.M03 | [Rate limiting](mod_rate/SPEC.md) | SPECIFIED | Token-bucket/GCRA limits per actor+capability and per IP prefix, configured per tenant; used by command bus. |
| F12.S03.M04 | [Account limits](mod_limits/SPEC.md) | SPECIFIED | Graduated limits by account age/reputation (listings/day, open offers, cycle participation), overrides by moderators. |

## Aggregation

Modules in this subfeature share the feature package `packages/moderation` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| moderation.signal.recorded | F12.S03.M02 | F12.S03.M01 | internal |
| identity.session.started | F07.S01.M02 | F12.S03.M01 | external |
| federation.record.accepted | F11.S01.M02 | F12.S03.M01 | external |
| identity.account.created | F07.S01.M01 | F12.S03.M01 | external |
| moderation.spam.detected | F12.S02.M02 | F12.S03.M02 | external |
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
| moderation.action.applied | F12.S02.M01 | F12.S03.M02 | external |
| moderation.action.reverted | F12.S02.M01 | F12.S03.M02 | external |
| moderation.report.dismissed | F12.S01.M01 | F12.S03.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F12.S03.M02 | external |
| moderation.spam.detected | F12.S02.M02 | F12.S03.M03 | external |
| moderation.signal.recorded | F12.S03.M02 | F12.S03.M03 | internal |
| moderation.limit.changed | F12.S03.M04 | F12.S03.M03 | internal |
| moderation.risk.elevated | F12.S03.M01 | F12.S03.M04 | internal |
| moderation.risk.lowered | F12.S03.M01 | F12.S03.M04 | internal |
| moderation.action.applied | F12.S02.M01 | F12.S03.M04 | external |
| moderation.action.reverted | F12.S02.M01 | F12.S03.M04 | external |
| identity.session.started | F07.S01.M02 | F12.S03.M04 | external |
| privacy.deletion.completed | F10.S01.M04 | F12.S03.M04 | external |
