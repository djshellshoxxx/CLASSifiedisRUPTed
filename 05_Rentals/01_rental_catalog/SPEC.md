# F05.S01 — 01_rental_catalog

**Status:** SPECIFIED. **Parent:** [F05](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F05.S01.M01 | [Rental availability](mod_availability/SPEC.md) | SPECIFIED | Rentable items with daily/hourly rate, calendar of reservations without overlap (interval checks), buffer times. |
| F05.S01.M02 | [Rental deposits (noncustodial)](mod_deposits/SPEC.md) | SPECIFIED | Deposit terms recorded; deposit paid directly between parties via F09 claims; release/forfeit bilateral attestations (ADR-0012). |

## Aggregation

Modules in this subfeature share the feature package `packages/rentals` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| rentals.handoff.attested | F05.S02.M01 | F05.S01.M01 | external |
| rentals.rental.overdue | F05.S02.M02 | F05.S01.M01 | external |
| rentals.return.attested | F05.S02.M02 | F05.S01.M01 | external |
| rentals.rental.closed | F05.S02.M02 | F05.S01.M01 | external |
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
| rentals.reservation.cancelled | F05.S01.M01 | F05.S01.M02 | internal |
| rentals.return.attested | F05.S02.M02 | F05.S01.M02 | external |
| rentals.rental.overdue | F05.S02.M02 | F05.S01.M02 | external |
| rentals.damage.claimed | F05.S02.M03 | F05.S01.M02 | external |
| rentals.damage.resolved | F05.S02.M03 | F05.S01.M02 | external |
| identity.block.added | F07.S02.M02 | F05.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F05.S01.M02 | external |
