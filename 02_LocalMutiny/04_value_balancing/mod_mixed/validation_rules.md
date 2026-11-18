# PS-026-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_mixed. **Parent:** [mod_mixed SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-COM-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-026-02.R01 | Reject any leg whose `amount_minor` fails the PS-026-01.R03 pattern with `MIXED.LEG_AMOUNT_INVALID`. | MVP |
| PS-026-02.R02 | Reject a `currency` not in the F09 currency registry with `MIXED.LEG_CURRENCY_UNSUPPORTED`. | MVP |
| PS-026-02.R03 | Reject a cross-currency leg whose `quote_id` is expired at declaration with `MIXED.QUOTE_EXPIRED`. | MVP |
| PS-026-02.R04 | Sum of compensation legs owed by each party must equal that party's gap in the snapshot exactly (0 minor units tolerance). Otherwise `MIXED.GAP_NOT_BALANCED`. | MVP |
| PS-026-02.R05 | `from_par` ≠ `to_par`; both must be active participant slots of the same revision. Otherwise `MIXED.LEG_PARTY_INVALID`. | MVP |
| PS-026-02.R06 | Legs per revision ≤ 8 (ASSUMPTION). Excess → `MIXED.LEG_LIMIT_EXCEEDED`. | MVP |
| PS-026-02.R07 | `description` (in-kind) ≤ 280 characters, no URL, e-mail or phone-number pattern. Otherwise `MIXED.IN_KIND_DESCRIPTION_INVALID`. | MVP |
| PS-026-02.R08 | Any field named `platform_account`, `wallet`, `balance` or `payout` → `COM.CUSTODY_FORBIDDEN` (CTR-COM-001 R01). | MVP |

## Data / schema
Validation runs on the proposed revision as a whole, not per leg, so R04 sees all legs.

## Commands / queries / events
Invoked by `mixed.leg.declare` (PS-026-04) before persistence. No validation runs on read.

## States & transitions
Not applicable. Validation is a pure guard; failure leaves state unchanged.

## Validation & errors
| Code | Retryable | Category / HTTP | Privacy-safe diagnostic |
|---|---|---|---|
| MIXED.LEG_AMOUNT_INVALID | false | validation / 400 | field path only |
| MIXED.LEG_CURRENCY_UNSUPPORTED | false | validation / 400 | field path only |
| MIXED.QUOTE_EXPIRED | true | precondition_failed / 412 | `quote_id` class only; client re-quotes |
| MIXED.GAP_NOT_BALANCED | false | unprocessable_state / 422 | party index, no amounts |
| MIXED.LEG_PARTY_INVALID | false | validation / 400 | field path only |
| MIXED.LEG_LIMIT_EXCEEDED | false | validation / 400 | count only |
| MIXED.IN_KIND_DESCRIPTION_INVALID | false | validation / 400 | rule enum only |

User message keys follow CTR-ERR-001 R05 (`err.mixed.<code>`). Input values are never echoed.

## Authorization
Validation runs after authorization (PS-026-05). A rejected unauthorized call returns `SYS.FORBIDDEN` or `SYS.NOT_FOUND` before any validation.

## Failure, idempotency, concurrency, offline
Validation is deterministic for the same input and snapshot, so retries of a rejected request produce the same error. Offline clients run the same rules locally as a preview only; the server result is authoritative (D08).

## Privacy, retention, abuse
Error diagnostics carry no amounts or party IDs (CTR-ERR-001 R10). Rule failures counted per actor for abuse signals only.

## Observability & budgets
Validation of an 8-leg revision ≤ 5 ms p95 (ASSUMPTION). Metric: `mixed_validation_rejections_total{code}`.

## Tests
- TEST-PS-026-02-01 (unit): each error code triggered by one minimal input.
- TEST-PS-026-02-02 (property): for random legs, R04 passes iff exact integer sums match the gap.
- TEST-PS-026-02-03 (negative): payloads with `wallet`, `balance` or `payout` fields return `COM.CUSTODY_FORBIDDEN`.
- TEST-PS-026-02-04 (unit): 280-character boundary accepted; 281 rejected.

## Acceptance criteria
1. All seven MIXED codes and COM.CUSTODY_FORBIDDEN are in the CTR-ERR-001 registry lint.
2. R04 uses integer arithmetic only; no float path exists (code review gate).
3. No error body contains an amount or a party ID.

## Assumptions & open decisions
- ASSUMPTION: 0-minor-unit gap tolerance; rounding is handled upstream by mod_valuation (PS-027-02).
- PROVISIONAL: quote expiry per D03 default (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
