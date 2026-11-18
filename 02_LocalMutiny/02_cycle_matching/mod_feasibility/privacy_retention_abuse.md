# PS-016-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_feasibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R04, R05, R06), CTR-FED-001 (R03), CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-016-07.R01 | Region input is LOCATION_COARSE cells only; cells below K_MIN = 5 active items are merged upward before use (CTR-PRV-001 R04). | MVP |
| PS-016-07.R02 | Candidate graphs and snapshots are deleted 24 h after expiry (RET-EPH); verdict records and reason codes kept 30 days (RET-OPS). | MVP |
| PS-016-07.R03 | Sybil control: ≤ 50 candidates per account per snapshot (ASSUMPTION); clusters of ≥ 10 accounts sharing one slot pattern raise a signal to F12. | MVP |
| PS-016-07.R04 | Aggregated outputs (for example, feasible counts per cell) are published only when count ≥ K_MIN. | MVP |
| PS-016-07.R05 | Value-bearing verdicts are never federated (FINANCIAL_EVIDENCE; CTR-FED-001 R03). | MVP |

## Data / schema
Classes: `participant_ref` PSEUDONYMOUS; `region_cell` LOCATION_COARSE; `value_minor` FINANCIAL_EVIDENCE.

## Commands / queries / events
Events in PS-016-04 carry the maximum class of their payload (CTR-EVT-001 R11).

## States & transitions
Expiry transition in PS-016-03 triggers deletion job.

## Validation & errors
Cells below threshold return FEASIBLE.REGION_UNKNOWN.

## Authorization
Participant-only reads (PS-016-05).

## Failure, idempotency, concurrency, offline
Deletion retried until confirmed; deletion record contains counts only (CTR-PRV-001 R12).

## Privacy, retention, abuse
- Threats: graph deanonymisation from verdict patterns; Sybil inflation; timing correlation between sealed snapshot and consent.
- Controls: participant-scoped reads; K_MIN; per-account caps; snapshot time rounded to 1 min in events.
- Pseudonyms do not prevent graph-based linkage; this is an accepted residual risk, recorded for F10.

## Observability & budgets
No account IDs in metrics; log lines carry hashed snapshot IDs.

## Tests
- TEST-PS-016-07-01 (privacy): no coordinate fields in any payload.
- TEST-PS-016-07-02 (abuse): 51st candidate per account per snapshot rejected.
- TEST-PS-016-07-03 (integration): expired snapshot deleted within 24 h.

## Acceptance criteria
1. Lint passes: no field above LOCATION_COARSE.
2. Sybil cap enforced in 100% of fixtures.
3. Residual deanonymisation risk documented and sent to F10; no mitigation claimed as complete.

## Assumptions & open decisions
- PROVISIONAL (D05 default, unapproved): coarse public regions, user-initiated precision disclosure only.
- PROVISIONAL (D07 default, unapproved): minimal retention with legal-hold exceptions.
