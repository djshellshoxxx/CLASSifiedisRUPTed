# PS-010-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_negotiation. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (portability R11, deletion R06 and R12, legal hold R07), CTR-SCH-001 (migration, versioning), CTR-EVT-001 (immutability, corrections), CTR-FED-001 (no inbound negotiation events), CTR-ID-001.

**Decision labels:** Export format and backup windows are ASSUMPTION values. Portability scope follows PROVISIONAL D07 default (unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-010-10.R01 | Owner export includes the owner's own negotiations (as initiator or seller), each with full terms history and state, in CTR-SCH-001 JSON format. | MVP |
| PS-010-10.R02 | Export redacts counterparty identity to the counterparty's `prf_` view (CTR-PRV-001 R11). No other buyers' data appears. | MVP |
| PS-010-10.R03 | Export excludes minimized and deleted records and includes a deletion summary (counts and IDs, no content) per CTR-PRV-001 R12. | MVP |
| PS-010-10.R04 | No import of negotiation records from users or peers. Only platform restore may write negotiation records (see R06). | MVP |
| PS-010-10.R05 | Backups include the event stream and idempotency records. Restore replays deletions recorded after the backup point (CTR-PRV-001 R06, BT-04). | MVP |
| PS-010-10.R06 | Feature rollback: operator flag off stops writes (`NEG.FEATURE_DISABLED`) and keeps reads. Existing `AWAITING_RESPONSE` negotiations freeze until the flag returns or the expiry job runs. | MVP |
| PS-010-10.R07 | Corrections to AGREED or other terminal states are new compensating events, never edits (CTR-EVT-001 R08). | MVP |

## Data / schema
Export document: `{schema_id:"negotiation.export", schema_version, owner_pseudonym, negotiations:[negotiation + terms[]], events:[{event_type, revision, occurred_at}], deletion_summary:{count, ids}}`. Schema registered per CTR-SCH-001 R01 (PENDING registry entry). Export contains no `acc_` of counterparties.

## Commands / queries / events
- `negotiation.export` (owner request, `negotiation.read` on own records) → signed local export; asynchronous; idempotent by request key.
- No import command exists. Inbound `negotiation.*` events from federation peers are rejected (CTR-FED-001 R02, R03).
- Restore is an operator procedure, not an API command.

## States & transitions
Rollback does not change state. Flag-off freezes `AWAITING_RESPONSE`; resumption continues from stored `response_deadline`. Expired deadlines during freeze expire on resume (no reopen).

## Validation & errors
Export request errors: `SYS.NOT_FOUND` for others' IDs; `SYS.RATE_LIMITED` for export frequency (ASSUMPTION: 1 per 24 h). Writes during freeze: `NEG.FEATURE_DISABLED` (retryable true).

## Authorization
Export is owner-only. Operator restore needs dual control and purpose (CTR-CAP-001 R06, R07). Federation peers have no capability (PS-010-05 R08).

## Failure, idempotency, concurrency, offline
- Export job is idempotent by (actor, request key); a repeated request returns the same export ID.
- Backup restore must reproduce the same revision numbers and event hash chain; a mismatch halts restore and alerts.
- Schema MAJOR upgrades: upcast on read, stored bytes never rewritten (CTR-SCH-001 R07). Golden fixtures per migration path (R09).
- Recovery point objective and recovery time objective: ASSUMPTION RPO 15 min, RTO 4 h for this module's data, to be aligned with platform F15.

## Privacy, retention, abuse
Export files are personal data at owner's class: RET-OPS for generated export files (7 days, ASSUMPTION), then deleted. Backups follow platform backup expiry; deleted negotiations are replayed out at restore (R05). Export downloads are authorized per request and logged as `aud_` IDs only.

## Observability & budgets
`negotiation_export_jobs_total{outcome}`, `negotiation_restore_hash_mismatch_total` (must be 0), `negotiation_flag_frozen_gauge`. Export generation p95 ≤ 30 s for ≤ 500 negotiations (ASSUMPTION).

## Tests
- TEST-PS-010-10-01 (export scope): owner export contains own negotiations and no other buyer's record.
- TEST-PS-010-10-02 (redaction): counterparty appears only as `prf_` view.
- TEST-PS-010-10-03 (deletion summary): deleted record appears only as count and ID.
- TEST-PS-010-10-04 (no import): inbound negotiation events from a peer are rejected; no user import route exists (route inventory test).
- TEST-PS-010-10-05 (restore): backup restore reproduces revisions and hash chain; deletions after backup point are re-applied.
- TEST-PS-010-10-06 (flag rollback): flag off → writes return `NEG.FEATURE_DISABLED`, reads succeed, expiry still runs on resume.
- TEST-PS-010-10-07 (compensation): correction to AGREED appends an event; prior event bytes unchanged.
- TEST-PS-010-10-08 (migration): golden fixtures for each supported `from` version upcast on read; stored bytes unchanged.

## Acceptance criteria
1. Export never contains other buyers or counterparty `acc_` IDs (TEST-PS-010-10-02).
2. No negotiation import path exists for users or peers (TEST-PS-010-10-04).
3. Restore hash mismatch count is zero in drill (TEST-PS-010-10-05).
4. TEST-PS-010-10-01 through -08 pass.

## Assumptions & open decisions
- PENDING CTR-SCH-001: `negotiation.export` registry entry.
- ASSUMPTION: 7-day export file retention, 24 h export frequency, RPO 15 min, RTO 4 h.
- PROVISIONAL (D07 default, unapproved): retention classes as in PS-010-07.
- OPEN (D10): user-controlled key recovery affects export signing; not decided here.
