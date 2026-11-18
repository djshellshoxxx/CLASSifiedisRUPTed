# PS-045-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_index. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001, CTR-SCH-001, CTR-PRV-001.

**Decision labels:** Field allowlist is PROVISIONAL (D05 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-02.R01 | Reject any event whose `schema_version` MAJOR is unknown with `SCH.UNKNOWN_VERSION`; do not write an index doc. | MVP |
| PS-045-02.R02 | Reject an event with `provenance.source_kind = federated_import` lacking a valid `signature` (CTR-EVT-001 R05) with `INDEX.SIGNATURE_MISSING`. | Future |
| PS-045-02.R03 | `title` 1–120 Unicode code points after NFC; control characters and bidi overrides (U+202A–U+202E, U+2066–U+2069) rejected. | MVP |
| PS-045-02.R04 | `price_minor` is a base-10 integer string, max 39 digits, no leading zero except `0`; any other form → `INDEX.INVALID_PRICE`. | MVP |
| PS-045-02.R05 | `region_cell` must be in the registered cell set; unknown cell → `INDEX.UNKNOWN_CELL`; a cell below K_MIN = 5 active items is suppressed from query results, not rejected at write. | MVP |
| PS-045-02.R06 | `category_path` 1–4 entries, each in the category registry; otherwise `INDEX.INVALID_CATEGORY`. | MVP |
| PS-045-02.R07 | Non-allowlisted source fields are dropped and counted; the event is still accepted. | MVP |

## Data / schema
Validation runs against the `lst.*` event schemas registered in CTR-SCH-001. The index's own record schema is in [domain_schema.md](domain_schema.md).

| Rule | Field | Check | Error code | Retryable |
|---|---|---|---|---|
| V1 | envelope | `schema_version` major known | SCH.UNKNOWN_VERSION | false |
| V2 | envelope | `revision` ≥ 1, integer | INDEX.INVALID_REVISION | false |
| V3 | `title` | length, NFC, no bidi | INDEX.INVALID_TITLE | false |
| V4 | `price_minor` | CTR-COM-001 R02 form | INDEX.INVALID_PRICE | false |
| V5 | `region_cell` | in registry | INDEX.UNKNOWN_CELL | false |
| V6 | `category_path` | registry lookup | INDEX.INVALID_CATEGORY | false |
| V7 | `signature` | required when federated | INDEX.SIGNATURE_MISSING | false |

## Commands / queries / events
Validation applies to `index.apply_event` (PS-045-04). `index.suppress` accepts `reason_code` only from the closed enum `{POLICY_HOLD, FRAUD_HOLD, PRIVACY_HOLD, OWNER_HIDDEN}` (ASSUMPTION; F12 to confirm).

## States & transitions
Validation failure leaves state unchanged (see PS-045-03).

## Validation & errors
Error envelope per CTR-ERR-001 R01. `details[].field` is a JSON pointer (for example `/payload/price_minor`); input values are never echoed (CTR-ERR-001 R07). Users see `err.index.invalid_price` etc.

## Authorization
Validation is authorization-independent; authorization is checked first (PS-045-05).

## Failure, idempotency, concurrency, offline
Validation is deterministic: the same event bytes always produce the same result. Re-delivery of a rejected event returns the same code.

## Privacy, retention, abuse
Rejected payloads are not persisted; only `code`, `event_id`, `revision` and count go to operational logs (RET-OPS). Title validation blocks Unicode spoofing used for impersonation.

## Observability & budgets
Metric `index_validation_reject_total{code}`. Alert if a single code exceeds 1% of events over 15 min (ASSUMPTION).

## Tests
- TEST-PS-045-02-01 (unit): each rule V1–V7 has a passing and a failing fixture.
- TEST-PS-045-02-02 (property): random Unicode titles never store bidi override characters.
- TEST-PS-045-02-03 (contract): error codes match CTR-ERR-001 registry format `INDEX.<CODE>`.

## Acceptance criteria
1. 100% of V1–V7 fixtures produce the specified code and `retryable` value.
2. Dropped-field counter increments for every non-allowlisted field in fixtures.
3. No validation error echoes an input value (static test over the error catalog).

## Assumptions & open decisions
- ASSUMPTION: K_MIN = 5 per CTR-PRV-001 R04 (F10 to validate).
- ASSUMPTION: `reason_code` enum above pending F12 review.
- D05 PROVISIONAL (cell-level location only).
