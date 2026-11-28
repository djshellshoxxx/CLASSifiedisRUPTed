# F07.S03 — 03_trust

**Status:** SPECIFIED. **Parent:** [F07](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F07.S03.M01 | [Reputation](mod_reputation/SPEC.md) | SPECIFIED | Two-sided reviews only after a completed transaction context (deal/cycle/booking/rental); summary counts and Bayesian average; sybil dampening by account age and linkage. |
| F07.S03.M02 | [Trust evidence](mod_evidence/SPEC.md) | SPECIFIED | Self-attested and third-party signed claims (e.g. 'met in person', 'operator verified email'), no KYC storage. |

## Aggregation

Modules in this subfeature share the feature package `packages/identity` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| commerce.deal.opened | F09.S01.M01 | F07.S03.M01 | external |
| mutiny.cycle.committed | F02.S03.M01 | F07.S03.M01 | external |
| services.booking.confirmed | F03.S02.M01 | F07.S03.M01 | external |
| rentals.reservation.confirmed | F05.S01.M01 | F07.S03.M01 | external |
| commerce.deal.completed | F09.S01.M01 | F07.S03.M01 | external |
| mutiny.cycle.completed | F02.S03.M04 | F07.S03.M01 | external |
| services.booking.completed | F03.S02.M02 | F07.S03.M01 | external |
| rentals.rental.closed | F05.S02.M02 | F07.S03.M01 | external |
| commerce.dispute.resolved | F09.S02.M02 | F07.S03.M01 | external |
| mutiny.recovery.resolved | F02.S03.M04 | F07.S03.M01 | external |
| commerce.deal.cancelled | F09.S01.M01 | F07.S03.M01 | external |
| comms.meetup.no_show | F08.S03.M02 | F07.S03.M01 | external |
| comms.meetup.no_show_contradicted | F08.S03.M02 | F07.S03.M01 | external |
| federation.record.accepted | F11.S01.M02 | F07.S03.M01 | external |
| federation.tombstone.applied | F11.S01.M02 | F07.S03.M01 | external |
| identity.portable_doc.published | F07.S02.M01 | F07.S03.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F07.S03.M01 | external |
| federation.tombstone.applied | F11.S01.M02 | F07.S03.M02 | external |
| identity.portable_doc.published | F07.S02.M01 | F07.S03.M02 | external |
| identity.device_key.revoked | F07.S01.M01 | F07.S03.M02 | external |
| federation.peer.added | F11.S03.M01 | F07.S03.M02 | external |
| federation.peer.removed | F11.S03.M01 | F07.S03.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F07.S03.M02 | external |
