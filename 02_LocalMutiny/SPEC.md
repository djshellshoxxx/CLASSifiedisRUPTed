# F02 — LocalMutiny barter and cyclic exchange

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `mutiny`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F02.S01 01_trade_proposals](01_trade_proposals/SPEC.md) — 4 modules
- [F02.S02 02_cycle_matching](02_cycle_matching/SPEC.md) — 5 modules
- [F02.S03 03_cycle_execution](03_cycle_execution/SPEC.md) — 4 modules
- [F02.S04 04_value_balancing](04_value_balancing/SPEC.md) — 3 modules

## Aggregation

The feature is enabled by flag `F02` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F01, F06, F07, F08, F09, F10, F11, F12, F15, F16.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| comms.consent.signed | F08.S02.M02 | F02.S01.M01 | external |
| comms.consent.received | F08.S02.M02 | F02.S01.M01 | external |
| comms.consent.revoked | F08.S02.M02 | F02.S01.M01 | external |
| mutiny.cycle.locked | F02.S03.M02 | F02.S01.M01 | internal |
| mutiny.cycle.unlocked | F02.S03.M02 | F02.S01.M01 | internal |
| mutiny.lock.conflict_detected | F02.S03.M02 | F02.S01.M01 | internal |
| identity.block.added | F07.S02.M02 | F02.S01.M01 | external |
| bazaar.inventory.depleted | F01.S03.M01 | F02.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S01.M01 | external |
| identity.block.added | F07.S02.M02 | F02.S01.M02 | external |
| mutiny.cycle.declined | F02.S03.M01 | F02.S01.M02 | internal |
| mutiny.cycle.participant_dropped | F02.S03.M03 | F02.S01.M02 | internal |
| privacy.deletion.completed | F10.S01.M04 | F02.S01.M02 | external |
| bazaar.listing.edited | F01.S01.M02 | F02.S01.M03 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F02.S01.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S01.M03 | external |
| mutiny.lock.conflict_detected | F02.S03.M02 | F02.S01.M04 | internal |
| privacy.deletion.completed | F10.S01.M04 | F02.S01.M04 | external |
| mutiny.cycle.committed | F02.S03.M01 | F02.S01.M04 | internal |
| mutiny.cycle.declined | F02.S03.M01 | F02.S01.M04 | internal |
| mutiny.cycle.cancelled | F02.S03.M03 | F02.S01.M04 | internal |
| mutiny.normalization.expired | F02.S04.M02 | F02.S01.M04 | internal |
| bazaar.want.declared | F01.S02.M02 | F02.S02.M03 | external |
| bazaar.want.withdrawn | F01.S02.M02 | F02.S02.M03 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F02.S02.M03 | external |
| bazaar.listing.expired | F01.S01.M04 | F02.S02.M03 | external |
| bazaar.inventory.depleted | F01.S03.M01 | F02.S02.M03 | external |
| mutiny.valuation.declared | F02.S04.M03 | F02.S02.M03 | internal |
| identity.block.added | F07.S02.M02 | F02.S02.M03 | external |
| mutiny.cycle.proposed | F02.S03.M01 | F02.S02.M03 | internal |
| mutiny.cycle.declined | F02.S03.M01 | F02.S02.M03 | internal |
| identity.portable_doc.published | F07.S02.M01 | F02.S02.M03 | external |
| identity.reputation.recomputed | F07.S03.M01 | F02.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S02.M03 | external |
| identity.block.added | F07.S02.M02 | F02.S02.M04 | external |
| identity.block.removed | F07.S02.M02 | F02.S02.M04 | external |
| discovery.location.updated | F06.S02.M02 | F02.S02.M04 | external |
| privacy.consent.withdrawn | F10.S01.M01 | F02.S02.M04 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S02.M04 | external |
| mutiny.proposal.revised | F02.S01.M04 | F02.S02.M05 | internal |
| mutiny.values.normalized | F02.S04.M02 | F02.S02.M05 | internal |
| mutiny.normalization.expired | F02.S04.M02 | F02.S02.M05 | internal |
| mutiny.valuation.flagged | F02.S04.M03 | F02.S02.M05 | internal |
| privacy.deletion.completed | F10.S01.M04 | F02.S02.M05 | external |
| mutiny.proposal.accepted | F02.S01.M01 | F02.S03.M01 | internal |
| mutiny.proposal.revised | F02.S01.M04 | F02.S03.M01 | internal |
| comms.consent.signed | F08.S02.M02 | F02.S03.M01 | external |
| comms.consent.received | F08.S02.M02 | F02.S03.M01 | external |
| comms.consent.revoked | F08.S02.M02 | F02.S03.M01 | external |
| mutiny.revision.forked | F02.S01.M04 | F02.S03.M01 | internal |
| identity.reputation.recomputed | F07.S03.M01 | F02.S03.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S03.M01 | external |
| mutiny.proposal.rejected | F02.S01.M01 | F02.S03.M02 | internal |
| mutiny.proposal.withdrawn | F02.S01.M01 | F02.S03.M02 | internal |
| mutiny.proposal.expired | F02.S01.M01 | F02.S03.M02 | internal |
| mutiny.revision.forked | F02.S01.M04 | F02.S03.M02 | internal |
| bazaar.inventory.released | F01.S03.M01 | F02.S03.M02 | external |
| bazaar.inventory.conflict_detected | F01.S03.M01 | F02.S03.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S03.M02 | external |
| comms.consent.received | F08.S02.M02 | F02.S03.M03 | external |
| comms.consent.revoked | F08.S02.M02 | F02.S03.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S03.M03 | external |
| identity.block.added | F07.S02.M02 | F02.S03.M03 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F02.S03.M03 | external |
| bazaar.listing.expired | F01.S01.M04 | F02.S03.M03 | external |
| mutiny.compensation.settled | F02.S04.M01 | F02.S03.M04 | internal |
| commerce.payment.disputed | F09.S01.M01 | F02.S03.M04 | external |
| commerce.dispute.opened | F09.S02.M02 | F02.S03.M04 | external |
| commerce.dispute.resolved | F09.S02.M02 | F02.S03.M04 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F02.S03.M04 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S03.M04 | external |
| mutiny.cycle.committed | F02.S03.M01 | F02.S04.M01 | internal |
| mutiny.cycle.cancelled | F02.S03.M03 | F02.S04.M01 | internal |
| mutiny.cycle.declined | F02.S03.M01 | F02.S04.M01 | internal |
| mutiny.proposal.revised | F02.S01.M04 | F02.S04.M01 | internal |
| mutiny.leg.received | F02.S03.M04 | F02.S04.M01 | internal |
| commerce.payment.claimed | F09.S01.M01 | F02.S04.M01 | external |
| commerce.payment.acknowledged | F09.S01.M01 | F02.S04.M01 | external |
| commerce.payment.finalized | F09.S01.M03 | F02.S04.M01 | external |
| commerce.payment.disputed | F09.S01.M01 | F02.S04.M01 | external |
| commerce.payment.expired | F09.S01.M01 | F02.S04.M01 | external |
| commerce.dispute.resolved | F09.S02.M02 | F02.S04.M01 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F02.S04.M01 | external |
| commerce.deal.cancelled | F09.S01.M01 | F02.S04.M01 | external |
| mutiny.recovery.resolved | F02.S03.M04 | F02.S04.M01 | internal |
| privacy.deletion.completed | F10.S01.M04 | F02.S04.M01 | external |
| mutiny.proposal.revised | F02.S01.M04 | F02.S04.M02 | internal |
| mutiny.cycle.committed | F02.S03.M01 | F02.S04.M02 | internal |
| mutiny.proposal.accepted | F02.S01.M01 | F02.S04.M02 | internal |
| mutiny.cycle.declined | F02.S03.M01 | F02.S04.M02 | internal |
| mutiny.cycle.cancelled | F02.S03.M03 | F02.S04.M02 | internal |
| mutiny.proposal.rejected | F02.S01.M01 | F02.S04.M02 | internal |
| mutiny.proposal.expired | F02.S01.M01 | F02.S04.M02 | internal |
| mutiny.proposal.withdrawn | F02.S01.M01 | F02.S04.M02 | internal |
| mutiny.revision.forked | F02.S01.M04 | F02.S04.M02 | internal |
| mutiny.lock.conflict_detected | F02.S03.M02 | F02.S04.M02 | internal |
| privacy.deletion.completed | F10.S01.M04 | F02.S04.M02 | external |
| commerce.fx_quote.issued | F09.S03.M02 | F02.S04.M02 | external |
| bazaar.listing.edited | F01.S01.M02 | F02.S04.M03 | external |
| bazaar.sell_terms.set | F01.S02.M01 | F02.S04.M03 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F02.S04.M03 | external |
| mutiny.cycle.locked | F02.S03.M02 | F02.S04.M03 | internal |
| mutiny.cycle.unlocked | F02.S03.M02 | F02.S04.M03 | internal |
| comms.consent.signed | F08.S02.M02 | F02.S04.M03 | external |
| comms.consent.received | F08.S02.M02 | F02.S04.M03 | external |
| mutiny.cycle.cancelled | F02.S03.M03 | F02.S04.M03 | internal |
| mutiny.cycle.completed | F02.S03.M04 | F02.S04.M03 | internal |
| mutiny.proposal.withdrawn | F02.S01.M01 | F02.S04.M03 | internal |
| mutiny.proposal.rejected | F02.S01.M01 | F02.S04.M03 | internal |
| privacy.consent.withdrawn | F10.S01.M01 | F02.S04.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S04.M03 | external |
