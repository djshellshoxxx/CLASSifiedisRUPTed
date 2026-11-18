# PS-068-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_crypto (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02, R03, R08–R10, Validation table), CTR-ERR-001. **Decisions:** D03, D04 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-068-02.R01 | `external_ref` is required when `method = onchain_transfer` (CTR-COM-001). | MVP |
| PS-068-02.R02 | Claim `currency.code` must be a CAIP-19 asset enabled in the registry; otherwise rejected. | MVP |
| PS-068-02.R03 | Adapter match requires exact equality of chain, asset, recipient address (case-normalized per chain rules) and `amount_minor` ≥ expected. | MVP |
| PS-068-02.R04 | Partial amount: claim stays `CLAIMED` with `COM.AMOUNT_MISMATCH`. Excess is recorded and verified. | MVP |
| PS-068-02.R05 | `(chain, tx_hash)` is unique across claims (`COM.DUPLICATE_TX_REF`). | MVP |
| PS-068-02.R06 | Any `tx_hash` must match the chain's format for its CAIP-2 namespace; otherwise `COM.REQUEST_MALFORMED` → `SYS.REQUEST_MALFORMED`. | MVP |

## Data / schema
Rule enum: `external_ref_required`, `asset_enabled`, `chain_match`, `asset_match`, `recipient_match`, `amount_match`, `tx_unique`, `tx_format`.

## Commands / queries / events
Applies to `clm.submit` (crypto) and `adapter.verify`.

## States & transitions
Validation failure creates no claim and no verification record.

## Validation & errors
| Rule | Code | Category / HTTP | Retryable |
|---|---|---|---|
| Asset not enabled | `CRYPTO.ASSET_DISABLED` | unprocessable_state / 422 | false |
| Chain mismatch | `COM.CHAIN_MISMATCH` | unprocessable_state / 422 | false |
| Asset mismatch | `COM.ASSET_MISMATCH` | unprocessable_state / 422 | false |
| Recipient mismatch | `COM.RECIPIENT_MISMATCH` | unprocessable_state / 422 | false |
| Amount short or excess | `COM.AMOUNT_MISMATCH` | unprocessable_state / 422 | false |
| Duplicate tx | `COM.DUPLICATE_TX_REF` | conflict / 409 | false |
| Bad tx format | `SYS.REQUEST_MALFORMED` | validation / 400 | false |
| Finality pending | `COM.FINALITY_PENDING` | precondition_failed / 412 | true |
| Adapter down | `COM.VERIFIER_UNAVAILABLE` | unavailable / 503 | true |

## Authorization
Verification is a `sys_` action scoped to one claim.

## Failure, idempotency, concurrency, offline
Two providers must agree on match fields; disagreement yields `COM.VERIFIER_UNAVAILABLE` (retry) rather than a verdict (see PS-068-06).

## Privacy, retention, abuse
Diagnostics never echo addresses or tx hashes (CTR-ERR-001 R06).

## Observability & budgets
Counter by code and chain. Alert if mismatch codes exceed 10% of verifications on one chain in an hour (ASSUMPTION).

## Tests
- TEST-PS-068-02-01 (unit): every row of the error table.
- TEST-PS-068-02-02 (golden): 99% amount stays `CLAIMED`; 100% verifies; 101% verifies with excess recorded (CTR-COM test 06).
- TEST-PS-068-02-03 (unit): look-alike asset contract address rejected by `COM.ASSET_MISMATCH`.
- TEST-PS-068-02-04 (unit): duplicate tx across two claims yields `COM.DUPLICATE_TX_REF`.

## Acceptance criteria
1. Each mismatch returns its code and leaves state unchanged.
2. No verification without all match fields.
3. Diagnostics contain no address or hash.

## Assumptions & open decisions
- ASSUMPTION: address normalization follows the chain's canonical checksum rule.
- D04 (PROVISIONAL default, unapproved): per-party attestation plus compensating recovery; no atomic guarantee.
- D03 (PROVISIONAL default, unapproved).
