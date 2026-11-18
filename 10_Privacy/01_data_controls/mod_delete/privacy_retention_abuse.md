# PS-077-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_delete (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, RET-AUD, RET-EVD, RET-LEGAL), CTR-EVT-001 (R08 redaction), CTR-COM-001 (R05, RET-EVD redaction).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-077-07.R01 | Deletion removes or redacts all PRIVATE_PERSONAL and LOCATION_PRECISE data of the subject within 24 h across primary store, replicas, caches, search indexes and exports (CTR-PRV-001). | MVP |
| PS-077-07.R02 | Event payloads referencing deleted content are redacted: envelope kept, payload replaced by digest (CTR-EVT-001 R08). | MVP |
| PS-077-07.R03 | Commerce evidence (CTR-COM-001 claims) is never deleted by this module; personal fields are redacted per RET-EVD and hashes are kept. | MVP |
| PS-077-07.R04 | Deletion does not recall copies already seen by counterparties; the UI states this before confirmation. | MVP |
| PS-077-07.R05 | Rate limit: ≤ 3 deletion requests per subject per 24 h (ASSUMPTION); exceeded → `SYS.RATE_LIMITED` (429). | MVP |
| PS-077-07.R06 | Content under an active moderation case (`cas_`) is held, not deleted, to prevent evidence destruction. | MVP |

## Data / schema
Data classes of deleted targets are read from the field registry (CTR-SCH-001 R01); no class is hard-coded here.

## Commands / queries / events
No additional commands. Redaction is emitted as `record.deleted` with `redacted: true`.

## States & transitions
Held targets remain in `held` until the hold is released (PS-077-03).

## Validation & errors
`SYS.RATE_LIMITED` is retryable after `retry_after_ms`.

## Authorization
Moderation holds are applied by F12 (`mod_flags` and case flow) with dual control; this module only honours them.

## Failure, idempotency, concurrency, offline
Redaction is idempotent on digest replacement.

## Privacy, retention, abuse
Retention: request rows RET-AUD; redacted event envelopes RET-AUD; deleted data RET-EPH on purge. Abuse: a bad actor deleting evidence during a dispute is blocked by R03 and R06. A stolen session cannot delete an account without reauthentication (PS-077-02 R04).

## Observability & budgets
Alert on any `PRECISE` class value found in logs after deletion (CTR-PRV-001 zero tolerance).

## Tests
- TEST-PS-077-07-01 (privacy): after account deletion, fixture PRIVATE_PERSONAL values absent from search index, exports and logs.
- TEST-PS-077-07-02 (abuse): deletion of a target under `cas_` returns held state.

## Acceptance criteria
1. Propagation within 24 h in seeded environment (TEST-PS-077-07-01).
2. Commerce claim records retain hashes and amounts after deletion (negative fixture).
3. Rate limit enforced at 4th request in 24 h.

## Assumptions & open decisions
- PROVISIONAL (D07 default): minimal retention with legal-hold exceptions.
- PROVISIONAL (D05 default): precise location disclosures expire and are purged on deletion.
- OPEN (R07): RET-EVD period and redaction timing require jurisdiction review.
