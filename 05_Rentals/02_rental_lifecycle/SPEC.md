# F05.S02 — 02_rental_lifecycle

**Status:** SPECIFIED. **Parent:** [F05](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F05.S02.M01 | [Rental handoff](mod_handoff/SPEC.md) | SPECIFIED | Pickup condition report (photos refs, checklist), both-party attestation starts rental period. |
| F05.S02.M02 | [Rental return](mod_return/SPEC.md) | SPECIFIED | Return condition report, overdue detection and late-fee terms, closure. |
| F05.S02.M03 | [Rental damage claims](mod_damage/SPEC.md) | SPECIFIED | Owner damage claims comparing handoff/return reports, renter response, escalation to F09.S02.M02 disputes. |

## Aggregation

Modules in this subfeature share the feature package `packages/rentals` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| rentals.reservation.confirmed | F05.S01.M01 | F05.S02.M01 | external |
| rentals.reservation.cancelled | F05.S01.M01 | F05.S02.M01 | external |
| rentals.deposit.funded | F05.S01.M02 | F05.S02.M01 | external |
| rentals.deposit.agreed | F05.S01.M02 | F05.S02.M01 | external |
| identity.block.added | F07.S02.M02 | F05.S02.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F05.S02.M01 | external |
| rentals.handoff.attested | F05.S02.M01 | F05.S02.M02 | internal |
| rentals.damage.claimed | F05.S02.M03 | F05.S02.M02 | internal |
| rentals.damage.resolved | F05.S02.M03 | F05.S02.M02 | internal |
| rentals.deposit.agreed | F05.S01.M02 | F05.S02.M02 | external |
| rentals.deposit.funded | F05.S01.M02 | F05.S02.M02 | external |
| rentals.deposit.released | F05.S01.M02 | F05.S02.M02 | external |
| commerce.deal.cancelled | F09.S01.M01 | F05.S02.M02 | external |
| identity.block.added | F07.S02.M02 | F05.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F05.S02.M02 | external |
| rentals.handoff.attested | F05.S02.M01 | F05.S02.M03 | internal |
| rentals.return.attested | F05.S02.M02 | F05.S02.M03 | internal |
| rentals.rental.overdue | F05.S02.M02 | F05.S02.M03 | internal |
| rentals.rental.closed | F05.S02.M02 | F05.S02.M03 | internal |
| rentals.deposit.released | F05.S01.M02 | F05.S02.M03 | external |
| commerce.dispute.opened | F09.S02.M02 | F05.S02.M03 | external |
| commerce.dispute.resolved | F09.S02.M02 | F05.S02.M03 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F05.S02.M03 | external |
| commerce.payment.acknowledged | F09.S01.M01 | F05.S02.M03 | external |
| commerce.payment.finalized | F09.S01.M03 | F05.S02.M03 | external |
| identity.block.added | F07.S02.M02 | F05.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F05.S02.M03 | external |
