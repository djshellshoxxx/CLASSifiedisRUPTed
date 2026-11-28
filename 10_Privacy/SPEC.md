# F10 — Privacy and data rights

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `privacy`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F10.S01 01_data_controls](01_data_controls/SPEC.md) — 4 modules
- [F10.S02 02_security_boundaries](02_security_boundaries/SPEC.md) — 3 modules

## Aggregation

The feature is enabled by flag `F10` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F07, F11, F12, F15, F16, F18.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| notify.channel.opted_out | F13.S02.M03 | F10.S01.M01 | external |
| security.role.revoked | F16.S01.M01 | F10.S01.M02 | external |
| platform.tenant.configured | F15.S04.M03 | F10.S01.M02 | external |
| governance.jurisdiction_profile.activated | F18.S01.M01 | F10.S01.M02 | external |
| federation.tombstone.applied | F11.S01.M02 | F10.S01.M02 | external |
| identity.device_key.revoked | F07.S01.M01 | F10.S01.M03 | external |
| mutiny.cycle.completed | F02.S03.M04 | F10.S01.M04 | external |
| mutiny.cycle.cancelled | F02.S03.M03 | F10.S01.M04 | external |
| commerce.deal.completed | F09.S01.M01 | F10.S01.M04 | external |
| commerce.deal.cancelled | F09.S01.M01 | F10.S01.M04 | external |
| commerce.dispute.resolved | F09.S02.M02 | F10.S01.M04 | external |
| rentals.rental.closed | F05.S02.M02 | F10.S01.M04 | external |
| rentals.reservation.cancelled | F05.S01.M01 | F10.S01.M04 | external |
| services.booking.completed | F03.S02.M02 | F10.S01.M04 | external |
| services.booking.cancelled | F03.S02.M01 | F10.S01.M04 | external |
