# F03.S02 — 02_service_booking

**Status:** SPECIFIED. **Parent:** [F03](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F03.S02.M01 | [Service quotes and booking](mod_quotes/SPEC.md) | SPECIFIED | Request → quote (expiry) → accept creates Booking; cancellation policy terms. |
| F03.S02.M02 | [Service milestones](mod_milestones/SPEC.md) | SPECIFIED | Milestones with amounts; provider submits, client approves; payment claims per milestone (F09). |
| F03.S02.M03 | [Service disputes](mod_disputes/SPEC.md) | SPECIFIED | Service-specific dispute intake (scope, milestones) delegating case handling to F09.S02.M02. |

## Aggregation

Modules in this subfeature share the feature package `packages/services` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| services.milestone.submitted | F03.S02.M02 | F03.S02.M01 | internal |
| services.milestone.approved | F03.S02.M02 | F03.S02.M01 | internal |
| services.booking.completed | F03.S02.M02 | F03.S02.M01 | internal |
| services.dispute.opened | F03.S02.M03 | F03.S02.M01 | internal |
| commerce.dispute.resolved | F09.S02.M02 | F03.S02.M01 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F03.S02.M01 | external |
| identity.block.added | F07.S02.M02 | F03.S02.M01 | external |
| services.offering.withdrawn | F03.S01.M01 | F03.S02.M01 | external |
| services.availability.changed | F03.S01.M02 | F03.S02.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F03.S02.M01 | external |
| services.booking.confirmed | F03.S02.M01 | F03.S02.M02 | internal |
| services.booking.cancelled | F03.S02.M01 | F03.S02.M02 | internal |
| commerce.payment.claimed | F09.S01.M01 | F03.S02.M02 | external |
| commerce.payment.acknowledged | F09.S01.M01 | F03.S02.M02 | external |
| commerce.payment.confirming | F09.S01.M03 | F03.S02.M02 | external |
| commerce.payment.confirmed | F09.S01.M03 | F03.S02.M02 | external |
| commerce.payment.finalized | F09.S01.M03 | F03.S02.M02 | external |
| commerce.payment.reorged | F09.S01.M03 | F03.S02.M02 | external |
| commerce.payment.failed | F09.S01.M03 | F03.S02.M02 | external |
| commerce.payment.disputed | F09.S01.M01 | F03.S02.M02 | external |
| commerce.payment.expired | F09.S01.M01 | F03.S02.M02 | external |
| commerce.deal.cancelled | F09.S01.M01 | F03.S02.M02 | external |
| services.dispute.opened | F03.S02.M03 | F03.S02.M02 | internal |
| commerce.dispute.resolved | F09.S02.M02 | F03.S02.M02 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F03.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F03.S02.M02 | external |
| commerce.dispute.opened | F09.S02.M02 | F03.S02.M03 | external |
| commerce.dispute.resolved | F09.S02.M02 | F03.S02.M03 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F03.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F03.S02.M03 | external |
