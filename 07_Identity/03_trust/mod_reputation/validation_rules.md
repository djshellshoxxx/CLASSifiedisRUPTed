# PS-058-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_reputation. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001 (input events), CTR-COM-001 (finality states), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-058-02.R01 | An input event counts once: rejected if its `event_id` was already applied to the same `prf_` (dedupe). | MVP |
| PS-058-02.R02 | A `confirmed` exchange input requires finality state `final` from F09 (CTR-COM-001); `reported` or `pending` inputs count as self-attested only. | MVP |
| PS-058-02.R03 | An exchange input requires both parties to be distinct `prf_` and both to be active or retired at event time. Self-dealing (same account, both pseudonyms) → rejected and flagged. | MVP |
| PS-058-02.R04 | Input events must have `occurred_at` within the last 400 days; older events are ignored for scoring. | MVP |
| PS-058-02.R05 | Signed-statement input requires a valid `evidence.recorded` reference with `kind = counterparty_signed` and `state = recorded`. | MVP |
| PS-058-02.R06 | Dispute outcome input requires `dsp_` ID and outcome enum (`subject_won`, `subject_lost`, `split`). | MVP |

## Data / schema
Input event envelope per CTR-EVT-001; payload fields listed in PS-058-04.

## Commands / queries / events
Applies to input-event handler (`ReputationInput`, internal command).

## States & transitions
Rejected inputs produce no state change.

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `REPUTE.INPUT_DUPLICATE` | false | `err.repute.input_duplicate` |
| `REPUTE.FINALITY_NOT_FINAL` | true (if pending) | `err.repute.finality_pending` |
| `REPUTE.SELF_DEALING` | false | `err.repute.self_dealing` |
| `REPUTE.INPUT_STALE` | false | `err.repute.input_stale` |
| `REPUTE.EVIDENCE_NOT_VALID` | false | `err.repute.evidence_invalid` |
| `REPUTE.DISPUTE_REF_INVALID` | false | `err.repute.dispute_invalid` |

## Authorization
Input handler accepts only `sys_` service principals of owning modules (CTR-CAP-001 R02).

## Failure, idempotency, concurrency, offline
Deterministic; out-of-order inputs are applied in `occurred_at` order during recompute.

## Privacy, retention, abuse
Rejection logs carry code and event type only.

## Observability & budgets
`repute_input_reject_total{code}`; alert if `SELF_DEALING` rate exceeds 0.5% of inputs per day (ASSUMPTION).

## Tests
- TEST-PS-058-02-01 (unit): one test per code.
- TEST-PS-058-02-02 (integration): `reported` finality does not raise confirmed count.
- TEST-PS-058-02-03 (negative): replayed input is counted once.
- TEST-PS-058-02-04 (negative): self-dealing fixture rejected and flagged.

## Acceptance criteria
1. Every input is counted at most once.
2. Only `final` finality increases `confirmed_exchanges`.
3. Self-dealing never scores.
4. Old inputs ignored by rule R04.

## Assumptions & open decisions
- ASSUMPTION: 400-day input horizon, longer than the 365-day diversity window to allow late confirmations.
- PROVISIONAL (D03 / D04 default, unapproved): confirmation depends on F09 finality and per-party attestations.
