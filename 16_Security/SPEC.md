# F16 — Security architecture

**Status:** SPECIFIED. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** `security`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Subfeatures

- [F16.S01 01_authz](01_authz/SPEC.md) — 2 modules
- [F16.S02 02_cryptography](02_cryptography/SPEC.md) — 3 modules
- [F16.S03 03_assurance](03_assurance/SPEC.md) — 3 modules

## Aggregation

The feature is enabled by flag `F16` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: F07, F08, F10, F11, F12, F15, F18.

### Cross-subfeature and external events

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| identity.session.revoked | F07.S01.M02 | F16.S01.M01 | external |
| identity.portable_doc.published | F07.S02.M01 | F16.S01.M01 | external |
| moderation.action.applied | F12.S02.M01 | F16.S01.M01 | external |
| moderation.action.reverted | F12.S02.M01 | F16.S01.M01 | external |
| privacy.legal_hold.placed | F10.S01.M02 | F16.S01.M01 | external |
| privacy.legal_hold.released | F10.S01.M02 | F16.S01.M01 | external |
| identity.device_key.added | F07.S01.M01 | F16.S02.M02 | external |
| identity.device_key.revoked | F07.S01.M01 | F16.S02.M02 | external |
| identity.portable_doc.published | F07.S02.M01 | F16.S02.M02 | external |
| federation.peer.added | F11.S03.M01 | F16.S02.M02 | external |
| federation.peer.removed | F11.S03.M01 | F16.S02.M02 | external |
| platform.relay_identity.rotated | F15.S02.M01 | F16.S02.M02 | external |
| platform.relay_identity.rotated | F15.S02.M01 | F16.S03.M02 | external |
| security.key.revoked | F16.S02.M02 | F16.S03.M02 | internal |
| moderation.rate.exceeded | F12.S03.M03 | F16.S03.M02 | external |
| federation.record.rejected | F11.S01.M02 | F16.S03.M02 | external |
| federation.peer.suspended | F11.S03.M01 | F16.S03.M02 | external |
| identity.session.revoked | F07.S01.M02 | F16.S03.M02 | external |
| security.role.assigned | F16.S01.M01 | F16.S03.M02 | internal |
| security.role.revoked | F16.S01.M01 | F16.S03.M02 | internal |
