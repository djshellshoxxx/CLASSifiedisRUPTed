# PS-059-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_attachments. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001 (LOCATION_PRECISE must not enter stored metadata), CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-059-02.R01 | MIME type is determined by content sniffing, not the client or file extension; sniffed type must be in the allowlist. | MVP |
| PS-059-02.R02 | Byte size ≤ 10 MiB per file; ≤ 5 files and ≤ 25 MiB per message; checked before full upload is accepted. | MVP |
| PS-059-02.R03 | Images: decode succeeds, pixel count ≤ 40 megapixels, dimensions ≤ 8,000 per side; decompression bomb limit enforced during decode. | MVP |
| PS-059-02.R04 | Images are re-encoded to the stored format with metadata stripped; PDFs are rejected if they contain JavaScript, embedded files or launch actions. | MVP |
| PS-059-02.R05 | Antivirus scan must return `passed` before the attachment becomes available (see PS-059-03). | MVP |
| PS-059-02.R06 | File name sanitized: NFC, control characters removed, ≤ 100 code points; path separators removed. | MVP |
| PS-059-02.R07 | Attachments are not scanned for contact patterns in MVP (ASSUMPTION); message text rules belong to mod_private. | MVP |

## Data / schema
Maps to [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `InitiateUpload`, `UploadChunk`, `CompleteUpload` ([commands_queries_events.md](commands_queries_events.md)).

## States & transitions
Validation runs at each upload step; failure moves the upload to `rejected`.

## Validation & errors
| Code | `retryable` | `message_key` | `details[].rule` |
|---|---|---|---|
| `ATTACH.TYPE_NOT_ALLOWED` | false | `err.attach.type_not_allowed` | `mime` |
| `ATTACH.TOO_LARGE` | false | `err.attach.too_large` | `size` |
| `ATTACH.QUOTA_EXCEEDED` | true | `err.attach.quota_exceeded` | `count` or `total` |
| `ATTACH.IMAGE_INVALID` | false | `err.attach.image_invalid` | `decode` |
| `ATTACH.PDF_ACTIVE_CONTENT` | false | `err.attach.pdf_active` | `pdf_feature` |
| `ATTACH.SCAN_PENDING` | true | `err.attach.scan_pending` | `scan` |
| `ATTACH.SCAN_FAILED` | false | `err.attach.scan_failed` | `scan` |

## Authorization
Validation does not grant rights; uploader owns the upload until committed (PS-059-05).

## Failure, idempotency, concurrency, offline
Deterministic for same bytes and rule version. Scanner unavailable → `SCAN_PENDING` (retryable), never auto-pass.

## Privacy, retention, abuse
Errors never echo file names, byte contents or detected metadata. Rejected uploads purged within 1 hour (RET-EPH).

## Observability & budgets
`attach_validation_fail_total{code}`; image re-encode p95 ≤ 800 ms for 8 MP (ASSUMPTION).

## Tests
- TEST-PS-059-02-01 (unit): one fixture per code.
- TEST-PS-059-02-02 (negative): renamed executable with image extension rejected by sniffing.
- TEST-PS-059-02-03 (negative): decompression-bomb fixture rejected within memory budget.
- TEST-PS-059-02-04 (privacy): GPS-tagged JPEG fixture produces re-encoded output with no GPS tags.

## Acceptance criteria
1. Sniffing overrides declared type in 100% of mismatch fixtures.
2. EXIF and location metadata absent in all stored images.
3. No scan bypass path.
4. Error bodies contain no file content or name.

## Assumptions & open decisions
- ASSUMPTION: MIME allowlist and limits above.
- PROVISIONAL (D07 default, unapproved): rejected uploads purged in 1 hour.
