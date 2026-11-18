# PS-073-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_currency (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02, R03, currency pattern), CTR-ERR-001. **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-073-02.R01 | Code must match the pattern for its kind; mismatched kind and code rejected. | MVP |
| PS-073-02.R02 | Exponent outside 0–18 or not equal to ISO value (fiat) rejected. | MVP |
| PS-073-02.R03 | Asset code must match an adapter-registered asset; unregistered assets rejected. | MVP |
| PS-073-02.R04 | Look-alike check: two enabled assets with the same symbol on different contracts require an explicit operator flag and warning. | MVP |
| PS-073-02.R05 | Disabling an asset requires no open claims referencing it to be unresolved, or records a `CURR.OPEN_CLAIMS_EXIST` warning and keeps existing claims valid. | MVP |

## Data / schema
Rule enum: `kind_code_match`, `exponent_range`, `iso_exponent`, `adapter_registered`, `lookalike`, `open_claims`.

## Commands / queries / events
Applies to `currency.register` and `currency.set_status`.

## States & transitions
Failed validation writes nothing.

## Validation & errors
| Rule | Code | Category / HTTP | Retryable |
|---|---|---|---|
| Kind/code mismatch | `CURR.CODE_INVALID` | validation / 400 | false |
| Exponent out of range | `CURR.EXPONENT_INVALID` | validation / 400 | false |
| ISO exponent mismatch | `CURR.EXPONENT_MISMATCH` | validation / 400 | false |
| Asset not registered | `CURR.ASSET_UNREGISTERED` | unprocessable_state / 422 | false |
| Look-alike without flag | `CURR.LOOKALIKE_UNFLAGGED` | conflict / 409 | false |
| Duplicate entry version | `SYS.CONFLICT` | conflict / 409 | false |

## Authorization
Registration by operator with dual control (PS-073-05).

## Failure, idempotency, concurrency, offline
Deterministic; uses registry revision.

## Privacy, retention, abuse
Diagnostics name the rule only.

## Observability & budgets
Counter by code. Alert on any `CURR.LOOKALIKE_UNFLAGGED` attempt.

## Tests
- TEST-PS-073-02-01 (unit): each error row.
- TEST-PS-073-02-02 (golden): ISO exponent table.
- TEST-PS-073-02-03 (negative): look-alike asset without flag rejected.
- TEST-PS-073-02-04 (integration): disable with open claims keeps claims valid and emits warning.

## Acceptance criteria
1. Error table implemented.
2. No unregistered asset accepted.
3. Look-alike control tested.

## Assumptions & open decisions
- ASSUMPTION: ISO list version pinned per registry release.
- D03 (PROVISIONAL default, unapproved).
