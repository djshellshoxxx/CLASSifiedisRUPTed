# PS-024-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07, R12), CTR-FED-001 (R03), CTR-COM-001 (R16 pattern).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-024-07.R01 | Recovery records retained RET-EVD (24 months after final state, ASSUMPTION); personal fields redacted after 12 months while hashes remain. | MVP |
| PS-024-07.R02 | Escalation carries only pseudonymous refs, cycle ID, outcome enums and reason code; no free text. | MVP |
| PS-024-07.R03 | Recovery records are never federated (CTR-FED-001 R03 for FINANCIAL_EVIDENCE-class content). | MVP |
| PS-024-07.R04 | Recovery can be opened at most once per cycle version (abuse cap). | MVP |
| PS-024-07.R05 | Repeated recovery opens against one participant (≥ 3 in 90 days, ASSUMPTION) raise a signal to F12. | MVP |

## Data / schema
Classes per PS-024-01.

## Commands / queries / events
Events carry digests only.

## States & transitions
Terminal state starts RET-EVD clock; legal hold extends per CTR-PRV-001 R07.

## Validation & errors
No content in errors.

## Authorization
PS-024-05.

## Failure, idempotency, concurrency, offline
Deletion requests follow CTR-PRV-001 R12 completion record.

## Privacy, retention, abuse
- Threats: false attestations against a counterparty; attestation used as proof of handover; evidence leakage to unrelated parties.
- Controls: signed statements only, case scope for moderators, redaction schedule, abuse signal.
- Residual risk: attestations may be false; the platform does not verify them. Recorded for F10 and F12.

## Observability & budgets
No pseudonyms in metrics.

## Tests
- TEST-PS-024-07-01 (privacy): escalation payload lint.
- TEST-PS-024-07-02 (retention): redaction at 12 months in simulated clock.
- TEST-PS-024-07-03 (abuse): repeated opens trigger signal.

## Acceptance criteria
1. Escalation payload contains no free text (lint).
2. Redaction schedule met in 100% of simulated runs.
3. Residual false-attestation risk documented in F10 and F12 reviews.

## Assumptions & open decisions
- ASSUMPTION: RET-EVD 24 months; redaction at 12 months.
- PROVISIONAL (D07 default, unapproved).
- PROVISIONAL (D06 default, unapproved).
