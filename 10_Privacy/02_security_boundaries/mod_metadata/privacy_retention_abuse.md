# PS-080-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_metadata (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03 precise location, R09 logs, disclosure matrix), CTR-EVT-001 (R06), CTR-FED-001 (R02, R12).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-080-07.R01 | Attachment GPS, device serial, author and software tags removed before storage; zero occurrences in clean output (fixture corpus). | MVP |
| PS-080-07.R02 | Log allowlist excludes raw IP, user agent, query strings containing identifiers, request bodies and cookies. | MVP |
| PS-080-07.R03 | IP addresses stored as prefixes only (PS-080-01 R04); no per-user IP history. | MVP |
| PS-080-07.R04 | Push preview payloads use generic text only (CTR-PRV-001 R10); metadata of attachments never appears in preview. | MVP |
| PS-080-07.R05 | Federation exports omit attachment metadata entirely and never federate PRIVATE_PERSONAL attachments (CTR-FED-001 R03). | MVP |
| PS-080-07.R06 | Timing side channels: outbound meetup timestamps coarsened to 15 min (PS-080-01 R05). Message length padding is a documented Future item. | MVP |

## Data / schema
Field registry marks every outbound field's data class (CTR-SCH-001).

## Commands / queries / events
None additional.

## States & transitions
Quarantined attachments not served (PS-080-03).

## Validation & errors
Per PS-080-02.

## Authorization
Per PS-080-05.

## Failure, idempotency, concurrency, offline
Fail-closed per PS-080-06.

## Privacy, retention, abuse
Retention: sanitiser reports RET-OPS; hash block list 7 days; quarantined bytes 24 h. Abuse: uploads of images containing GPS to reveal home location are stripped; uploads of files disguised with a supported MIME type are caught by magic-byte check. Pseudonyms do not guarantee anonymity: metadata stripping does not remove visual identifiers (faces, street signs); this is documented for users.

## Observability & budgets
Alert on any GPS or author tag in clean output (zero tolerance).

## Tests
- TEST-PS-080-07-01 (privacy): corpus of 50 JPEG/PNG/WebP files with GPS, device and author tags; zero survive.
- TEST-PS-080-07-02 (log redaction): request fixture; logs contain no raw IP or cookie.

## Acceptance criteria
1. TEST-PS-080-07-01 zero residual tags.
2. TEST-PS-080-07-02 zero matches.
3. User-facing warning text reviewed by F14 for accessibility (future gate).

## Assumptions & open decisions
- PROVISIONAL (D05 default): coarse location and timestamp rules.
- ASSUMPTION: IP prefixes /24 and /48.
- Deferred (Future): visual-identifier detection, PDF and HEIC.
