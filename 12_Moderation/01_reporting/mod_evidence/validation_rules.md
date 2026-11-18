# PS-093-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_evidence (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-093-02.R01 | Checks run in the fixed order below. The first failure stops processing and nothing is persisted. | MVP |
| PS-093-02.R02 | Media type is taken from magic bytes, not from the declared type. Mismatch → `EVD.MIME_MISMATCH`. | MVP |
| PS-093-02.R03 | Metadata stripping (EXIF, XMP, IPTC, GPS) runs before hashing and scanning. Undecodable image → `EVD.STRIP_FAILED`. | MVP |
| PS-093-02.R04 | Malware scan verdict must be `clean` before storage. Scanner timeout is 5 s; no content is stored unscanned. | MVP |
| PS-093-02.R05 | Target must be readable by the reporter (CTR-CAP-001) or be a message in a thread the reporter belongs to. Otherwise `SYS.NOT_FOUND`. | MVP |
| PS-093-02.R06 | Client-supplied hashes are ignored; the server computes SHA-256 over stored bytes. | MVP |
| PS-093-02.R07 | Redaction requests need a reason code from the registry (`personal_data`, `third_party_privacy`, `retention_expired`, `unlawful_content`). Free text → `EVD.REDACTION_SCOPE_INVALID`. | MVP |

## Validation order
1. Field allow-list (PS-093-01 R02). 2. Count ≤10 and size ≤5 MiB per item, ≤25 MiB per report. 3. Magic-byte sniff. 4. Decode and strip metadata. 5. Malware scan. 6. Hash. 7. Target authorization. 8. Persist.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| EVD.FIELD_NOT_ALLOWED | false | validation / 400 | Field outside allow-list. |
| EVD.TOO_LARGE | false | payload_too_large / 413 | Item or report size limit exceeded. |
| EVD.COUNT_EXCEEDED | false | unprocessable_state / 422 | More than 10 items on one report. |
| EVD.MIME_MISMATCH | false | validation / 400 | Magic bytes differ from declared type. |
| EVD.STRIP_FAILED | false | unprocessable_state / 422 | Metadata strip cannot complete. |
| EVD.SCAN_REJECTED | false | unprocessable_state / 422 | Scanner verdict not clean. |
| EVD.SCANNER_UNAVAILABLE | true | unavailable / 503 | Scanner timeout or down. |
| EVD.TARGET_NOT_REPORTABLE | false | unprocessable_state / 422 | Target type has no evidence path. |
| EVD.REDACTION_SCOPE_INVALID | false | validation / 400 | Missing or unknown redaction reason. |

Diagnostics carry field path and rule only (CTR-ERR-001 R06, R07).

## Authorization
Validation runs after the caller is authenticated. Target checks use CTR-CAP-001 read decisions; an unreadable target returns `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Validation is deterministic for identical bytes. Scanner failure leaves the item in `capturing` (PS-093-03), not rejected.

## Privacy, retention, abuse
Rejected payloads are not logged (CTR-ERR-001 R10). Validation errors never echo file names or byte content.

## Observability & budgets
`evidence_validation_rejections_total{code}`. Scan p95 ≤ 2 s for 5 MiB (ASSUMPTION). Strip + hash p95 ≤ 300 ms (ASSUMPTION).

## Tests
- TEST-PS-093-02-01 (unit): every row of the error table produces its code, retryable flag and HTTP status.
- TEST-PS-093-02-02 (fixture): a PNG renamed to `.txt` → `EVD.MIME_MISMATCH`; EXIF GPS present → stored bytes contain no GPS tag.
- TEST-PS-093-02-03 (negative): EICAR fixture → `EVD.SCAN_REJECTED`; scanner stub timeout → `EVD.SCANNER_UNAVAILABLE`, nothing stored.

## Acceptance criteria
1. Order of checks matches the list; checks 1–7 precede persistence in every path.
2. No stored byte lacks a clean scan verdict (zero tolerance, tested).

## Assumptions & open decisions
- ASSUMPTION: ClamAV (GPL-2.0, license review OPEN, F16) is a candidate scanner; alternatives to be evaluated. Scanner version pinned.
- ASSUMPTION: 5 MiB item limit suits phone photos after resize.
- PROVISIONAL (D07 default, unapproved): redaction reasons minimal set.
