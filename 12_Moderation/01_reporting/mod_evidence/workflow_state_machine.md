# PS-093-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_evidence (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-093-03.R01 | Every transition below is the only permitted path; others → `SYS.UNPROCESSABLE_STATE`. | MVP |
| PS-093-03.R02 | Each transition emits one event or one `aud_` record (CTR-CAP-001 R08). | MVP |
| PS-093-03.R03 | `captured` items are read-only except through `redacted`, `expired` and hold transitions. | MVP |
| PS-093-03.R04 | A legal hold blocks `expired` → `purged` until released (CTR-PRV-001 R07). | MVP |

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | capture.requested | report open; caller is reporter or `sys_` | capturing | staging object created, TTL 15 min |
| capturing | capture.completed | PS-093-02 checks 1–7 pass | captured | `evidence.captured`; `aud_` |
| capturing | capture.failed | validation error (not scanner outage) | rejected | staging deleted; error returned |
| capturing | scanner.unavailable | timeout | capturing | retry per PS-093-06; no content visible |
| capturing | staging.ttl_elapsed | no completion | rejected | staging purged; reason `EVD.CAPTURE_EXPIRED` |
| captured | redact.requested | mod with case grant; reason valid | redacted | `evidence.redacted`; content purged in 24 h |
| captured, redacted | retention.elapsed | no hold | expired | content purge scheduled |
| captured, redacted | hold.applied | ope dual approval; end date set | captured or redacted (held) | `evidence.legal_hold_applied` |
| expired | purge.completed | content gone from replicas and caches | purged | `evidence.purged`; metadata tombstone kept |

Terminal: `rejected`, `purged`.

## Validation & errors
Illegal transitions return `SYS.UNPROCESSABLE_STATE`; stale writes return `EVT.REVISION_CONFLICT`.

## Authorization
Transition authority per PS-093-05. System transitions (`scanner.*`, `*.elapsed`, `purge.completed`) are performed by `sys_` only.

## Failure, idempotency, concurrency, offline
Each transition is keyed by (`evidence_id`, `revision`). Two redactions race: second gets `EVT.REVISION_CONFLICT`. Offline reporters never trigger `captured` directly; they queue (PS-093-06).

## Privacy, retention, abuse
Staging objects and rejected payloads are never retained beyond 15 min (RET-EPH). A rejected item leaves no content, only a `rejected` tombstone with reason code.

## Observability & budgets
Gauge `evidence_items{redaction_state}`; transition latency p95 ≤ 100 ms excluding scan (ASSUMPTION).

## Tests
- TEST-PS-093-03-01 (property): random event sequences never reach an undefined state.
- TEST-PS-093-03-02 (integration): hold blocks purge; release at end date allows purge within 24 h.
- TEST-PS-093-03-03 (concurrency): two concurrent redactions → one success, one `EVT.REVISION_CONFLICT`.

## Acceptance criteria
1. Transition table is exhaustive: every (state, event) pair is either listed or returns `SYS.UNPROCESSABLE_STATE`.
2. No path from `rejected` or `purged` back to a readable state.

## Assumptions & open decisions
- ASSUMPTION: staging TTL 15 min; retention elapsed triggers purge, not deletion of metadata.
- PROVISIONAL (D07 default, unapproved): legal-hold exceptions only.
