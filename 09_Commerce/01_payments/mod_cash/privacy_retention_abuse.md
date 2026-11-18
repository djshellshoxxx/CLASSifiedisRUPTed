# PS-067-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_cash (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R06, R07, RET-EVD), CTR-COM-001 (Privacy section), CTR-FED-001 (R03). **Decisions:** D06, D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-067-07.R01 | Claims carry FINANCIAL_EVIDENCE; retention RET-EVD 24 months after final state (ASSUMPTION; jurisdiction review OPEN). | MVP |
| PS-067-07.R02 | Personal fields redacted at 12 months, hashes retained (CTR-COM-001). | MVP |
| PS-067-07.R03 | Cash claims are never federated (CTR-FED-001 R03). | MVP |
| PS-067-07.R04 | Logs carry claim ID, state and code only. | MVP |
| PS-067-07.R05 | Collusion pattern: two parties with ≥ 5 mutual cash attestations in 30 days and no other trade generate a review alert (ASSUMPTION). | MVP |

## Data / schema
Configuration records (`cashcfg`) are PUBLIC; claims are FINANCIAL_EVIDENCE.

## Commands / queries / events
Redaction is a `clm.redacted` event (payload digest replacement per CTR-EVT-001 R08).

## States & transitions
Retention: `active` → `redacted` (12 months) → `expired` (24 months).

## Validation & errors
No separate errors; retention codes are per CTR-PRV-001.

## Authorization
Only parties and case moderators see claim content.

## Failure, idempotency, concurrency, offline
Redaction is idempotent per claim.

## Privacy, retention, abuse
- Fabricated cash claims cannot verify (PS-067-03); attestations require counterparty signature.
- Collusion: R05 alert; case review by F12.
- Cash claims disclose that they are unverified assertions; no implied payment proof.
- Pseudonymous IDs are not anonymous.

## Observability & budgets
Alerts: collusion pattern count; dispute rate per party above threshold (ASSUMPTION).

## Tests
- TEST-PS-067-07-01 (contract): federation export of a cash claim is rejected with `FED.DATA_CLASS_NOT_ALLOWED`.
- TEST-PS-067-07-02 (integration): redaction at 12 months removes personal fields and keeps hashes.
- TEST-PS-067-07-03 (log lint): no amount or counterparty in logs.
- TEST-PS-067-07-04 (abuse): collusion fixture triggers alert.

## Acceptance criteria
1. Retention schedule enforced in test.
2. No federation path for cash.
3. Collusion alert fires on fixture.

## Assumptions & open decisions
- ASSUMPTION: R05 thresholds.
- D07 (PROVISIONAL default, unapproved). D06 (PROVISIONAL default, unapproved).
