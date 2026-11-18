# PS-072-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_reconciliation (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (claim, adapter record), CTR-ID-001, CTR-PRV-001 (R01, RET-EVD), CTR-SCH-001. **Pending:** `rcn` and `rfd` prefixes (CTR-ID-001). **Decisions:** D04, D06 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-072-01.R01 | A run `rcn_` records scope (chains, claim-ID range or time window), start and end time, status and coverage counts. | MVP |
| PS-072-01.R02 | A finding `rfd_` references one `clm_` and a finding type enum; it carries no amounts or party names. | MVP |
| PS-072-01.R03 | Run status: `complete`, `partial`, `failed`. `complete` requires coverage 100% of in-scope claims. | MVP |
| PS-072-01.R04 | Findings are immutable except for status and resolution fields. | MVP |

## Data / schema
| Field | Type / constraint | Class |
|---|---|---|
| `run_id` | `rcn_` ULID (PENDING) | PUBLIC |
| `scope` | object: chains[] (CAIP-2), window_start, window_end | PUBLIC |
| `status` | enum `complete` \| `partial` \| `failed` | PUBLIC |
| `coverage` | `{checked, expected, unreachable_chains[]}` integers | PUBLIC |
| `finding_id` | `rfd_` ULID (PENDING) | PSEUDONYMOUS |
| `claim_id` | `clm_` | FINANCIAL_EVIDENCE |
| `finding_type` | enum (PS-072-02) | PUBLIC |
| `status` (finding) | `open`, `resolved`, `dismissed` | PUBLIC |
| `resolution` | enum + `case_id` (`cas_`) or null | PUBLIC |

## Commands / queries / events
Specified in PS-072-04.

## States & transitions
Finding states per PS-072-03.

## Validation & errors
See PS-072-02.

## Authorization
Per PS-072-05.

## Failure, idempotency, concurrency, offline
Runs are keyed by scope and window; a re-run with the same key returns the original run.

## Privacy, retention, abuse
Findings are FINANCIAL_EVIDENCE by reference (claim ID); retained with claim (RET-EVD).

## Observability & budgets
Gauge: open findings by type.

## Tests
- TEST-PS-072-01-01 (unit): `complete` with coverage below 100% is rejected.
- TEST-PS-072-01-02 (lint): finding schema has no amount, party or address field.
- TEST-PS-072-01-03 (unit): immutable fields rejected on update.

## Acceptance criteria
1. Schema matches fields above.
2. Every finding resolves to a claim ID.
3. Coverage math verified.

## Assumptions & open decisions
- ASSUMPTION: run key format.
- D04 (PROVISIONAL default, unapproved).
