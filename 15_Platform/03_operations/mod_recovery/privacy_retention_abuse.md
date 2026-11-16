# PS-122-07 — Privacy, retention and abuse: Disaster recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M03 Disaster recovery](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/recovery` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-122-07.R01** Restore handles only encrypted relay data and the operator's keys, produces a report without payload content, and leaves no plaintext snapshot outside the target directory.
- **PS-122-07.R02** Temporary decrypted files are written only inside the restore target, mode 0600, and the target must be on encrypted or access-restricted storage per the runbook.
- **PS-122-07.R03** Signed tombstones are re-applied before the restored relay serves public projections so deleted content is not resurrected on this relay.

## Specification

**Data classification**
- Restore report: P1 counters, backup ids, timestamps; no content.
- Dead-letter rows: event envelopes with IDs and minimal fields (P0 to P1) kept 30 days.

**Retention**
- Restore reports kept by the operator for at least 1 year (drill evidence, RET-AUDIT).
- Dead letters purged 30 days after dead-lettering.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Restore from a tampered or older malicious snapshot | checksums and GCM authentication, selection limited to records in the backup catalog, signed relay announcements after restore show the same identity |
| T02 | Replay storm overloads consumers or duplicates side effects | limits of 500 per call, 3 replays per event, 500 per minute, inbox idempotency, dry-run |
| T03 | Unauthorized replay to trigger notifications or mutate indexes | operator-only capability with audit entry; replay never edits payloads |
| T04 | Decrypted snapshot left on disk after restore | decrypt only into the target, wipe temp files, runbook step to restrict access, report lists files left |
| T05 | Resurrected deleted content after restore | tombstone re-application before readyz returns 200 and test for it |

**Abuse controls**
- Rate limit 500 replays per minute and 1 restore per target directory.
- Every replay and restore is written to the operator audit log (CTR-CAP-001 CAP-7) with actor, capability and counts only.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-122-09.T10 | abuse | PS-122-07.R03, PS-122-07.R01 | tombstone issued after snapshot, restore then query public projection | tombstone re-applied before readyz 200; deleted projection not served |
| TEST-PS-122-09.T11 | abuse | PS-122-07.R02, PS-122-07.R01 | restore then scan filesystem for plaintext snapshots and temp files | decrypted data only inside target, mode 0600, temp files wiped |

## Dependencies

Module depends on: F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
