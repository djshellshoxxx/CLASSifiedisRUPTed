# PS-144-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-144-02. **Owner:** [18_Governance/01_policy/mod_goods](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_goods. **Consumers:** F01 listings (evaluate), F12 moderation (review console), F13 notifications (decision messages). **Upstream:** F07 identity, F16 security, mod_jurisdictions. See [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
**Business outcome.** Every command and query is accepted or refused with one stable, typed error code. A refused request changes no record and emits no event. Callers can act on the code without seeing private data.

**Exclusions.** Field shapes are defined in domain_schema.md. Authorization decisions are defined in authorization_capabilities.md. Only the rejection logic lives here.

## Requirements
- **PS-144-02.R01.** Define each check, its scope, its error code and whether a retry can succeed.
- **PS-144-02.R02.** Cover invalid, duplicate, expired, concurrent, offline and adversarial inputs (sections below).
- **PS-144-02.R03.** Errors are localized by key, not by text; diagnostics carry no personal data.

## Evaluation order
Checks run in this order and stop at the first failure: (1) feature flag; (2) schema version and payload shape; (3) idempotency key; (4) authorization (see authorization_capabilities.md); (5) field rules; (6) business rules and invariants; (7) optimistic-lock and state checks at write time.

## Error envelope
Every error returns: `code` (`GOODS_<CODE>`), `retryable` (boolean), `presentation_key` (`goods.error.<code in lower case>`, per CTR-ERR-001), `field` (JSON pointer or null), `request_id`. No value of the rejected input is echoed back.

## Rule table
| # | Scope | Check | Error code | Retryable |
|---|---|---|---|---|
| 1 | module | Feature flag for goods is off | GOODS_MODULE_DISABLED | no |
| 2 | envelope | `schema_version` missing or not supported | GOODS_SCHEMA_VERSION_UNSUPPORTED | no |
| 3 | envelope | Unknown top-level field, wrong JSON type or missing required field | GOODS_PAYLOAD_INVALID | no |
| 4 | envelope | Body larger than 16 KiB | GOODS_PAYLOAD_TOO_LARGE | no |
| 5 | envelope | `idempotency_key` missing, or not 16–128 chars of `[A-Za-z0-9_-]` | GOODS_IDEMPOTENCY_KEY_INVALID | no |
| 6 | envelope | Same key and scope with a different canonical payload hash | GOODS_IDEMPOTENCY_KEY_REUSED | no |
| 7 | envelope | Same key still in progress | GOODS_IDEMPOTENCY_IN_PROGRESS | yes |
| 8 | category | `category_code` fails regex or length | GOODS_CATEGORY_CODE_INVALID | no |
| 9 | category | `category_code` already exists | GOODS_CATEGORY_CODE_TAKEN | no |
| 10 | category | `parent_category_id` does not exist | GOODS_CATEGORY_PARENT_NOT_FOUND | no |
| 11 | category | Parent cycle, or depth > 4 | GOODS_CATEGORY_HIERARCHY_INVALID | no |
| 12 | category | `display_name_key` fails pattern | GOODS_DISPLAY_KEY_INVALID | no |
| 13 | category | Evaluation requested for a `DEPRECATED` category | GOODS_CATEGORY_DEPRECATED | no |
| 14 | rule | `jurisdiction_scope` malformed or absent from the mod_jurisdictions reference | GOODS_JURISDICTION_SCOPE_INVALID | no |
| 15 | rule | `policy_class` not in enum | GOODS_POLICY_CLASS_INVALID | no |
| 16 | rule | Condition code unknown, duplicated or more than 8 | GOODS_CONDITION_CODE_INVALID | no |
| 17 | rule | `STANDARD` with conditions, or `CONDITIONAL` without conditions | GOODS_CONDITION_SET_MISMATCH | no |
| 18 | rule | `effective_until` ≤ `effective_from` | GOODS_EFFECTIVE_RANGE_INVALID | no |
| 19 | rule | Activation with `effective_from` earlier than now − 5 min (A-goods-07) | GOODS_EFFECTIVE_RANGE_INVALID | no |
| 20 | rule | Overlap with another SCHEDULED or ACTIVE rule (invariant I1) | GOODS_RULE_OVERLAP | no |
| 21 | rule | Content edit on a rule not in `EDITING` | GOODS_RULE_NOT_EDITABLE | no |
| 22 | rule | Transition not allowed from current state | GOODS_RULE_STATE_INVALID | no |
| 23 | rule | Activator equals drafter | GOODS_SEPARATION_OF_DUTIES | no |
| 24 | rule | Retirement without `retirement_reason_code` | GOODS_RETIREMENT_REASON_REQUIRED | no |
| 25 | decision | `subject_ref` pattern fails or `subject_kind` prefix mismatches | GOODS_SUBJECT_REF_INVALID | no |
| 26 | review | `reviewer_note` over 500 chars or contains control characters | GOODS_NOTE_INVALID | no |
| 27 | review | `reason_code` not valid for the outcome | GOODS_REASON_CODE_INVALID | no |
| 28 | review | Reviewer equals subject owner | GOODS_CONFLICT_OF_INTEREST | no |
| 29 | review | Case claimed by another reviewer with an active lease | GOODS_REVIEW_LEASE_HELD | yes |
| 30 | review | Case not in a state that allows the requested transition | GOODS_REVIEW_STATE_INVALID | no |
| 31 | write | `expected_version` differs from stored version | GOODS_VERSION_CONFLICT | yes (after re-read) |
| 32 | read | Referenced ID does not exist or is not visible to the caller | GOODS_NOT_FOUND | no |
| 33 | flow | Request rate above limit (see privacy_retention_abuse.md) | GOODS_RATE_LIMITED | yes |
| 34 | dependency | mod_jurisdictions reference or outbox unavailable | GOODS_DEPENDENCY_UNAVAILABLE | yes |
| 35 | internal | Unclassified server fault | GOODS_INTERNAL_ERROR | yes |

Authorization refusal uses GOODS_NOT_AUTHORIZED (see authorization_capabilities.md).

## Field-level rules by example
- `category_code` `household.kitchen_appliances` passes; `Household Kitchen` fails rule 8.
- `effective_from` `2026-12-01T00:00:00.000Z` with `effective_until` `2026-12-01T00:00:00.000Z` fails rule 18.
- `condition_codes` `["AGE_RESTRICTED", "AGE_RESTRICTED"]` fails rule 16.
- `policy_class` `STANDARD` with `condition_codes` `["SAFETY_NOTICE_REQUIRED"]` fails rule 17.

## Adversarial and edge inputs
- Unicode look-alikes in `category_code` (for example Cyrillic letters) fail rule 8 because the regex is ASCII-only.
- Trailing whitespace and NUL bytes in `reviewer_note` fail rule 26.
- Numeric strings in integer fields fail rule 3; no implicit coercion.
- A payload with a valid `idempotency_key` but a modified `subject_ref` fails rule 6.

## Assumptions
- **A-goods-07.** Activation may set `effective_from` up to 5 minutes before the server clock to absorb skew. Earlier values are refused, so no rule is silently backdated.

## Open decisions
- **OD-GOODS-03.** Whether rule 19 should allow a larger skew for offline-origin operators. Default: no; operators retry with a current timestamp.
