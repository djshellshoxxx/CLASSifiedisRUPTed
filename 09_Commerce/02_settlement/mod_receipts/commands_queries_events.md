# PS-071-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_receipts (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (`clm.submit`, `clm.attest`), CTR-EVT-001 (R02, R03, R10), CTR-SCH-001, CTR-ERR-001. **Decisions:** D06 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-071-04.R01 | `evd.upload` is a two-step command: create upload session (returns `evd_` ID and expected SHA-256), then finalize with digest match. | MVP |
| PS-071-04.R02 | `evd.redact` replaces content with a tombstone, keeps `evd_` ID and digest, and emits `evd.redacted`. | MVP |
| PS-071-04.R03 | `receipt.export` returns a signed bundle; it emits `receipt.exported` with count only. | MVP |
| PS-071-04.R04 | Events carry `max_data_class` FINANCIAL_EVIDENCE; none is federated. | MVP |

## Data / schema
Schema `evidence_item` 1.0.0 (fields per PS-071-01). Bundle format: JSON object with `receipts[]`, `manifest_sha256`, `schema_version`.

## Commands / queries / events
| Command | Event | Expected revision | Idempotency |
|---|---|---|---|
| `evd.upload` (create, finalize) | `evd.uploaded` | null, then required | actor + key |
| `evd.redact` | `evd.redacted` | required | actor + key |
| `receipt.export` | `receipt.exported` | n/a | actor + key |
| `receipt.get` (query) | none | n/a | n/a |
| `clm.submit`, `clm.attest` | per CTR-COM-001 | per CTR-COM-001 | per CTR-COM-001 |

## States & transitions
Evidence upload states: `pending_upload`, `stored`, `redacted`. See PS-071-03 for claim states.

## Validation & errors
Shared codes: `RECEIPT.EVIDENCE_TYPE`, `RECEIPT.EVIDENCE_LIMIT`, `SYS.PAYLOAD_TOO_LARGE`, `SYS.CONFLICT`.

## Authorization
Per PS-071-05.

## Failure, idempotency, concurrency, offline
Upload finalize with a digest mismatch returns `RECEIPT.DIGEST_MISMATCH` and deletes the blob.

## Privacy, retention, abuse
Events carry IDs, digests and enums only.

## Observability & budgets
Latency p95 ≤ 500 ms for finalize (ASSUMPTION, excluding network transfer).

## Tests
- TEST-PS-071-04-01 (contract): upload session and finalize schemas validate.
- TEST-PS-071-04-02 (unit): digest mismatch deletes blob and returns `RECEIPT.DIGEST_MISMATCH`.
- TEST-PS-071-04-03 (integration): redaction keeps digest and removes content.
- TEST-PS-071-04-04 (contract): no event payload contains file names or EXIF data.

## Acceptance criteria
1. Command table implemented.
2. Redaction preserves digest, removes content.
3. Export signatures verify.

## Assumptions & open decisions
- ASSUMPTION: `evidence_item` schema starts at 1.0.0.
- D06 (PROVISIONAL, unapproved).
