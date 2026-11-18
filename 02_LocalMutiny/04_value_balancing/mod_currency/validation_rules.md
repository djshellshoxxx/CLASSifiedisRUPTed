# PS-025-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_currency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02, R03, R04, R15), CTR-ERR-001. Module code `CYCCURR` (PENDING CTR-ERR-001). Shared COM codes are reused, not redefined.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-025-02.R01 | Consent to a cross-currency cycle requires a quote with `valid_until` later than now; otherwise refused. | MVP |
| PS-025-02.R02 | Quote hash must match the owner's hash; mismatch refused. | MVP |
| PS-025-02.R03 | Amount exponent must match the registry exponent for the currency. | MVP |
| PS-025-02.R04 | Labels must come from the catalog; any label below FINAL containing "paid", "payment received" or "settled" is refused at build time. | MVP |
| PS-025-02.R05 | Currency must be a registered fiat code or registered CAIP-19 asset; unknown codes refused. | MVP |

## Data / schema
Rule parameters: quote validity ≤ 15 min (CTR-COM-001 R04); rounding HALF_EVEN (ASSUMPTION).

## Validation & errors
| Code | Category (HTTP) | Retryable | Trigger | details[].rule |
|---|---|---|---|---|
| CYCCURR.QUOTE_REQUIRED | precondition_failed (412) | true | cross-currency cycle without quote | quote_ref |
| CYCCURR.QUOTE_STALE | precondition_failed (412) | true | quote past valid_until at consent (also COM.QUOTE_EXPIRED upstream) | quote_validity |
| CYCCURR.HASH_MISMATCH | validation (400) | false | quote_hash differs from owner | quote_hash |
| CYCCURR.EXPONENT_MISMATCH | validation (400) | false | amount scale wrong for currency | exponent |
| CYCCURR.CURRENCY_UNSUPPORTED | validation (400) | false | code not in registry | currency |
| CYCCURR.LABEL_FORBIDDEN | validation (400) | false | catalog check fails | label_catalog |

Messages: `err.cyccurr.<code>`; no amounts echoed.

## Authorization
Pin is system-only; participant reads only their cycle.

## Failure, idempotency, concurrency, offline
Validation uses the quote as stored at pin time; a refresh creates a new binding.

## Privacy, retention, abuse
Errors never echo amounts or quote values.

## Observability & budgets
Counts per code; no amounts in metrics.

## Tests
- TEST-PS-025-02-01 (unit): one fixture per code.
- TEST-PS-025-02-02 (boundary): quote at valid_until passes or fails per specified rule.
- TEST-PS-025-02-03 (lint): label catalog contains no forbidden term for below-FINAL states.

## Acceptance criteria
1. Each code produced only by its trigger.
2. No cross-currency consent without a valid quote in 100% of runs.
3. Zero forbidden terms in below-FINAL labels.

## Assumptions & open decisions
- ASSUMPTION: 15 min validity and HALF_EVEN rounding (CTR-COM-001 defaults, pending F09 review).
- PROVISIONAL (D03 default, unapproved).
