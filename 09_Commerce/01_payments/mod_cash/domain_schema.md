# PS-067-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_cash (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (claim, R01–R08, R13), CTR-ID-001 (`clm`, `trx`, `qte`), CTR-PRV-001 (FINANCIAL_EVIDENCE), CTR-SCH-001. **Decisions:** D03, D06, D09 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-067-01.R01 | The cash method adds no persisted claim field. The claim is the CTR-COM-001 `clm_` object with `method = "cash"`. | MVP |
| PS-067-01.R02 | Cash method configuration is a separate record `cashcfg` keyed by (`currency_code`, `region_class`). | MVP |
| PS-067-01.R03 | `region_class` is an enum (`metro`, `national`, `none`), never a place name or coordinate. | MVP |
| PS-067-01.R04 | `ceiling_minor` is a decimal string (CTR-COM-001 R02), ≤ 39 digits, scaled by the currency exponent from `cur_`. | MVP |
| PS-067-01.R05 | No record holds cash, balance, payout or wallet data (CTR-COM-001 R01, `COM.CUSTODY_FORBIDDEN`). | MVP |

## Data / schema
| Field | Type / constraint | Class |
|---|---|---|
| `cashcfg_id` | opaque ID, PENDING prefix `ccf` (CTR-ID-001) | PUBLIC |
| `currency_code` | ISO 4217 alpha-3 or `cur_` reference | PUBLIC |
| `region_class` | enum `metro` \| `national` \| `none` | PUBLIC |
| `enabled` | boolean | PUBLIC |
| `ceiling_minor` | decimal string, `^(0\|[1-9][0-9]{0,38})$` | PUBLIC |
| `config_revision` | integer ≥ 1 | — |
| `changed_by` | `ope_` reference | PSEUDONYMOUS |

Claim fields, including `amount_minor`, `currency`, `method`, `state`, are owned by CTR-COM-001 (FINANCIAL_EVIDENCE).

## Commands / queries / events
Specified in PS-067-04.

## States & transitions
Configuration states: `enabled`, `disabled` (PS-067-03).

## Validation & errors
See PS-067-02.

## Authorization
Configuration read is public; writes are operator-only (PS-067-05).

## Failure, idempotency, concurrency, offline
Configuration writes use `expected_revision` (CTR-EVT-001 R02).

## Privacy, retention, abuse
Configuration is not personal data. `changed_by` is retained with the audit record.

## Observability & budgets
Gauge: enabled configurations by currency.

## Tests
- TEST-PS-067-01-01 (contract): `cashcfg` schema rejects float ceilings and unknown `region_class` values.
- TEST-PS-067-01-02 (lint): no schema in this module contains balance, wallet or payout fields.
- TEST-PS-067-01-03 (unit): ceiling of 39 digits accepted; 40 rejected.

## Acceptance criteria
1. Zero new claim fields compared with CTR-COM-001 (diff test).
2. Every field has one class.
3. Custody lint passes (CTR-COM-001 test 02).

## Assumptions & open decisions
- ASSUMPTION: `region_class` enum is sufficient; no place names stored.
- D09 (PROVISIONAL default, unapproved): no platform custody; direct arrangements only.
- D03 (PROVISIONAL default, unapproved): integer minor units.
