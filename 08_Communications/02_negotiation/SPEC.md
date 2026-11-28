# F08.S02 — 02_negotiation

**Status:** SPECIFIED. **Parent:** [F08](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F08.S02.M01 | [In-thread structured offers](mod_offers/SPEC.md) | SPECIFIED | Render and post references to bazaar offers / mutiny proposals inside threads; the card is a view; the owning module stays canonical. |
| F08.S02.M02 | [Explicit consent capture](mod_consent/SPEC.md) | SPECIFIED | Reusable signed consent statements (signer, subject ref, subject revision hash, statement text key, signature) used by offers, cycles, bookings, rentals. |

## Aggregation

Modules in this subfeature share the feature package `packages/comms` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| bazaar.offer.accepted | F01.S04.M01 | F08.S02.M01 | external |
| bazaar.offer.rejected | F01.S04.M01 | F08.S02.M01 | external |
| bazaar.offer.withdrawn | F01.S04.M01 | F08.S02.M01 | external |
| bazaar.offer.expired | F01.S04.M01 | F08.S02.M01 | external |
| bazaar.negotiation.countered | F01.S04.M02 | F08.S02.M01 | external |
| bazaar.negotiation.closed | F01.S04.M02 | F08.S02.M01 | external |
| mutiny.proposal.revised | F02.S01.M04 | F08.S02.M01 | external |
| mutiny.proposal.accepted | F02.S01.M01 | F08.S02.M01 | external |
| mutiny.proposal.rejected | F02.S01.M01 | F08.S02.M01 | external |
| mutiny.proposal.expired | F02.S01.M01 | F08.S02.M01 | external |
| mutiny.proposal.withdrawn | F02.S01.M01 | F08.S02.M01 | external |
| mutiny.revision.forked | F02.S01.M04 | F08.S02.M01 | external |
| comms.thread.archived | F08.S01.M02 | F08.S02.M01 | external |
| identity.portable_doc.published | F07.S02.M01 | F08.S02.M02 | external |
| identity.device_key.added | F07.S01.M01 | F08.S02.M02 | external |
| identity.device_key.revoked | F07.S01.M01 | F08.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F08.S02.M02 | external |
