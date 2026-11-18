# PS-070-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_disputes (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R05, R16), CTR-ID-001 (`dsp`, `evd`, `cas`), CTR-PRV-001, CTR-SCH-001. **Decisions:** D04, D07 (PROVISIONAL defaults, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-070-01.R01 | One `dispute` record per disputed claim `clm_` at a time. Record class `dsp_` is canonical here; other modules reference `dsp_` IDs only. | MVP |
| PS-070-01.R02 | `reason_code` is an enum of 5 values: `not_received`, `amount_mismatch`, `not_as_described`, `fraudulent_claim`, `other`. | MVP |
| PS-070-01.R03 | `statement` ≤ 1000 code points, PRIVATE_PERSONAL, stored encrypted. | MVP |
| PS-070-01.R04 | `evidence_ids` ≤ 10 `evd_` references per party per dispute. Content lives in PS-071. | MVP |
| PS-070-01.R05 | Every dispute record keeps the claim `state_version` at raise time (`raised_at_state_version`). | MVP |

## Data / schema
| Field | Type / constraint | Class |
|---|---|---|
| `dispute_id` | `dsp_` + ULID body | FINANCIAL_EVIDENCE |
| `claim_id` | `clm_` ID | FINANCIAL_EVIDENCE |
| `raised_by` | `acc_` (claimant or counterparty of the claim) | PSEUDONYMOUS |
| `reason_code` | enum (R02) | FINANCIAL_EVIDENCE |
| `statement` | string ≤ 1000 code points, nullable | PRIVATE_PERSONAL |
| `evidence_ids` | array of `evd_`, ≤ 10 | FINANCIAL_EVIDENCE |
| `status` | enum (PS-070-03) | FINANCIAL_EVIDENCE |
| `response_due_at` | timestamp, raised_at + 7 d (ASSUMPTION) | PSEUDONYMOUS |
| `case_id` | `cas_` or null | PSEUDONYMOUS |
| `outcome` | enum `restore_prior`, `reverse` or null | FINANCIAL_EVIDENCE |
| `state_version` | integer ≥ 1 | — |
| `schema_version` | `1.0.0` | — |

## Commands / queries / events
Defined in PS-070-04. Claim transitions are written by CTR-COM-001 commands (`clm.dispute`, `case.resolve`) and never directly by this module.

## States & transitions
See PS-070-03.

## Validation & errors
See PS-070-02.

## Authorization
Field visibility: `statement` visible to the two claim parties and the assigned moderator inside a case grant; `reason_code` and `status` visible to participants; `outcome` visible to participants.

## Failure, idempotency, concurrency, offline
Schema migrations follow CTR-SCH-001. A dispute row whose `claim_id` no longer exists is quarantined, not deleted.

## Privacy, retention, abuse
Classes as above. Retention: RET-EVD for the record, with `statement` redacted at 12 months after resolution (CTR-PRV-001 table).

## Observability & budgets
Count of open disputes per status (aggregate). No per-row logging.

## Tests
- TEST-PS-070-01-01 (unit): at most one open dispute per claim (second raise returns `DISPUTE.ALREADY_OPEN`).
- TEST-PS-070-01-02 (unit): `reason_code` outside enum rejected with `SYS.REQUEST_MALFORMED`.
- TEST-PS-070-01-03 (unit): 1000 vs 1001 code point statement boundary.

## Acceptance criteria
1. Schema matches the field table; each field has exactly one class.
2. `statement` never appears in events or logs (canary test).
3. Dispute rows reference claims by ID only; no copy of claim amounts beyond `claim_id` lookup (ASSUMPTION: amounts are read from the claim, not duplicated).

## Assumptions & open decisions
- PROVISIONAL canonical owner (B-06): `dsp_` records are owned by PS-070. PS-030 (03_Services/02_service_booking/mod_disputes) must reference `dsp_` by ID or define a separate record class under a different slug.
- ASSUMPTION: 7-day response window.
- D04 (PROVISIONAL default, unapproved): explicit per-party attestations and compensating recovery; no atomic real-world guarantee.
- D07 (PROVISIONAL default, unapproved).
