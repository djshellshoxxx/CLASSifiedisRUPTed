# PS-085-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R05, R08 hash chain, R13 export re-keying), CTR-FED-001 (R04, R08, R09), CTR-SCH-001 (R05–R09 compatibility, R07 no rewrite, R08 lossless evidence), CTR-PRV-001 (R06 backups, R07 holds).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-085-10.R01 | Export emits the signed bytes exactly as stored. Re-export of the same event yields identical bytes (determinism from PS-085-04 R03). | MVP |
| PS-085-10.R02 | Import verifies each event through PS-085-02 before storing. Stored `signature` bytes are kept verbatim (CTR-SCH-001 R07, R08). | MVP |
| PS-085-10.R03 | Key projection backup: RPO ≤ 5 min (ASSUMPTION), RTO ≤ 4 h (ASSUMPTION). Private keys are backed up only as KMS-wrapped material under F16 procedure. Public projection restore is followed by re-verifying a sample of 100 events per key. | MVP |
| PS-085-10.R04 | Compromise markings and revocations are not rolled back. They are irreversible, like tombstones (CTR-FED-001 R07). A restore that would remove a marking is refused. | MVP |
| PS-085-10.R05 | Signing-input version change is MAJOR (CTR-SCH-001). `v1` verification stays available for all historical events. New version is gated by a feature flag (CTR-FED-001 R01). | MVP |
| PS-085-10.R06 | Rollback of a key rotation restores the previous key's `valid_until` only if that key is not revoked or compromised. | MVP |

## Data / schema
Export package fields: `envelope` (JCS-canonical bytes), `signature`, `key_id`, `audience`, `schema_version`. No `idempotency_key`, no `correlation_id` (CTR-FED-001 R08). Backup set: key projection rows, outbox state, verification audit records.

## Commands / queries / events
Export and import run through `fed.send_batch` and `fed.receive_batch` (CTR-FED-001). Restore runs through F15 backup tooling (PENDING F15 runbook).

## Validation & errors
Import failures return per-event results (PS-085-02). Restore validation errors block the restore and name the failing table only.

## Authorization
Restore and rollback require `federation_key.administer` with dual control (PS-085-05).

## Failure, idempotency, concurrency, offline
- Partial import: each event commits or is rejected on its own (PS-085-06 R04).
- Restore is idempotent: running it twice yields the same projection.
- Rollback during active export: outbox held rows are not released until re-verified.
- Hash chain (CTR-EVT-001 R08): a restore that breaks the chain is refused and triggers review.

## Privacy, retention, abuse
Backups follow CTR-PRV-001 R06. Private key backups are encrypted under KMS. Holds (R07) can extend retention of compromise evidence; they never extend private key retention.

## Observability & budgets
`fed_restore_verify_sample_failures_total`. Restore timing recorded per run.

## Tests
- TEST-PS-085-10-01 (integration): export → import round trip keeps bytes identical and verifies.
- TEST-PS-085-10-02 (integration): restore from backup, then re-verify a 100-event sample per key; zero failures.
- TEST-PS-085-10-03 (integration): rollback attempt on a compromised marking is refused.
- TEST-PS-085-10-04 (contract): `v2` signing-input flag off → only `v1` signatures produced; historical `v1` events verify.
- TEST-PS-085-10-05 (integration): rotation rollback with compromised prior key refused.

## Acceptance criteria
1. Round trip is byte-identical; TEST-PS-085-10-01 passes.
2. No compromise marking is removed by any restore; TEST-PS-085-10-03 and -05 pass.
3. Historical signatures remain verifiable after a version change; TEST-PS-085-10-04 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: RPO and RTO above (F15 to confirm).
- PROVISIONAL (D07 default, unapproved): retention classes per PS-085-07.
- OPEN (D10): recovery and rotation for user-controlled keys, if in scope.
