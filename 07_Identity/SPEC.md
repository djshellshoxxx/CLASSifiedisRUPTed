# F07 — Identity and reputation

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `identity`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F07.S01 01_accounts](01_accounts/SPEC.md) — 3 modules
- [F07.S02 02_profiles](02_profiles/SPEC.md) — 2 modules
- [F07.S03 03_trust](03_trust/SPEC.md) — 2 modules

## Aggregation

The feature is enabled by flag `F07` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F06, F09, F10, F11, F15, F16.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| privacy.deletion.completed | F10.S01.M04 | F07.S01.M01 | external |
| identity.portable_doc.published | F07.S02.M01 | F07.S01.M02 | internal |
| security.role.assigned | F16.S01.M01 | F07.S01.M02 | external |
| security.role.revoked | F16.S01.M01 | F07.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F07.S01.M02 | external |
| identity.portable_doc.published | F07.S02.M01 | F07.S01.M03 | internal |
| privacy.deletion.completed | F10.S01.M04 | F07.S01.M03 | external |
| identity.device_key.added | F07.S01.M01 | F07.S02.M01 | internal |
| identity.device_key.revoked | F07.S01.M01 | F07.S02.M01 | internal |
| identity.pseudonym.changed | F07.S01.M01 | F07.S02.M01 | internal |
| privacy.deletion.completed | F10.S01.M04 | F07.S02.M01 | external |
| identity.account.created | F07.S01.M01 | F07.S02.M02 | internal |
| identity.pseudonym.changed | F07.S01.M01 | F07.S02.M02 | internal |
| discovery.location.updated | F06.S02.M02 | F07.S02.M02 | external |
| moderation.action.applied | F12.S02.M01 | F07.S02.M02 | external |
| moderation.action.reverted | F12.S02.M01 | F07.S02.M02 | external |
| federation.tombstone.applied | F11.S01.M02 | F07.S02.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F07.S02.M02 | external |
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
| identity.portable_doc.published | F07.S02.M01 | F07.S03.M01 | internal |
| privacy.deletion.completed | F10.S01.M04 | F07.S03.M01 | external |
| federation.tombstone.applied | F11.S01.M02 | F07.S03.M02 | external |
| identity.portable_doc.published | F07.S02.M01 | F07.S03.M02 | internal |
| identity.device_key.revoked | F07.S01.M01 | F07.S03.M02 | internal |
| federation.peer.added | F11.S03.M01 | F07.S03.M02 | external |
| federation.peer.removed | F11.S03.M01 | F07.S03.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F07.S03.M02 | external |
