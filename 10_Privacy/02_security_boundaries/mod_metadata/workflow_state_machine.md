# PS-080-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_metadata (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02), CTR-PRV-001 (R03 strip-before-store), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-080-03.R01 | Attachment states: `received`, `sanitizing`, `clean`, `rejected`, `quarantined`. Only `clean` may be served. | MVP |
| PS-080-03.R02 | Original upload bytes are discarded after sanitisation; no state retains them (strip-before-store). | MVP |
| PS-080-03.R03 | `sanitizing` → `quarantined` on any residual GPS, author or device tag after one pass. | MVP |
| PS-080-03.R04 | Policy states: `draft`, `approved`, `active`, `superseded`; one active version per surface. | MVP |
| PS-080-03.R05 | Each transition emits one event with `aggregate_revision + 1` (CTR-EVT-001 R02). | MVP |

## Data / schema
State on the attachment aggregate (owned by F08.S01.M03 `mod_attachments`) is read through its contract; this module owns `attachment_metadata_report` and its sanitiser state.

## Commands / queries / events
Events: `attachment.metadata_stripped`, `attachment.quarantined`, `meta.policy_published`, `meta.policy_activated`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| received | sanitizer lease | size ≤ 25 MiB | sanitizing | Bytes in memory/temp key only |
| received | format check | unsupported | rejected | Hash block-listed 7 d |
| sanitizing | pass ok | residual scan clean | clean | Report written; original discarded |
| sanitizing | residual tag | scan finds GPS/author | quarantined | Ops alert; not served |
| sanitizing | error | attempts ≥ 2 | quarantined | `META.STRIP_FAILED` |

## Validation & errors
Invalid transition → `META.INVALID_TRANSITION` (409).

## Authorization
Only `sys_` sanitizer changes attachment metadata state; F08 reads through contract.

## Failure, idempotency, concurrency, offline
Sanitisation is idempotent per (`att_`, sanitizer_version). Crash → temp key deleted and restarted from received bytes if still held; otherwise upload must be repeated.

## Privacy, retention, abuse
Quarantined bytes deleted within 24 h; report retained RET-OPS.

## Observability & budgets
`meta_sanitize_seconds` p95 ≤ 2 s for 10 MiB (ASSUMPTION).

## Tests
- TEST-PS-080-03-01 (property): no path from `quarantined` to `clean` without re-sanitisation.
- TEST-PS-080-03-02 (integration): original bytes absent from storage after `clean`.

## Acceptance criteria
1. Transition table covered.
2. Storage scan shows no original bytes after `clean` (TEST-PS-080-03-02).
3. Quarantined attachment not returned by any download endpoint (contract test).

## Assumptions & open decisions
- ASSUMPTION: two sanitisation attempts before quarantine.
- PROVISIONAL (D05 default).
