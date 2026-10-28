# Canonical cross-module contract map

**Status:** local baseline review pending; no approved wire/crypto protocol. All CLASS consumers inherit [ARCH-001..010](CLIENT_SIDE_ARCHITECTURE.md).

| Stable contract | Owner | Canonical specification |
|---|---|---|
| CTR-ID-001 | F15 | CR-001 in [core](contracts/CORE_API_EVENTS_DATA.md): random UUIDv4, local revision/advisory clock |
| CTR-EVT-001 | F15 | CR-003: private local events, separate approved public projection |
| CTR-ERR-001 | F15 | CR-002: typed in-process errors, no mandatory HTTP API |
| CTR-CAP-001 | F16/F07 | CR-005: unlocked local principal, scoped permissions, peer keys not central accounts |
| CTR-SCH-001 | F15 | CR-004: per-vault IndexedDB schema/migrations; semantic consumer review outstanding |
| CTR-PRV-001 | F10 | CR-006 and ARCH: local retention, exact private/public disclosure, no remote-erasure guarantee |
| CTR-COM-001 | F09 | MPF-002 in [evidence](contracts/MESSAGING_PAYMENTS_FEDERATION.md): claim/ack/selected source observations |
| CTR-FED-001 | F11/F16 | MPF-003: public signed interchange; protocol/key profile gated |

[Consumer/event ownership](INTEGRATION_DEPENDENCIES.md) and [test gates](RELEASE_AND_TEST_GATES.md) must agree with each leaf. Stable IDs survive revised local semantics. Old server-issued IDs/cookie sessions/SQL workers never remain implicit requirements. Canonical encryption/backup/peer protocol selection needs independent review, and all 1,480 process contracts still require complete domain-specific specifications.
