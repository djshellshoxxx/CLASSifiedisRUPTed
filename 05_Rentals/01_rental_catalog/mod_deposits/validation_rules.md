# PS-040-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_deposits. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (amount, currency, method, custody), CTR-ERR-001 (codes), CTR-PRV-001 (diagnostics).

**Decision labels:** D09 no custody (PROVISIONAL, unapproved). Deposit cap rule is ASSUMPTION (OPEN, F05).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-040-02.R01 | `rental_id` matches `^rnt_[0-9A-HJKMNP-TV-Z]{26}$` and the rental is `RESERVED` or `ACTIVE`. Else `DEPOSITS.RENTAL_NOT_ELIGIBLE` (422). | MVP |
| PS-040-02.R02 | `amount_minor` matches `^(0\|[1-9][0-9]{0,38})$`, is > 0, and ≤ cap. Cap = declared item value (ASSUMPTION). Over cap → `DEPOSITS.AMOUNT_OVER_CAP` (422). Malformed → `COM.AMOUNT_INVALID` (400). | MVP |
| PS-040-02.R03 | `currency` equals the rental's agreed currency. Mismatch → `COM.CURRENCY_MISMATCH` (422). No quote conversion (ASSUMPTION). | MVP |
| PS-040-02.R04 | `method` is one of the five CTR-COM-001 methods except `in_kind_compensation`, which → `DEPOSITS.METHOD_NOT_ALLOWED` (422). `onchain_transfer` without `external_ref` → `SYS.REQUEST_MALFORMED` (400). | MVP |
| PS-040-02.R05 | Any key named `wallet`, `wallet_id`, `balance`, `payout` or `platform_account` at any depth → `COM.CUSTODY_FORBIDDEN` (422). | MVP |
| PS-040-02.R06 | `notes` ≤ 500 UTF-8 characters. E-mail, phone or street-address patterns → `DEPOSITS.NOTES_CONTACT_DATA` (400). Pattern matching is a heuristic (ASSUMPTION), not a privacy guarantee. | MVP |
| PS-040-02.R07 | `owner_ref` ≠ `renter_ref`, both are `acc_` and both participate in the rental. Malformed → `DEPOSITS.INVALID_PARTIES` (400). Non-participant → `SYS.NOT_FOUND`. | MVP |
| PS-040-02.R08 | Partial release: deduction total ≤ held amount (`DEPOSITS.RELEASE_EXCEEDS_HELD`, 422). Each deduction line references a `dmg_` line in `AGREED` (`DEPOSITS.NO_DEDUCTION_AGREEMENT`, 422). | MVP |
| PS-040-02.R09 | Error bodies carry `message_key` and field path. They never echo amounts or notes. | MVP |

## Data / schema
Shape checks use the JSON Schema in PS-040-01. Check order: authentication → participant check (R07, returns `SYS.NOT_FOUND`) → shape → custody (R05) → method (R04) → cap and currency (R02, R03) → state (PS-040-03). Authorization comes before shape so that non-participants cannot probe field rules.

## Commands / queries / events
Applies to every command in PS-040-04 at entry. Queries apply R07 only.

## States & transitions
Gates only. Transitions are in PS-040-03; validation runs before each transition guard.

## Validation & errors
Codes and retry flags: all `DEPOSITS.*` codes above are non-retryable (`retryable: false`). Logs record the code and rule ID only.

## Authorization
Validation does not grant access. R07 is the only authorization-linked rule.

## Failure, idempotency, concurrency, offline
Validation failures are deterministic and safe to replay. Offline-queued commands are revalidated on the server at commit (D08 PROVISIONAL). A queued command that now fails is moved to the "not applied" state with its `message_key`.

## Privacy, retention, abuse
Rejected payloads are not stored. Validation logs carry no field values (CTR-PRV-001 R09).

## Observability & budgets
`deposits_validation_reject_total{code}`. Validation p95 ≤ 20 ms (ASSUMPTION).

## Tests
- TEST-PS-040-02-01 (unit): one case per R01–R08 code, asserting code, category and HTTP status.
- TEST-PS-040-02-02 (property): random decimal strings; only canonical non-zero values pass R02.
- TEST-PS-040-02-03 (negative): `notes` containing an e-mail address is rejected; log scan finds no amount or notes.
- TEST-PS-040-02-04 (integration): non-participant receives `SYS.NOT_FOUND`, not a field-level error.

## Acceptance criteria
1. Every rule ID R01–R09 maps to one test and one error code in the CTR-ERR-001 registry.
2. Zero rejected payload values appear in logs (TEST-PS-040-02-03).
3. Check order matches the sequence above.

## Assumptions & open decisions
- ASSUMPTION: cap equals declared item value; F05 must confirm (OPEN).
- PROVISIONAL (D09 default, unapproved): no custody fields permitted.
- OPEN: contact-data detection method; F10 must approve before release.
