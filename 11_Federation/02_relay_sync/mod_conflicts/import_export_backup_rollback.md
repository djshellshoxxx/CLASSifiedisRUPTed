# PS-086-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_conflicts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R08 hash chain, R13 export re-keying), CTR-FED-001 (R06, R07, R08), CTR-SCH-001 (R07, R08), CTR-PRV-001 (R06 backups, R07 holds).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-086-10.R01 | Conflict records are not exported to peers. Only the two original signed envelopes are exportable as evidence to a steward-approved recipient, through PS-086-05 `evidence_read`. | MVP |
| PS-086-10.R02 | Conflict records and evidence are included in backups. Restore is refused if the restored record set does not match the hash manifest for that backup. | MVP |
| PS-086-10.R03 | Backup RPO ≤ 5 min and RTO ≤ 4 h for conflict records (ASSUMPTION; matches PS-085-10). | MVP |
| PS-086-10.R04 | A restore never removes a quarantine that is in force, and never closes a conflict without its review record. | MVP |
| PS-086-10.R05 | Tombstones and conflicts restored together; restored tombstone keeps `FED.TOMBSTONE_ON_ARRIVAL` behaviour for later copies. | MVP |

## Data / schema
Export package (steward evidence only): both envelopes as stored bytes, `cfl_id`, digests, timestamps, `kind`. No `idempotency_key` or `correlation_id` is added. Backup manifest: record count, hash per record, retention class.

## Commands / queries / events
Evidence export runs as a `federation_conflict.evidence_read` operation with dual control. Restore runs through F15 backup tooling (PENDING F15 runbook).

## Validation & errors
Restore manifest mismatch → `CONFLICTS.REVIEW_REQUIRED` for the affected records and a block on restore.

## Authorization
Export and restore require two distinct `ope_` approvers (PS-086-05).

## Failure, idempotency, concurrency, offline
- Restore is idempotent: second run yields the same state.
- Rollback of a schema change does not alter stored envelope bytes (CTR-SCH-001 R07).
- Hold queue is not restored as live; held events older than 24 h at restore time are rejected with `CONFLICTS.REVISION_GAP`.
- Hash chain break (CTR-EVT-001 R08) on restore → refuse restore and open a review.

## Privacy, retention, abuse
Evidence export is logged as a privileged read with purpose. Backups follow CTR-PRV-001 R06. Holds (R07) can extend RET-EVD for a named matter only.

## Observability & budgets
`fed_restore_manifest_mismatch_total`. Restore duration logged per run.

## Tests
- TEST-PS-086-10-01 (integration): backup then restore reproduces records and manifest hashes.
- TEST-PS-086-10-02 (integration): tampered backup record → restore refused.
- TEST-PS-086-10-03 (integration): restore cannot lift an in-force quarantine.
- TEST-PS-086-10-04 (integration): evidence export with one approver refused.
- TEST-PS-086-10-05 (integration): restored tombstone blocks a later copy with `FED.TOMBSTONE_ON_ARRIVAL`.

## Acceptance criteria
1. Restore is manifest-exact; TEST-PS-086-10-01 and -02 pass.
2. No restore lifts a quarantine; TEST-PS-086-10-03 passes.
3. Evidence export is dual-control; TEST-PS-086-10-04 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: RPO and RTO above (F15 to confirm).
- PROVISIONAL (D07 default, unapproved): retention per PS-086-07.
- OPEN: whether evidence may be shared with another node operator at all (default: no, stewards only).
