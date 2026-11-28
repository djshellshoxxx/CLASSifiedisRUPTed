# F05 — Rentals

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `rentals`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F05.S01 01_rental_catalog](01_rental_catalog/SPEC.md) — 2 modules
- [F05.S02 02_rental_lifecycle](02_rental_lifecycle/SPEC.md) — 3 modules

## Aggregation

The feature is enabled by flag `F05` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F01, F06, F07, F08, F09, F10, F11, F15.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| rentals.handoff.attested | F05.S02.M01 | F05.S01.M01 | internal |
| rentals.rental.overdue | F05.S02.M02 | F05.S01.M01 | internal |
| rentals.return.attested | F05.S02.M02 | F05.S01.M01 | internal |
| rentals.rental.closed | F05.S02.M02 | F05.S01.M01 | internal |
| bazaar.listing.unpublished | F01.S01.M03 | F05.S01.M01 | external |
| identity.block.added | F07.S02.M02 | F05.S01.M01 | external |
| comms.consent.revoked | F08.S02.M02 | F05.S01.M01 | external |
| commerce.deal.cancelled | F09.S01.M01 | F05.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F05.S01.M01 | external |
| commerce.payment.claimed | F09.S01.M01 | F05.S01.M02 | external |
| commerce.payment.acknowledged | F09.S01.M01 | F05.S01.M02 | external |
| commerce.payment.finalized | F09.S01.M03 | F05.S01.M02 | external |
| commerce.payment.expired | F09.S01.M01 | F05.S01.M02 | external |
| commerce.deal.cancelled | F09.S01.M01 | F05.S01.M02 | external |
| commerce.dispute.opened | F09.S02.M02 | F05.S01.M02 | external |
| commerce.dispute.resolved | F09.S02.M02 | F05.S01.M02 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F05.S01.M02 | external |
| comms.consent.revoked | F08.S02.M02 | F05.S01.M02 | external |
| rentals.return.attested | F05.S02.M02 | F05.S01.M02 | internal |
| rentals.rental.overdue | F05.S02.M02 | F05.S01.M02 | internal |
| rentals.damage.claimed | F05.S02.M03 | F05.S01.M02 | internal |
| rentals.damage.resolved | F05.S02.M03 | F05.S01.M02 | internal |
| identity.block.added | F07.S02.M02 | F05.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F05.S01.M02 | external |
| rentals.reservation.confirmed | F05.S01.M01 | F05.S02.M01 | internal |
| rentals.reservation.cancelled | F05.S01.M01 | F05.S02.M01 | internal |
| rentals.deposit.funded | F05.S01.M02 | F05.S02.M01 | internal |
| rentals.deposit.agreed | F05.S01.M02 | F05.S02.M01 | internal |
| identity.block.added | F07.S02.M02 | F05.S02.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F05.S02.M01 | external |
| rentals.deposit.agreed | F05.S01.M02 | F05.S02.M02 | internal |
| rentals.deposit.funded | F05.S01.M02 | F05.S02.M02 | internal |
| rentals.deposit.released | F05.S01.M02 | F05.S02.M02 | internal |
| commerce.deal.cancelled | F09.S01.M01 | F05.S02.M02 | external |
| identity.block.added | F07.S02.M02 | F05.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F05.S02.M02 | external |
| rentals.deposit.released | F05.S01.M02 | F05.S02.M03 | internal |
| commerce.dispute.opened | F09.S02.M02 | F05.S02.M03 | external |
| commerce.dispute.resolved | F09.S02.M02 | F05.S02.M03 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F05.S02.M03 | external |
| commerce.payment.acknowledged | F09.S01.M01 | F05.S02.M03 | external |
| commerce.payment.finalized | F09.S01.M03 | F05.S02.M03 | external |
| identity.block.added | F07.S02.M02 | F05.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F05.S02.M03 | external |
