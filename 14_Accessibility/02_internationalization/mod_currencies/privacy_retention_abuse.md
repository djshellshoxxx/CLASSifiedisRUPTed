# PS-112-07 — privacy, retention and abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_currencies. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-112-07.R01 | The displayed currency is never inferred from IP address, GPS or any location source. | MVP |
| PS-112-07.R02 | Currency preference is a PSEUDONYMOUS field on the account, with device fallback. | MVP |
| PS-112-07.R03 | Amounts are never written to logs or analytics. | MVP |

## Data / schema
Preference field `display_currency` (PSEUDONYMOUS, `acc_`-scoped).

## Commands / queries / events
Preference change uses `lang.preference.set` family of the locale module (PS-113-04); no separate command.

## States & transitions
Not applicable.

## Validation & errors
Preference codes validated by [PS-112-02](validation_rules.md).

## Authorization
Owner only.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
Retention: preference until account deletion. Abuse: fake currency labels could mislead a user about value; mitigated by always showing the code with the amount and by the valuation rules owned by F09.

## Observability & budgets
No amounts in telemetry.

## Tests
- TEST-PS-112-07-01 static: no location or IP input to the format path.
- TEST-PS-112-07-02 log scan: no amount values in logs.

## Acceptance criteria
1. Currency code appears in 100% of rendered amounts.
2. Zero amounts in logs in the test run.

## Assumptions & open decisions
- ASSUMPTION: code shown in every amount label, even when symbol is present.
- No Dxx decision directly affects privacy here; D05 (geoprivacy) is respected by excluding location inputs.
