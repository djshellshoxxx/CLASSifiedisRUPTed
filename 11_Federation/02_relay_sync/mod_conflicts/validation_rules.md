# PS-086-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_conflicts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R05 dedupe, R06 equivocation, verification steps 12–14), CTR-EVT-001 (R02 revision, R04 timestamps), CTR-ERR-001 (R02 code shape), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-086-02.R01 | Detection runs at verification step 12, after signature (step 8) and dedupe (step 12 first half). Equivocation is checked only for events that are not exact duplicates. | MVP |
| PS-086-02.R02 | Equivocation condition: an existing stored event with the same (`origin_node`, `aggregate_id`, `revision`) and a different `event_id` **or** different `payload_digest` (CTR-FED-001 R06). The same `event_id` with the same digest is a duplicate, not a conflict. | MVP |
| PS-086-02.R03 | Revision gap condition: an event with `revision = n` arrives where the highest stored revision for that aggregate is < n − 1. The event is held (PS-086-03). | MVP |
| PS-086-02.R04 | Revision ≤ stored revision with the same digest and `event_id` is a duplicate. With a different digest or `event_id`, it is an equivocation (R02). | MVP |
| PS-086-02.R05 | An event whose `aggregate_id` is tombstoned is not checked for conflict; it is accepted without storage (CTR-FED-001 R07, step 13). | MVP |
| PS-086-02.R06 | Revision must be ≥ 1. Revision 0 or non-integer → `FED.ENVELOPE_MALFORMED` before detection. | MVP |

## Data / schema
Inputs: `origin_node`, `aggregate_type`, `aggregate_id`, `revision`, `event_id`, `payload_digest` (CTR-EVT-001 and CTR-FED-001 fields). No new fields are read.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| FED.EQUIVOCATION | false | conflict / 409 | R02 condition; event rejected; peer moves to `quarantined` |
| CONFLICTS.REVISION_GAP | true | precondition_failed / 412 | R03 condition; held up to 24 h (ASSUMPTION), then rejected |
| CONFLICTS.REVIEW_REQUIRED | false | unprocessable_state / 422 | Restore of a quarantined peer attempted without a review record |

Codes are minted here under module slug `CONFLICTS` (PENDING CTR-ERR-001). `FED.EQUIVOCATION` is from CTR-FED-001.

## Authorization
Validation runs after the peer-state check (CTR-FED-001 step 2) and never discloses stored payloads to the sender.

## Failure, idempotency, concurrency, offline
Detection is a pure function of stored metadata and the incoming event. Repeating it yields the same result. Concurrent detection is serialized under the origin's aggregate lock (PS-086-06).

## Privacy, retention, abuse
Error details name field path and code only. The second payload is never echoed to the sender (CTR-ERR-001 R06, R07).

## Observability & budgets
`fed_conflict_detected_total{kind}`. Budgets in PS-086-08.

## Tests
- TEST-PS-086-02-01 (unit): one fixture per condition in R02–R06; each returns the table code or the duplicate status.
- TEST-PS-086-02-02 (unit): same `event_id`, same digest → duplicate; same `event_id`, different digest → equivocation.
- TEST-PS-086-02-03 (unit): different `event_id`, same digest, same revision → equivocation (CTR-FED-001 R06 wording).
- TEST-PS-086-02-04 (unit): revision 0 and non-integer revision refused as malformed.

## Acceptance criteria
1. All codes reachable by fixtures; TEST-PS-086-02-01 passes.
2. Duplicate and equivocation are distinguished exactly; TEST-PS-086-02-02 and -03 pass.
3. No payload content in any error response; covered by TEST-PS-086-09-05.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: 24 h gap hold window (F11 to confirm).
- PROVISIONAL (D01 default, unapproved): equivocation quarantines the peer; the origin node is authoritative.
