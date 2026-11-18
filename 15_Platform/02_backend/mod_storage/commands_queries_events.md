# PS-119-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_storage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R03, R10, R11), CTR-ERR-001, CTR-CAP-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-119-04.R01 | Upload is `POST /v1/blobs` with `Idempotency-Key`; response 202 with `blob_id`. | MVP |
| PS-119-04.R02 | Download is `GET /v1/blobs/{blob_id}` returning bytes only after an owner-scope authorization decision. | MVP |
| PS-119-04.R03 | Responses set `Content-Disposition: inline` only for image types; `X-Content-Type-Options: nosniff` on all. | MVP |
| PS-119-04.R04 | Deletion request `DELETE /v1/blobs/{blob_id}` returns 202 and is idempotent. | MVP |

## Data / schema
Upload: multipart not used; raw body with `Content-Type` and `Content-Length`. Metadata JSON in `X-Blob-Meta` header (≤ 512 bytes): `owner_scope`, `owner_ref`, `client_upload_id`, `data_class`.

## Commands / queries / events
| Command | Idempotency | Errors |
|---|---|---|
| blob.put | (owner_ref, client_upload_id) | PS-119-02 codes, 403, 503 |
| blob.delete | blob_id | 403, 404, 409 (legal hold → `STO.LEGAL_HOLD`, 422) |

Events: `blob.quarantined`, `blob.deleted` (aggregate `blob`).

## States & transitions
Per PS-119-03.

## Validation & errors
Missing `X-Blob-Meta` → `STO.META_REQUIRED` (400). Upload while storage quota exceeded → `STO.QUOTA_EXCEEDED` (429, rate_limited category? no: use 422 unprocessable_state, retryable false).

## Authorization
Upload requires owner-scope capability (`attachment.create`, `listing.update` as declared by owner; CTR-CAP-001 R03). Download requires owner `read` decision.

## Failure, idempotency, concurrency, offline
Repeat upload with same `client_upload_id` returns the existing `blob_id`. Download supports `Range` requests for PDFs only.

## Privacy, retention, abuse
Responses never include `storage_key`, filenames or metadata values. Quota per owner scope: 200 MiB per `acc_` (ASSUMPTION).

## Observability & budgets
Route labels bounded. Download first byte p95 ≤ 300 ms from CDN, ≤ 800 ms origin (ASSUMPTION).

## Tests
- TEST-PS-119-04-01 (contract): response headers on images and PDFs.
- TEST-PS-119-04-02 (integration): same client_upload_id twice → one blob.
- TEST-PS-119-04-03 (security): non-owner download returns 404 identical to missing.

## Acceptance criteria
1. Every response carries `nosniff`.
2. Idempotent upload and delete verified.
3. Quota enforcement at 200 MiB verified.

## Assumptions & open decisions
- ASSUMPTION: quota and latency budgets.
- D05 PROVISIONAL (unapproved): image responses contain no location.
