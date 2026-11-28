# F08 — Communications

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `comms`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F08.S01 01_messaging](01_messaging/SPEC.md) — 3 modules
- [F08.S02 02_negotiation](02_negotiation/SPEC.md) — 2 modules
- [F08.S03 03_meetups](03_meetups/SPEC.md) — 3 modules

## Aggregation

The feature is enabled by flag `F08` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F01, F02, F06, F07, F09, F10, F11, F12, F15, F16.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| identity.portable_doc.published | F07.S02.M01 | F08.S01.M01 | external |
| identity.device_key.added | F07.S01.M01 | F08.S01.M01 | external |
| identity.device_key.revoked | F07.S01.M01 | F08.S01.M01 | external |
| identity.block.added | F07.S02.M02 | F08.S01.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F08.S01.M01 | external |
| mutiny.party.joined | F02.S01.M02 | F08.S01.M02 | external |
| mutiny.party.left | F02.S01.M02 | F08.S01.M02 | external |
| mutiny.cycle.cancelled | F02.S03.M03 | F08.S01.M02 | external |
| mutiny.cycle.completed | F02.S03.M04 | F08.S01.M02 | external |
| services.booking.cancelled | F03.S02.M01 | F08.S01.M02 | external |
| services.booking.completed | F03.S02.M02 | F08.S01.M02 | external |
| rentals.rental.closed | F05.S02.M02 | F08.S01.M02 | external |
| bazaar.listing.archived | F01.S01.M04 | F08.S01.M02 | external |
| identity.block.added | F07.S02.M02 | F08.S01.M02 | external |
| federation.delivery.failed | F11.S02.M01 | F08.S01.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F08.S01.M03 | external |
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
| comms.thread.archived | F08.S01.M02 | F08.S02.M01 | internal |
| identity.portable_doc.published | F07.S02.M01 | F08.S02.M02 | external |
| identity.device_key.added | F07.S01.M01 | F08.S02.M02 | external |
| identity.device_key.revoked | F07.S01.M01 | F08.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F08.S02.M02 | external |
| security.role.assigned | F16.S01.M01 | F08.S03.M01 | external |
| security.role.revoked | F16.S01.M01 | F08.S03.M01 | external |
| identity.block.added | F07.S02.M02 | F08.S03.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F08.S03.M02 | external |
| comms.consent.received | F08.S02.M02 | F08.S03.M03 | internal |
| comms.consent.revoked | F08.S02.M02 | F08.S03.M03 | internal |
| comms.thread.archived | F08.S01.M02 | F08.S03.M03 | internal |
| identity.block.added | F07.S02.M02 | F08.S03.M03 | external |
| mutiny.cycle.cancelled | F02.S03.M03 | F08.S03.M03 | external |
| services.booking.cancelled | F03.S02.M01 | F08.S03.M03 | external |
| rentals.reservation.cancelled | F05.S01.M01 | F08.S03.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F08.S03.M03 | external |
