# PS-061-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_threads. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-CAP-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-061-02.R01 | Body validated after NFC and trim: length 1–4000 scalar values; control characters other than TAB and LF rejected. | MVP |
| PS-061-02.R02 | Attachment MIME is sniffed from magic bytes; sniffed type must equal declared type, else reject. | MVP |
| PS-061-02.R03 | Participant check runs before any content check, so non-participants get `SYS.NOT_FOUND` (CTR-CAP-001). | MVP |
| PS-061-02.R04 | A send to a thread in state `archived` or `locked` is rejected before commit. | MVP |
| PS-061-02.R05 | New-thread creation to an account that has blocked the sender returns a generic `THREADS.SEND_NOT_PERMITTED`; the block is never disclosed. | MVP |
| PS-061-02.R06 | First-contact limit: ≤ 3 new threads per sender per hour to accounts with no prior thread (ASSUMPTION). | MVP |

## Data / schema
Validation runs on the request schema from [PS-061-04](commands_queries_events.md). Rule identifiers (`details[].rule`) are from this table only:

| rule | Applies to |
|---|---|
| `length_out_of_range` | body |
| `control_character` | body |
| `mime_mismatch` | attachment |
| `size_exceeded` | attachment |
| `count_exceeded` | attachments per message |
| `not_participant` | thread |
| `state_forbids` | thread state |

## Commands / queries / events
Validation precedes idempotency lookup for malformed input; valid repeats of a committed key return the original result (PS-061-06).

## States & transitions
Validation does not change state. Rejections produce no event.

## Validation & errors
| Code | Retryable | Category / HTTP | message_key | Diagnostic (privacy-safe) |
|---|---|---|---|---|
| THREADS.BODY_INVALID | false | validation / 400 | err.threads.body_invalid | rule only |
| THREADS.ATTACHMENT_TYPE_MISMATCH | false | unprocessable_state / 422 | err.threads.attachment_type | rule, field path |
| THREADS.ATTACHMENT_TOO_LARGE | false | payload_too_large / 413 | err.threads.attachment_large | field path |
| THREADS.TOO_MANY_ATTACHMENTS | false | validation / 400 | err.threads.attachment_count | field path |
| THREADS.THREAD_NOT_OPEN | false | unprocessable_state / 422 | err.threads.not_open | state name only |
| THREADS.SEND_NOT_PERMITTED | false | forbidden / 403 | err.threads.send_denied | none (no block reason) |
| THREADS.FIRST_CONTACT_LIMIT | true | rate_limited / 429 | err.threads.first_contact | `retry_after_ms` |
| SYS.NOT_FOUND | false | not_found / 404 | err.sys.not_found | none |

Input values are never echoed (CTR-ERR-001 R07).

## Authorization
Validation of participant status uses [PS-061-05](authorization_capabilities.md) decisions only; no client-supplied `acc_` is trusted.

## Failure, idempotency, concurrency, offline
Server-side validation is authoritative. Offline client validation mirrors R01–R02 for UX only; the server re-validates at commit (D08 default).

## Privacy, retention, abuse
Diagnostics never contain body text, MIME-sniff bytes or filenames. Block state is never revealed (R05).

## Observability & budgets
Counter `threads_validation_reject_total{code}`. Target: validation p95 ≤ 5 ms (ASSUMPTION).

## Tests
- TEST-PS-061-02-01 (unit): each rule row produces the stated code; body of 4001 scalars → `length_out_of_range`.
- TEST-PS-061-02-02 (negative): PNG bytes declared as image/jpeg → `mime_mismatch`.
- TEST-PS-061-02-03 (negative): blocked sender → `THREADS.SEND_NOT_PERMITTED`; identical response when block absent except for normal send path.
- TEST-PS-061-02-04 (abuse): 4th new thread within an hour → `THREADS.FIRST_CONTACT_LIMIT` with `retry_after_ms` ≤ 3600000.

## Acceptance criteria
1. Every code in the table is reachable by a test.
2. No diagnostic contains input values (TEST-PS-061-02-01 asserts absence).

## Assumptions & open decisions
- ASSUMPTION: first-contact limit of 3 per hour; tuning owned by F12 Trust&Safety.
- ASSUMPTION: control-character rule keeps TAB and LF only.
- D04 (partial execution) does not apply here; no PROVISIONAL default needed.
