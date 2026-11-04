# PS-060-10 — Import, export, backup and rollback: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-10.R01** A user's vault export contains their messages with plaintext inside the export file protected by the user's chosen export encryption, and the matching signed envelopes.
- **PS-060-10.R02** Import validates envelope structure and signatures; messages whose signature fails are kept quarantined and messages not addressed to the importer's devices are kept as undecryptable history.
- **PS-060-10.R03** Schema changes follow expand and contract; the alg field allows adding algorithms without breaking v1 readers, and relays only ever hold 30 days of ciphertext so relay loss loses no user-owned records.

## Specification

- **export:** Section comms.messages in classrup-export/v1; one line per Message (schema classrup.comms.message/v1) with body and signed envelope; export is the primary backup (IOX-6) and is encrypted with a user-chosen passphrase or the recovery kit key.
- **import:** Envelopes are verified for schema and signature; existing IDs are skipped; failed signatures are kept quarantined; messages are never re-wrapped or re-sent on import.
- **backup:** The vault export is the backup; relay mailboxes are covered by the relay SQLite backup (CTR-IOX-001 IOX-3, IOX-7) and contain only ciphertext expiring in 30 days.
- **migration rollback:** Additive optional fields only in v1; a new alg value is introduced behind a tenant flag and older clients ignore messages with unknown alg and show an unsupported-message notice; rollback is safe because unknown algs remain stored.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T16 | integration | PS-060-10.R01, PS-060-10.R02, PS-060-10.R03 | export, re-import into fresh vault, restore from backup | messages round trip identical; import quarantines envelopes with invalid signatures |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
