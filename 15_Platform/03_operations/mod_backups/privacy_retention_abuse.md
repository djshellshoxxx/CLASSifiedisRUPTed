# PS-120-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_backups (F15.S03.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-120-07.R01 | Every backup set is encrypted with AES-256-GCM using a per-set data key wrapped by a KMS key under F16 (mod_management). | MVP |
| PS-120-07.R02 | Backups include PRIVATE_PERSONAL, FINANCIAL_EVIDENCE and LOCATION_PRECISE data as the disclosure matrix allows (encrypted). LOCATION_PRECISE sets are excluded from analytics restores. | MVP |
| PS-120-07.R03 | Default retention 35 days for full sets and 35 days after the parent expires for incrementals (ASSUMPTION, D07 PROVISIONAL). | MVP |
| PS-120-07.R04 | Deletions and legal holds are recorded in a tombstone list kept for the longest retention of any set that could contain the deleted record (CTR-PRV-001 R06, BT-04). | MVP |
| PS-120-07.R05 | Restore replays deletions and holds before serving data (see PS-122). | MVP |
| PS-120-07.R06 | Signed evidence (CTR-COM-001 claims, CTR-EVT-001 envelopes) is stored byte-identical; no transform that breaks signatures. | MVP |
| PS-120-07.R07 | Key rotation for platform backup KEKs at least every 365 days (ASSUMPTION). | MVP |

## Data / schema
Retention class: RET-AUD for manifest metadata (12 months), RET-PRIV/RET-LOC/RET-EVD follow the content class for objects.

## Commands / queries / events
Purge follows PS-120-03. Deletion completion records (CTR-PRV-001 R12) cover live stores only; backup deletion is recorded as `backup.purged`.

## States & transitions
See PS-120-03 `expired` and `purged`.

## Validation & errors
`PRV.HOLD_SCOPE_INVALID` (CTR-PRV-001) when a hold lacks scope or end date.

## Authorization
See PS-120-05. Owner export does not read backup sets; it uses live data (CTR-PRV-001 R11).

## Failure, idempotency, concurrency, offline
Not applicable (server-side). Expiry sweep is idempotent.

## Privacy, retention, abuse
Abuse: a stolen backup is a full data breach. Mitigations: per-scope KEKs, dual-control unwrap, no export path (PS-120-05 R06), access logging.

## Observability & budgets
Metric: `backup_expired_bytes_total`. No identifiers in metrics.

## Tests
- TEST-PS-120-07-01 (negative): backup object scan finds no plaintext SECRET value.
- TEST-PS-120-07-02 (integration): record deleted after backup is absent after restore (tombstone replay).
- TEST-PS-120-07-03 (privacy): LOCATION_PRECISE sets absent from analytics restore fixture.
- TEST-PS-120-07-04 (integrity): signed evidence object hash unchanged across backup and restore.

## Acceptance criteria
1. No plaintext SECRET or unencrypted object in backup storage (TEST-01).
2. TEST-PS-120-07-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 35-day retention; 365-day KEK rotation.
- PROVISIONAL (D07 default, unapproved). Legal retention periods OPEN (R07 jurisdiction review).
- OPEN (D10): recovery of wrapped keys if KMS access is lost.
