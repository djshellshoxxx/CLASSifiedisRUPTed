# PS-070-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_disputes (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R05, R16), CTR-ERR-001 (R02–R08), CTR-CAP-001 (R04). **Decisions:** D04 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-070-02.R01 | Raise is allowed only when the claim is in `CLAIMED`, `COUNTERPARTY_ATTESTED`, `EXTERNALLY_VERIFIED` or `FINAL`, and `now ≤ last_transition_at + 14 d` (CTR-COM-001 R16, inclusive of day 14, UTC). | MVP |
| PS-070-02.R02 | Only a claim participant may raise. A non-participant receives `SYS.NOT_FOUND`. | MVP |
| PS-070-02.R03 | Response allowed only by the non-raising party while status is `OPEN` and `now ≤ response_due_at`. | MVP |
| PS-070-02.R04 | `statement` ≤ 1000 code points; no control characters except newline; no URLs (length-only diagnostics). | MVP |
| PS-070-02.R05 | Evidence references must exist, belong to the same claim, and be owned by the submitting party. | MVP |

## Data / schema
Rule enum: `window`, `participant`, `already_open`, `reason`, `statement`, `evidence_count`, `evidence_owner`, `response_window`, `claim_state`.

## Commands / queries / events
Applies to `dispute.raise`, `dispute.respond`, `dispute.withdraw` (PS-070-04).

## States & transitions
Validation failure never writes a dispute row or calls `clm.dispute`.

## Validation & errors
| Rule | Code | Retryable | Message key | Diagnostic |
|---|---|---|---|---|
| Window closed | `DISPUTE.WINDOW_CLOSED` | false | `err.dispute.window_closed` | days since last transition |
| Claim not disputable state | `COM.INVALID_TRANSITION` | false | `err.com.invalid_transition` | claim state |
| Already open | `DISPUTE.ALREADY_OPEN` | false | `err.dispute.already_open` | dispute_id |
| Bad reason | `SYS.REQUEST_MALFORMED` | false | `err.sys.request_malformed` | field path |
| Statement too long or invalid | `DISPUTE.STATEMENT_INVALID` | false | `err.dispute.statement_invalid` | length only |
| Evidence over 10 | `DISPUTE.EVIDENCE_LIMIT` | false | `err.dispute.evidence_limit` | count |
| Evidence not owned or wrong claim | `DISPUTE.EVIDENCE_INVALID` | false | `err.dispute.evidence_invalid` | evd_ position |
| Response after due date | `DISPUTE.RESPONSE_WINDOW_CLOSED` | false | `err.dispute.response_window_closed` | none |
| Non-participant | `SYS.NOT_FOUND` | false | `err.sys.not_found` | none |

## Authorization
Validation runs after authentication; participant check uses CTR-CAP-001 relation rule derived from claim state.

## Failure, idempotency, concurrency, offline
Deterministic for identical state. Clock skew tolerance: server time is authoritative; client-supplied times are ignored.

## Privacy, retention, abuse
Diagnostics never include `statement` text or evidence content.

## Observability & budgets
Counter per (code, rule). Alert if `DISPUTE.WINDOW_CLOSED` rises above 20% of raise attempts in a day (indicates UX or clock issues).

## Tests
- TEST-PS-070-02-01 (unit): window boundary at day 14 00:00 and 23:59:59 UTC; day 15 refused.
- TEST-PS-070-02-02 (unit): every row of the error table returns its code and retryable flag.
- TEST-PS-070-02-03 (negative): evidence from the other party's claim rejected.
- TEST-PS-070-02-04 (negative): response at `response_due_at + 1 s` refused.

## Acceptance criteria
1. Window and response rules pass boundary tests.
2. No validation response echoes statement or evidence content.
3. All codes registered in CTR-ERR-001 registry under `DISPUTE` or the shared/COM codes cited.

## Assumptions & open decisions
- ASSUMPTION: `DISPUTE` is the module error prefix.
- D04 (PROVISIONAL default, unapproved): disputes are assertions and never move funds.
