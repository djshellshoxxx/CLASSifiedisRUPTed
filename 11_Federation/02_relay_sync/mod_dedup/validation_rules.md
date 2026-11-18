# PS-087-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_dedup. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R05, R06, R13), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-087-02.R01 | An event missing `origin_node` or `event_id` is rejected before dedupe with `FED.ENVELOPE_MALFORMED` (400). | MVP |
| PS-087-02.R02 | A `payload_digest` that is not 64 lowercase hex is rejected with `FED.ENVELOPE_MALFORMED`. | MVP |
| PS-087-02.R03 | A duplicate with identical digest returns result `duplicate` and is not reprocessed (CTR-FED-001 R05). | MVP |
| PS-087-02.R04 | A detected equivocation returns `FED.EQUIVOCATION` (409) and sets peer state to `quarantined`. | MVP |
| PS-087-02.R05 | An event whose revision is older than the dedupe horizon with no index row is returned `deferred` with `DEDUP.WINDOW_EXCEEDED` (not accepted blindly). | MVP |

## Data / schema
Applies to fields in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `dedup.check_and_record`.

## States & transitions
Validation precedes [workflow_state_machine.md](workflow_state_machine.md) transitions.

## Validation & errors
| Code | Retryable | Category / HTTP |
|---|---|---|
| FED.ENVELOPE_MALFORMED | false | validation / 400 (shared) |
| FED.EQUIVOCATION | false | conflict / 409 (shared) |
| DEDUP.WINDOW_EXCEEDED | true | precondition_failed / 412 (deferred for sync) |

## Authorization
Internal call only.

## Failure, idempotency, concurrency, offline
Deterministic on input and index state.

## Privacy, retention, abuse
Errors include code and event ID only.

## Observability & budgets
Counter `dedup_results_total{result}`.

## Tests
- TEST-PS-087-02-01 (unit): R01–R05 outcomes.
- TEST-PS-087-02-02 (equivocation): second distinct digest quarantines peer.
- TEST-PS-087-02-03 (window): old revision deferred not accepted.

## Acceptance criteria
1. All outcomes tested.
2. Equivocation triggers quarantine.

## Assumptions & open decisions
- ASSUMPTION: 12-hour dedupe horizon (see file 07) aligned with 24 h key wait in CTR-FED-001.
