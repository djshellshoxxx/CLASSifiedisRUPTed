# PS-018-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_n. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R09), CTR-FED-001 (R03), CTR-EVT-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-018-07.R01 | Run records and candidates follow the snapshot retention: deleted 24 h after snapshot expiry (RET-EPH). | MVP |
| PS-018-07.R02 | Long cycles expose more pseudonymous links; candidate output is visible to matcher only and to each slot's own proposal. | MVP |
| PS-018-07.R03 | Per-run candidate cap 1,000; per-account candidate share ≤ 50 per run (ASSUMPTION). | MVP |
| PS-018-07.R04 | Graph-shape abuse (crafted graphs to exhaust budget) raises a signal to F12 when a single account accounts for > 20% of budget steps. | MVP |
| PS-018-07.R05 | Search runs are never federated (CTR-FED-001 R02). | MVP |

## Data / schema
Classes: candidate refs PSEUDONYMOUS; value gap FINANCIAL_EVIDENCE when non-zero.

## Commands / queries / events
Events are counts only.

## States & transitions
Expiry triggers deletion.

## Validation & errors
No content in errors.

## Authorization
Matcher-only (PS-018-05).

## Failure, idempotency, concurrency, offline
Deletion retried until confirmed (CTR-PRV-001 R12 completion record).

## Privacy, retention, abuse
- Threats: deanonymisation through long-cycle structure; budget exhaustion as denial of service; Sybil chains.
- Controls: caps above; participant-only proposal views; F12 signal.
- Residual risk: long cycles are more linkable than short ones; recorded for F10 review, not claimed mitigated.

## Observability & budgets
No account IDs in metrics; budget share reported per account hash.

## Tests
- TEST-PS-018-07-01 (privacy): payload lint shows no location or name fields.
- TEST-PS-018-07-02 (abuse): crafted graph triggers F12 signal.
- TEST-PS-018-07-03 (integration): snapshot expiry deletes run data within 24 h.

## Acceptance criteria
1. Lint passes for all run payloads.
2. Abuse signal fires in 100% of crafted-graph fixtures.
3. Residual linkage risk documented and sent to F10.

## Assumptions & open decisions
- ASSUMPTION: 50 candidates per account per run; 20% budget-share signal.
- PROVISIONAL (D07 default, unapproved).
