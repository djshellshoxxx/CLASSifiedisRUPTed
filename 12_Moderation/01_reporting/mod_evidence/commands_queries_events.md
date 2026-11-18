# PS-093-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_evidence (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-093-04.R01 | Every command carries `idempotency_key` (16–128 chars) and `expected_revision` (null on create). | MVP |
| PS-093-04.R02 | Commands are versioned as `evidence.<verb>@1`; breaking change → `@2` with overlap ≥ 90 days (CTR-SCH-001). | MVP |
| PS-093-04.R03 | Queries return metadata only. Content is never returned inline; download URLs expire in ≤ 60 s and require the grant in PS-093-05. | MVP |
| PS-093-04.R04 | Event types are `evidence.<past-verb>` (CTR-EVT-001 R10). | MVP |

## Commands
| Command | Input (required) | Idempotency | Emits | Errors |
|---|---|---|---|---|
| evidence.capture | report_id, target_type, target_id, content_kind, bytes_ref | key per reporter + report + target | evidence.captured | EVD.* (PS-093-02), SYS.NOT_FOUND |
| evidence.redact | evidence_id, reason_code, expected_revision | key per evidence_id + revision | evidence.redacted | EVT.REVISION_CONFLICT, EVD.REDACTION_SCOPE_INVALID |
| evidence.legal_hold.apply | evidence_id, hold_ref, end_date | key per hold_ref | evidence.legal_hold_applied | PRV.HOLD_SCOPE_INVALID |

## Queries
| Query | Returns | Auth |
|---|---|---|
| evidence.get | metadata (no content, no captured_by unless case scope) | PS-093-05 |
| evidence.list_by_report | paged, max 50, ordered by `revision` | PS-093-05 |
| evidence.content | signed URL, TTL ≤ 60 s, audited | case grant + purpose |

## Events
| event_type | Payload (no content) | max_data_class |
|---|---|---|
| evidence.captured | evidence_id, report_id, target_type, sha256, byte_size, provenance | PSEUDONYMOUS |
| evidence.redacted | evidence_id, reason_code, previous_state | PSEUDONYMOUS |
| evidence.legal_hold_applied | evidence_id, hold_ref, end_date | PSEUDONYMOUS |
| evidence.purged | evidence_id, purged_at | PSEUDONYMOUS |

Events are federation-excluded (CTR-FED-001 R03 for PRIVATE_PERSONAL sources). Payload ≤ 64 KiB.

## Validation & errors
Shared codes from CTR-ERR-001 plus EVD.* from PS-093-02. Retryability fixed per code.

## Authorization
See PS-093-05. `evidence.content` is the only path that returns bytes.

## Failure, idempotency, concurrency, offline
Same key and same digest returns the original result; same key and different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Records kept 7 days (CTR-EVT-001 R03).

## Privacy, retention, abuse
Events carry IDs, classes and counts only (CTR-PRV-001 R12). `captured_by` is not in events.

## Observability & budgets
`evidence_commands_total{command,outcome}`; command p95 ≤ 250 ms excluding scan (ASSUMPTION).

## Tests
- TEST-PS-093-04-01 (contract): payloads validate against registered schema 1.0.0.
- TEST-PS-093-04-02 (idempotency): replay returns original `evidence_id`; no second event.
- TEST-PS-093-04-03 (lint): no event contains content, `captured_by` or hashes of third-party messages.

## Acceptance criteria
1. Each command and query in the tables is implemented with its listed errors and no others.
2. No command returns bytes; only `evidence.content` does.

## Assumptions & open decisions
- PENDING: `mev` prefix registry entry (CTR-ID-001).
- PROVISIONAL (D08 default, unapproved): offline captures commit only after server ack.
