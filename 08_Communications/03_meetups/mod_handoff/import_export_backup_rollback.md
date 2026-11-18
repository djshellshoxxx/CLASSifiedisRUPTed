# PS-065-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11 export; RET-EVD, RET-LEGAL), CTR-SCH-001 (R08 lossless for signed records), CTR-CAP-001, CTR-FED-001 (never federated).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-065-10.R01 | Party export returns lines the party attested or that name the party, with original signed bytes and a lossless view, as `handoff.export` 1.0.0. | MVP |
| PS-065-10.R02 | Export excludes counterparty notes (none exist) and other parties' signatures beyond the counterparty line. | MVP |
| PS-065-10.R03 | Backups encrypted; include lines, signatures, referrals, key history. | MVP |
| PS-065-10.R04 | Restore verifies every signature against key history before cutover. | MVP |
| PS-065-10.R05 | Restore never reopens a `closed` handoff or re-sends a dispute referral already acknowledged by F09. | MVP |
| PS-065-10.R06 | Import of handoff records from rental or other platforms. | Future (blocked on PENDING owner ID) |

## Data / schema
`handoff.export`: `export_id`, `generated_at`, `handoffs[]` (`handoff_id`, `exchange_ref`, `state`, `lines[]` with `signature_original_b64`), `schema_version`.

## Commands / queries / events
`RequestHandoffExport` (party, idempotent); event `handoff.export_ready` with `export_id` only.

## States & transitions
`queued` → `ready` (24 h) → `expired`.

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `HANDOFF.EXPORT_RATE_LIMIT` | true | `err.handoff.export_rate_limit` |
| `HANDOFF.RESTORE_SIGNATURE_FAILED` | false | `err.handoff.restore_signature` |

## Authorization
Export: party. Restore: operator with dual control.

## Failure, idempotency, concurrency, offline
Export idempotent per `export_id`. Restore staged; signature sweep; referral state reconciled with F09 before cutover.

## Privacy, retention, abuse
Export deleted at 24 h (RET-EPH). Backups 35 days (ASSUMPTION); legal hold per RET-LEGAL.

## Observability & budgets
`handoff_export_total{result}`; restore sweep reports counts only.

## Tests
- TEST-PS-065-10-01 (contract): export validates.
- TEST-PS-065-10-02 (integration): exported signature verifies off-platform.
- TEST-PS-065-10-03 (integration): restore with tampered signature aborts.
- TEST-PS-065-10-04 (integration): restore does not re-send acknowledged referral.

## Acceptance criteria
1. Export matches fixtures and carries original signed bytes.
2. Restore aborts on signature failure.
3. No duplicate referrals after restore.
4. Export expires at 24 h.

## Assumptions & open decisions
- ASSUMPTION: backup retention 35 days.
- PROVISIONAL (D06 default, unapproved): lossless signed export.
- PROVISIONAL (D10 default, unapproved): key recovery in mod_recovery.
