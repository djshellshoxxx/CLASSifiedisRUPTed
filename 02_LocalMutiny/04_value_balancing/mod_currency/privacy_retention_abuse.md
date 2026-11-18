# PS-025-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_currency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03, R06, R09), CTR-FED-001 (R03), CTR-COM-001 (R01, R15).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-025-07.R01 | Amounts are FINANCIAL_EVIDENCE: visible to slot participants only; never federated (CTR-FED-001 R03). | MVP |
| PS-025-07.R02 | No location input affects valuation or currency choice; regional pricing is not modelled here. | MVP |
| PS-025-07.R03 | Binding history retained RET-EVD (24 months after final state, ASSUMPTION); amounts redacted after 12 months while hashes remain. | MVP |
| PS-025-07.R04 | Labels below FINAL exclude payment or settlement claims (CTR-COM-001 R15); this is a dark-pattern control. | MVP |
| PS-025-07.R05 | Receipts: this module stores only signed statements; no receipt is generated here (D06). | MVP |

## Data / schema
Classes per PS-025-01.

## Commands / queries / events
Max class FINANCIAL_EVIDENCE on value events.

## States & transitions
Terminal state starts retention clock.

## Validation & errors
Label check failures reported without label text beyond the rule ID.

## Authorization
PS-025-05.

## Failure, idempotency, concurrency, offline
Deletion follows CTR-PRV-001 R12 completion record.

## Privacy, retention, abuse
- Threats: value shown to non-participants; misleading "paid" labels; currency-based profiling.
- Controls: participant scope, label catalog, no location input.

## Observability & budgets
No amounts in metrics.

## Tests
- TEST-PS-025-07-01 (privacy): event lint shows FINANCIAL_EVIDENCE max class.
- TEST-PS-025-07-02 (label): forbidden terms absent from all below-FINAL labels.
- TEST-PS-025-07-03 (retention): redaction at 12 months in simulated clock.

## Acceptance criteria
1. No amount reaches a non-participant in 100% of fixtures.
2. Label catalog check passes in CI.
3. Retention schedule met in simulated runs.

## Assumptions & open decisions
- ASSUMPTION: RET-EVD 24 months; redaction at 12 months.
- PROVISIONAL (D06 default, unapproved): signed statements only.
- PROVISIONAL (D07 default, unapproved).
