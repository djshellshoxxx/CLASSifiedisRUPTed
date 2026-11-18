# PS-019-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R12), CTR-EVT-001 (R06, R11), CTR-FED-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-019-07.R01 | Slot data is PSEUDONYMOUS (`acc_` and `par_` refs); no names, contact data or precise location. | MVP |
| PS-019-07.R02 | Binding rows follow RET-OPS (30 days) after cycle terminal state; live bindings retained while cycle is live. | MVP |
| PS-019-07.R03 | Withdrawal-after-consent count per participant per 30 days is tracked; ≥ 3 raises a signal to F12 (ASSUMPTION). | MVP |
| PS-019-07.R04 | Cycle order reveals slot position only; no ordering by time of join is exposed. | MVP |
| PS-019-07.R05 | Bindings are not federated (CTR-FED-001 R02 default off). | MVP |

## Data / schema
Classes per PS-019-01.

## Commands / queries / events
Events PSEUDONYMOUS maximum.

## States & transitions
Terminal state starts retention clock.

## Validation & errors
No refs in errors beyond the caller's own.

## Authorization
Participant-only (PS-019-05).

## Failure, idempotency, concurrency, offline
Account deletion: binding keeps redacted slot marker; completion record counts only (CTR-PRV-001 R12).

## Privacy, retention, abuse
- Threats: withdrawal used to pressure partners; slot-order inference; Sybil participants filling many cycles.
- Controls: withdrawal signal, no time-of-join ordering, live-slot rule.
- Residual risk: slot position still linkable within one cycle; accepted, recorded for F10.

## Observability & budgets
No pseudonyms in metrics.

## Tests
- TEST-PS-019-07-01 (privacy): payload lint.
- TEST-PS-019-07-02 (abuse): third post-consent withdrawal raises signal.
- TEST-PS-019-07-03 (integration): deletion leaves redacted marker only.

## Acceptance criteria
1. Lint passes for binding and event payloads.
2. Signal fires in 100% of fixtures at threshold.
3. Deletion completion record has counts only.

## Assumptions & open decisions
- ASSUMPTION: threshold of 3 post-consent withdrawals per 30 days.
- PROVISIONAL (D07 default, unapproved).
