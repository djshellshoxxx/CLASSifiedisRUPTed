# F11 — Federation and portability

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `federation`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F11.S01 01_protocol](01_protocol/SPEC.md) — 3 modules
- [F11.S02 02_relay_sync](02_relay_sync/SPEC.md) — 3 modules
- [F11.S03 03_interop](03_interop/SPEC.md) — 3 modules

## Aggregation

The feature is enabled by flag `F11` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F06, F07, F10, F12, F15, F16.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| federation.block_rule.changed | F11.S03.M02 | F11.S01.M02 | internal |
| federation.peer.suspended | F11.S03.M01 | F11.S01.M02 | internal |
| federation.conflict.detected | F11.S02.M03 | F11.S01.M02 | internal |
| federation.conflict.resolved | F11.S02.M03 | F11.S01.M02 | internal |
| federation.account.moved | F11.S03.M03 | F11.S01.M02 | internal |
| identity.portable_doc.published | F07.S02.M01 | F11.S01.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F11.S01.M02 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F11.S01.M02 | external |
| bazaar.listing.expired | F01.S01.M04 | F11.S01.M02 | external |
| services.offering.withdrawn | F03.S01.M01 | F11.S01.M02 | external |
| platform.flag.changed | F15.S04.M02 | F11.S01.M02 | external |
| federation.record.accepted | F11.S01.M02 | F11.S02.M01 | internal |
| federation.tombstone.applied | F11.S01.M02 | F11.S02.M01 | internal |
| federation.peer.added | F11.S03.M01 | F11.S02.M01 | internal |
| federation.peer.suspended | F11.S03.M01 | F11.S02.M01 | internal |
| federation.peer.reinstated | F11.S03.M01 | F11.S02.M01 | internal |
| federation.peer.removed | F11.S03.M01 | F11.S02.M01 | internal |
| federation.account.moved | F11.S03.M03 | F11.S02.M01 | internal |
| identity.portable_doc.published | F07.S02.M01 | F11.S02.M01 | external |
| privacy.consent.withdrawn | F10.S01.M01 | F11.S02.M01 | external |
| platform.flag.changed | F15.S04.M02 | F11.S02.M01 | external |
| federation.account.moved | F11.S03.M03 | F11.S02.M03 | internal |
| identity.portable_doc.published | F07.S02.M01 | F11.S02.M03 | external |
| federation.peer.suspended | F11.S03.M01 | F11.S02.M03 | internal |
| privacy.deletion.completed | F10.S01.M04 | F11.S02.M03 | external |
| federation.record.rejected | F11.S01.M02 | F11.S03.M01 | internal |
| federation.conflict.detected | F11.S02.M03 | F11.S03.M01 | internal |
| federation.delivery.failed | F11.S02.M01 | F11.S03.M01 | internal |
| platform.flag.changed | F15.S04.M02 | F11.S03.M01 | external |
| privacy.deletion.completed | F10.S01.M04 | F11.S03.M01 | external |
| identity.block.added | F07.S02.M02 | F11.S03.M02 | external |
| identity.block.removed | F07.S02.M02 | F11.S03.M02 | external |
| privacy.deletion.completed | F10.S01.M04 | F11.S03.M02 | external |
| identity.portable_doc.published | F07.S02.M01 | F11.S03.M03 | external |
| identity.device_key.revoked | F07.S01.M01 | F11.S03.M03 | external |
| federation.delivery.failed | F11.S02.M01 | F11.S03.M03 | internal |
| federation.conflict.detected | F11.S02.M03 | F11.S03.M03 | internal |
| federation.conflict.resolved | F11.S02.M03 | F11.S03.M03 | internal |
| privacy.deletion.requested | F10.S01.M04 | F11.S03.M03 | external |
| privacy.deletion.cancelled | F10.S01.M04 | F11.S03.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F11.S03.M03 | external |
