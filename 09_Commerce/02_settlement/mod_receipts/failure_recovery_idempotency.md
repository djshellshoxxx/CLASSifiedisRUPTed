# PS-071-06 — failure, recovery, idempotency and offline behavior

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_receipts (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-SCH-001 (R07, R08), CTR-COM-001 (Failure section). **Decisions:** D08 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-071-06.R01 | Upload is resumable in 5 MiB chunks; a resumed upload reuses the same `evd_` ID. | MVP |
| PS-071-06.R02 | Partial uploads expire after 24 h and their blobs are deleted. | MVP |
| PS-071-06.R03 | Receipt signing is deterministic: same claim body and key produce the same signature input (JCS). | MVP |
| PS-071-06.R04 | Offline evidence may be captured locally (D08) and finalized only after server acknowledgment; the local copy is encrypted at rest. | MVP |
| PS-071-06.R05 | Upload retries use exponential backoff (base 2 s, max 5 attempts). | MVP |

## Data / schema
Upload session: `evd_id`, `expected_sha256`, `bytes_received`, `expires_at`.

## Commands / queries / events
Idempotency keys per upload chunk and finalize.

## States & transitions
`pending_upload` → `stored` (finalize) or → `expired` (24 h).

## Validation & errors
`RECEIPT.DIGEST_MISMATCH` (non-retryable), `SYS.UNAVAILABLE` (retryable).

## Authorization
Resume requires the same session token; expired session returns `SYS.GONE`.

## Failure, idempotency, concurrency, offline
Duplicate finalize returns original `evd_`. Concurrent redact and attest: revision check.

## Privacy, retention, abuse
Local encrypted copies are removed on acknowledgment.

## Observability & budgets
Resume rate and expiry count per day.

## Tests
- TEST-PS-071-06-01 (integration): kill connection at 50%; resume completes with same `evd_`.
- TEST-PS-071-06-02 (integration): session expires at 24 h; blob removed.
- TEST-PS-071-06-03 (property): signing input identical across two runs.
- TEST-PS-071-06-04 (integration): offline capture uploads once after reconnect.

## Acceptance criteria
1. No duplicate `evd_` on resume.
2. Expired blobs gone from storage (scan).
3. Signature determinism verified.

## Assumptions & open decisions
- ASSUMPTION: 5 MiB chunks; 24 h session.
- D08 (PROVISIONAL default, unapproved).
