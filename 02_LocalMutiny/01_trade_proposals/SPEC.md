# F02.S01 — 01_trade_proposals

**Status:** SPECIFIED. **Parent:** [F02](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F02.S01.M01 | [Two-party barter](mod_two/SPEC.md) | SPECIFIED | Direct item-for-item(s) proposals between two parties, optional compensation leg, both-party consent on exact revision. |
| F02.S01.M02 | [Proposal party roster](mod_party/SPEC.md) | SPECIFIED | Roster of parties in a proposal (2..N), roles giver/receiver per leg, uniqueness, block checks. |
| F02.S01.M03 | [Barter offer items](mod_offer/SPEC.md) | SPECIFIED | Legs (giver, receiver, item refs with quantities, declared value) composing a proposal; ownership/availability verified via InventoryPort. |
| F02.S01.M04 | [Barter counteroffers](mod_counteroffer/SPEC.md) | SPECIFIED | Material revisions create new immutable revision; all prior consents void; max 20 revisions. |

## Aggregation

Modules in this subfeature share the feature package `packages/mutiny` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| mutiny.proposal.revised | F02.S01.M04 | F02.S01.M01 | internal |
| mutiny.revision.forked | F02.S01.M04 | F02.S01.M01 | internal |
| comms.consent.signed | F08.S02.M02 | F02.S01.M01 | external |
| comms.consent.received | F08.S02.M02 | F02.S01.M01 | external |
| comms.consent.revoked | F08.S02.M02 | F02.S01.M01 | external |
| mutiny.cycle.locked | F02.S03.M02 | F02.S01.M01 | external |
| mutiny.cycle.unlocked | F02.S03.M02 | F02.S01.M01 | external |
| mutiny.lock.conflict_detected | F02.S03.M02 | F02.S01.M01 | external |
| mutiny.party.left | F02.S01.M02 | F02.S01.M01 | internal |
| identity.block.added | F07.S02.M02 | F02.S01.M01 | external |
| bazaar.inventory.depleted | F01.S03.M01 | F02.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S01.M01 | external |
| identity.block.added | F07.S02.M02 | F02.S01.M02 | external |
| mutiny.proposal.revised | F02.S01.M04 | F02.S01.M02 | internal |
| mutiny.cycle.declined | F02.S03.M01 | F02.S01.M02 | external |
| mutiny.cycle.participant_dropped | F02.S03.M03 | F02.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S01.M02 | external |
| mutiny.proposal.revised | F02.S01.M04 | F02.S01.M03 | internal |
| bazaar.listing.edited | F01.S01.M02 | F02.S01.M03 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F02.S01.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S01.M03 | external |
| mutiny.proposal.accepted | F02.S01.M01 | F02.S01.M04 | internal |
| mutiny.proposal.rejected | F02.S01.M01 | F02.S01.M04 | internal |
| mutiny.proposal.expired | F02.S01.M01 | F02.S01.M04 | internal |
| mutiny.proposal.withdrawn | F02.S01.M01 | F02.S01.M04 | internal |
| mutiny.lock.conflict_detected | F02.S03.M02 | F02.S01.M04 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S01.M04 | external |
| mutiny.cycle.committed | F02.S03.M01 | F02.S01.M04 | external |
| mutiny.cycle.declined | F02.S03.M01 | F02.S01.M04 | external |
| mutiny.cycle.cancelled | F02.S03.M03 | F02.S01.M04 | external |
| mutiny.normalization.expired | F02.S04.M02 | F02.S01.M04 | external |
