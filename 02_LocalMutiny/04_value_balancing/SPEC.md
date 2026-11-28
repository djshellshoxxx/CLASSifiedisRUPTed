# F02.S04 — 04_value_balancing

**Status:** SPECIFIED. **Parent:** [F02](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F02.S04.M01 | [Mixed-value compensation](mod_mixed/SPEC.md) | SPECIFIED | Money/extra-item legs offsetting value gaps beyond tolerance; payment via F09 claims, never custody. |
| F02.S04.M02 | [Barter currency normalization](mod_currency/SPEC.md) | SPECIFIED | Normalize declared values to cycle settlement currency using pinned FX quotes (F09.S03.M02), record quote IDs, expiry triggers re-consent. |
| F02.S04.M03 | [Participant valuation](mod_valuation/SPEC.md) | SPECIFIED | Participant-declared values per item with optional reference (listing price), dispute-flagging of implausible values; never platform appraisal. |

## Aggregation

Modules in this subfeature share the feature package `packages/mutiny` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| mutiny.cycle.committed | F02.S03.M01 | F02.S04.M01 | external |
| mutiny.cycle.cancelled | F02.S03.M03 | F02.S04.M01 | external |
| mutiny.cycle.declined | F02.S03.M01 | F02.S04.M01 | external |
| mutiny.proposal.revised | F02.S01.M04 | F02.S04.M01 | external |
| mutiny.leg.received | F02.S03.M04 | F02.S04.M01 | external |
| commerce.payment.claimed | F09.S01.M01 | F02.S04.M01 | external |
| commerce.payment.acknowledged | F09.S01.M01 | F02.S04.M01 | external |
| commerce.payment.finalized | F09.S01.M03 | F02.S04.M01 | external |
| commerce.payment.disputed | F09.S01.M01 | F02.S04.M01 | external |
| commerce.payment.expired | F09.S01.M01 | F02.S04.M01 | external |
| commerce.dispute.resolved | F09.S02.M02 | F02.S04.M01 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F02.S04.M01 | external |
| commerce.deal.cancelled | F09.S01.M01 | F02.S04.M01 | external |
| mutiny.recovery.resolved | F02.S03.M04 | F02.S04.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S04.M01 | external |
| mutiny.valuation.declared | F02.S04.M03 | F02.S04.M02 | internal |
| mutiny.proposal.revised | F02.S01.M04 | F02.S04.M02 | external |
| mutiny.cycle.committed | F02.S03.M01 | F02.S04.M02 | external |
| mutiny.proposal.accepted | F02.S01.M01 | F02.S04.M02 | external |
| mutiny.cycle.declined | F02.S03.M01 | F02.S04.M02 | external |
| mutiny.cycle.cancelled | F02.S03.M03 | F02.S04.M02 | external |
| mutiny.proposal.rejected | F02.S01.M01 | F02.S04.M02 | external |
| mutiny.proposal.expired | F02.S01.M01 | F02.S04.M02 | external |
| mutiny.proposal.withdrawn | F02.S01.M01 | F02.S04.M02 | external |
| mutiny.revision.forked | F02.S01.M04 | F02.S04.M02 | external |
| mutiny.lock.conflict_detected | F02.S03.M02 | F02.S04.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S04.M02 | external |
| commerce.fx_quote.issued | F09.S03.M02 | F02.S04.M02 | external |
| bazaar.listing.edited | F01.S01.M02 | F02.S04.M03 | external |
| bazaar.sell_terms.set | F01.S02.M01 | F02.S04.M03 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F02.S04.M03 | external |
| mutiny.cycle.locked | F02.S03.M02 | F02.S04.M03 | external |
| mutiny.cycle.unlocked | F02.S03.M02 | F02.S04.M03 | external |
| comms.consent.signed | F08.S02.M02 | F02.S04.M03 | external |
| comms.consent.received | F08.S02.M02 | F02.S04.M03 | external |
| mutiny.cycle.cancelled | F02.S03.M03 | F02.S04.M03 | external |
| mutiny.cycle.completed | F02.S03.M04 | F02.S04.M03 | external |
| mutiny.proposal.withdrawn | F02.S01.M01 | F02.S04.M03 | external |
| mutiny.proposal.rejected | F02.S01.M01 | F02.S04.M03 | external |
| privacy.consent.withdrawn | F10.S01.M01 | F02.S04.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S04.M03 | external |
