# PS-119-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_storage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001 (R03, R10), CTR-ID-001 (R01).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-119-02.R01 | MIME allow-list: `image/jpeg`, `image/png`, `image/webp`, `application/pdf` (evidence scope only). Anything else → rejected. | MVP |
| PS-119-02.R02 | Type is determined by magic-byte sniffing; the declared `Content-Type` must match or the upload is rejected. | MVP |
| PS-119-02.R03 | Size limits: images ≤ 10 MiB; PDF ≤ 10 MiB (ASSUMPTION). | MVP |
| PS-119-02.R04 | SVG, HTML, script and archive types are refused in all cases (active-content risk). | MVP |
| PS-119-02.R05 | Images are decoded and re-encoded with all metadata removed (EXIF, XMP, GPS, device serials) before storage. | MVP |
| PS-119-02.R06 | Image dimension ≤ 6000 × 6000 px and ≤ 36 MP decoded (decompression-bomb guard, ASSUMPTION). | MVP |

## Data / schema
Upload request: `{ "owner_scope": "listing", "owner_ref": "lst_…", "client_upload_id": "…", "data_class": "PUBLIC" }` plus body bytes. Response: `{ "blob_id": "blb_…", "state": "PENDING_SCAN" }`.

## Commands / queries / events
`blob.put` validation order: size (headers) → magic bytes → allow-list → decode limits → metadata strip → digest → owner check → write.

## States & transitions
Not applicable to validation.

## Validation & errors
| Rule | Code | HTTP | Category | Retryable |
|---|---|---|---|---|
| Size over limit | STO.TOO_LARGE | 413 | payload_too_large | false |
| Type not allowed | STO.MIME_NOT_ALLOWED | 400 | validation | false |
| Sniffed type ≠ declared | STO.MIME_MISMATCH | 400 | validation | false |
| Active content | STO.ACTIVE_CONTENT_REFUSED | 400 | validation | false |
| Decode limit | STO.DECODE_LIMIT | 422 | unprocessable_state | false |
| Metadata strip failure | STO.STRIP_FAILED | 422 | unprocessable_state | false |
| Data class below owner class | STO.CLASS_DOWNGRADE | 400 | validation | false |

Messages never include filenames or metadata values (CTR-ERR-001 R07).

## Authorization
Validation runs after authentication and before owner-scope authorization (for size only, to bound memory). Owner-scope check precedes write.

## Failure, idempotency, concurrency, offline
Validation is deterministic. Partial upload (connection drop) is discarded; no partial blob row.

## Privacy, retention, abuse
Original upload bytes are discarded after successful strip; decoded buffers are zeroed. Declared filenames are not stored.

## Observability & budgets
Counter `stored_validation_rejections_total{code}`. Validation p95 ≤ 150 ms for a 10 MiB JPEG (ASSUMPTION).

## Tests
- TEST-PS-119-02-01 (unit): each rule row.
- TEST-PS-119-02-02 (security): polyglot file (JPEG header + HTML) refused.
- TEST-PS-119-02-03 (security): decompression-bomb fixture refused within limits.
- TEST-PS-119-02-04 (privacy): GPS-tagged JPEG output has no GPS tags.

## Acceptance criteria
1. Stripped output verified with metadata parser: zero EXIF/XMP/GPS entries.
2. All security fixtures refused with the listed code.
3. Validation rejects before decoding if size exceeds limit.

## Assumptions & open decisions
- ASSUMPTION: size and dimension limits.
- D05 PROVISIONAL (default: user-initiated precision disclosure; unapproved): location is stripped by default from all images.
