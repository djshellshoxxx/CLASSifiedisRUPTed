# F02.S03 — 03_cycle_execution

**Status:** SPECIFIED. **Parent:** [F02](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F02.S03.M01 | [Cycle consent](mod_consent/SPEC.md) | SPECIFIED | Turns suggestion into Cycle proposal; collects signed all-party consent on exact revision; commit only when unanimous before deadline (default 72 h). |
| F02.S03.M02 | [Cycle locks](mod_lock/SPEC.md) | SPECIFIED | Lease all items in a cycle atomically (all-or-nothing) via inventory holds; renew/expire; concurrent cycles over same item resolved first-commit-wins. |
| F02.S03.M03 | [Cycle dropouts](mod_dropouts/SPEC.md) | SPECIFIED | Handle withdrawal, expiry, block, suspension of a participant; before handover cancel and release; never silently reroute. |
| F02.S03.M04 | [Cycle execution and recovery](mod_recovery/SPEC.md) | SPECIFIED | Per-leg giver/receiver attestations, completion, partial-execution recovery options (return, compensation, dispute via F09.S02.M02). |

## Aggregation

Modules in this subfeature share the feature package `packages/mutiny` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| mutiny.proposal.accepted | F02.S01.M01 | F02.S03.M01 | external |
| mutiny.proposal.revised | F02.S01.M04 | F02.S03.M01 | external |
| mutiny.cycle.locked | F02.S03.M02 | F02.S03.M01 | internal |
| mutiny.cycle.unlocked | F02.S03.M02 | F02.S03.M01 | internal |
| comms.consent.signed | F08.S02.M02 | F02.S03.M01 | external |
| comms.consent.received | F08.S02.M02 | F02.S03.M01 | external |
| comms.consent.revoked | F08.S02.M02 | F02.S03.M01 | external |
| mutiny.revision.forked | F02.S01.M04 | F02.S03.M01 | external |
| mutiny.lock.conflict_detected | F02.S03.M02 | F02.S03.M01 | internal |
| mutiny.cycle.cancelled | F02.S03.M03 | F02.S03.M01 | internal |
| mutiny.leg.handed_over | F02.S03.M04 | F02.S03.M01 | internal |
| mutiny.leg.received | F02.S03.M04 | F02.S03.M01 | internal |
| mutiny.cycle.completed | F02.S03.M04 | F02.S03.M01 | internal |
| mutiny.cycle.partially_executed | F02.S03.M04 | F02.S03.M01 | internal |
| identity.reputation.recomputed | F07.S03.M01 | F02.S03.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S03.M01 | external |
| mutiny.cycle.declined | F02.S03.M01 | F02.S03.M02 | internal |
| mutiny.cycle.cancelled | F02.S03.M03 | F02.S03.M02 | internal |
| mutiny.cycle.completed | F02.S03.M04 | F02.S03.M02 | internal |
| mutiny.cycle.partially_executed | F02.S03.M04 | F02.S03.M02 | internal |
| mutiny.recovery.resolved | F02.S03.M04 | F02.S03.M02 | internal |
| mutiny.leg.handed_over | F02.S03.M04 | F02.S03.M02 | internal |
| mutiny.leg.received | F02.S03.M04 | F02.S03.M02 | internal |
| mutiny.proposal.rejected | F02.S01.M01 | F02.S03.M02 | external |
| mutiny.proposal.withdrawn | F02.S01.M01 | F02.S03.M02 | external |
| mutiny.proposal.expired | F02.S01.M01 | F02.S03.M02 | external |
| mutiny.revision.forked | F02.S01.M04 | F02.S03.M02 | external |
| bazaar.inventory.released | F01.S03.M01 | F02.S03.M02 | external |
| bazaar.inventory.conflict_detected | F01.S03.M01 | F02.S03.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S03.M02 | external |
| mutiny.cycle.proposed | F02.S03.M01 | F02.S03.M03 | internal |
| mutiny.cycle.committed | F02.S03.M01 | F02.S03.M03 | internal |
| mutiny.cycle.declined | F02.S03.M01 | F02.S03.M03 | internal |
| comms.consent.received | F08.S02.M02 | F02.S03.M03 | external |
| comms.consent.revoked | F08.S02.M02 | F02.S03.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S03.M03 | external |
| mutiny.cycle.unlocked | F02.S03.M02 | F02.S03.M03 | internal |
| mutiny.leg.handed_over | F02.S03.M04 | F02.S03.M03 | internal |
| mutiny.leg.received | F02.S03.M04 | F02.S03.M03 | internal |
| identity.block.added | F07.S02.M02 | F02.S03.M03 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F02.S03.M03 | external |
| bazaar.listing.expired | F01.S01.M04 | F02.S03.M03 | external |
| mutiny.cycle.committed | F02.S03.M01 | F02.S03.M04 | internal |
| mutiny.cycle.participant_dropped | F02.S03.M03 | F02.S03.M04 | internal |
| mutiny.cycle.cancelled | F02.S03.M03 | F02.S03.M04 | internal |
| mutiny.compensation.settled | F02.S04.M01 | F02.S03.M04 | external |
| commerce.payment.disputed | F09.S01.M01 | F02.S03.M04 | external |
| commerce.dispute.opened | F09.S02.M02 | F02.S03.M04 | external |
| commerce.dispute.resolved | F09.S02.M02 | F02.S03.M04 | external |
| commerce.dispute.withdrawn | F09.S02.M02 | F02.S03.M04 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S03.M04 | external |
