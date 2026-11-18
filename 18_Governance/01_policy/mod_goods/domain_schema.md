# PS-144-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-144-01. **Owner:** [18_Governance/01_policy/mod_goods](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_goods. **Consumers:** F01 listings (evaluate, read decisions), F12 moderation (review cases), F17 quality (audit sampling), F18 compliance reporting. **Upstream:** F07 identity, F10 privacy, F15 platform, F16 security, mod_jurisdictions (scope codes), mod_prohibited (referrals). See [dependency matrix](../../../DEPENDENCY_MATRIX.md) and [CONTRACTS](../../../planning/CONTRACTS.md).

## Purpose and scope
**Business outcome.** Before a listing (F01), offer or proposal names a good, the platform records which goods category it belongs to and which policy class applies in the jurisdiction scope. Each evaluation yields exactly one outcome: `ALLOW`, `ALLOW_WITH_CONDITIONS`, `HOLD_FOR_REVIEW`, `REJECTED` or `REFERRED`. The module owns four records: `goods_category`, `goods_policy_rule`, `goods_decision` and `goods_review_case`.

**Exclusions.**
- Prohibited-item determinations are not made here. A `REFER` class routes the subject to mod_prohibited (A-goods-03).
- User jurisdiction resolution is not made here. Scope codes come from mod_jurisdictions (A-goods-04).
- Listing content (title, photos, description, price) and listing lifecycle belong to F01.
- No money, escrow, payment evidence or delivery evidence. No platform custody.
- Account sanctions and appeals belong to F12.
- User location is never stored. `jurisdiction_scope` is a policy scope, not a location record.

## Entities and relationships
- `goods_category` 1..N `goods_policy_rule`.
- `goods_category` 1..N `goods_decision`.
- `goods_decision` 0..1 `goods_review_case` (one case per `HOLD_FOR_REVIEW` decision).
- `goods_decision` is append-only. Review outcomes append a new decision row with `origin = REVIEW`; the original row is never changed.

## goods_category
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| category_id | string (ULID, CTR-ID-001) | no | 26 chars, server-generated, immutable | — | `01J9GDCAT00000000000000001` |
| category_code | string | no | `^[a-z0-9]+(\.[a-z0-9_]+){0,3}$`, 3–64 chars, unique, case-sensitive | — | `household.kitchen_appliances` |
| parent_category_id | string | yes | must exist; no cycles; depth ≤ 4 | null | null |
| display_name_key | string | no | `^goods\.[a-z0-9_.]{3,120}$`; localized through the CTR-ERR-001 presentation pattern | — | `goods.household.kitchen_appliances` |
| status | enum `ACTIVE`, `DEPRECATED` | no | `DEPRECATED` blocks new evaluations (GOODS_CATEGORY_DEPRECATED) and keeps history | `ACTIVE` | `ACTIVE` |
| version | integer | no | ≥ 1; +1 per update; optimistic lock | 1 | 3 |
| schema_version | string | no | `"1.0"` (A-goods-02) | `"1.0"` | `"1.0"` |
| created_at, updated_at | timestamp | no | RFC 3339 UTC, millisecond precision | server time | `2026-11-10T09:00:00.000Z` |

## goods_policy_rule
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| rule_id | string (ULID) | no | immutable | — | `01J9GRULE00000000000000001` |
| category_id | string | no | FK goods_category; immutable after `EDITING` | — | `01J9GDCAT00000000000000001` |
| jurisdiction_scope | string | no | `GLOBAL`, `^[A-Z]{2}$` or `^[A-Z]{2}-[A-Z0-9]{1,3}$`; code must exist in the mod_jurisdictions reference | `GLOBAL` | `US-CA` |
| policy_class | enum `STANDARD`, `CONDITIONAL`, `REVIEW`, `REFER` | no | see enumerations | `REVIEW` | `CONDITIONAL` |
| condition_codes | array of enum | no (may be empty) | unique, 0–8 items, from enum (A-goods-06); empty iff `STANDARD`; non-empty iff `CONDITIONAL` | `[]` | `["AGE_RESTRICTED"]` |
| effective_from | timestamp | no | RFC 3339 UTC; activation rules in validation_rules.md | — | `2026-12-01T00:00:00.000Z` |
| effective_until | timestamp | yes | > effective_from when set | null | null |
| lifecycle_state | enum `EDITING`, `SCHEDULED`, `ACTIVE`, `RETIRED` | no | transitions in workflow_state_machine.md | `EDITING` | `SCHEDULED` |
| rule_version | integer | no | ≥ 1 per (category_id, jurisdiction_scope) | 1 | 2 |
| supersedes_rule_id | string | yes | must reference a `RETIRED` rule with the same category and scope | null | `01J9GRULE00000000000000001` |
| retirement_reason_code | enum | yes | required when `RETIRED`: `SUPERSEDED`, `POLICY_WITHDRAWN`, `ERROR_CORRECTION`, `DISCARDED_BEFORE_ACTIVE` | null | `SUPERSEDED` |
| drafted_by_ref | string | no | pseudonymous operator reference (privacy_retention_abuse.md) | — | `act_ref_7f3a9c01` |
| activated_by_ref | string | yes | must differ from drafted_by_ref (GOODS_SEPARATION_OF_DUTIES) | null | `act_ref_5b2e7d44` |
| retired_by_ref | string | yes | set when `RETIRED` | null | `act_ref_5b2e7d44` |
| version | integer | no | optimistic lock | 1 | 4 |
| schema_version | string | no | `"1.0"` | `"1.0"` | `"1.0"` |

## goods_decision (append-only)
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| decision_id | string (ULID) | no | immutable | — | `01J9GDEC000000000000000001` |
| subject_kind | enum `LISTING`, `OFFER`, `PROPOSAL` | no | — | — | `LISTING` |
| subject_ref | string | no | `^(lst\|ofr\|prp)_[0-9A-Z]{26}$`; opaque reference owned by F01, F02 or F03 | — | `lst_01J9GLST000000000000000002` |
| category_id | string | no | must reference an `ACTIVE` category at evaluation time | — | `01J9GDCAT00000000000000001` |
| jurisdiction_scope | string | no | resolved scope used for matching (see precedence below) | `GLOBAL` | `US-CA` |
| matched_rule_id | string | yes | null only for `NO_ACTIVE_RULE_DEFAULT_REVIEW` (A-goods-05) | null | `01J9GRULE00000000000000001` |
| outcome | enum `ALLOW`, `ALLOW_WITH_CONDITIONS`, `HOLD_FOR_REVIEW`, `REJECTED`, `REFERRED` | no | — | — | `HOLD_FOR_REVIEW` |
| reason_code | enum (see enumerations) | no | must be valid for outcome and origin | — | `MATCHED_REVIEW` |
| condition_codes | array of enum | no | copy of matched rule conditions, or reviewer-confirmed set | `[]` | `[]` |
| origin | enum `EVALUATION`, `REVIEW` | no | `REVIEW` rows must carry case_id | `EVALUATION` | `EVALUATION` |
| case_id | string | yes | set for `HOLD_FOR_REVIEW` and all `REVIEW` rows | null | `01J9GCASE00000000000000001` |
| actor_ref | string | no | pseudonymous; service identity for `EVALUATION`, reviewer for `REVIEW` | — | `svc_ref_listing_01` |
| evaluated_at | timestamp | no | server time, UTC | server time | `2026-11-10T09:01:12.410Z` |
| sampled_for_audit | boolean | no | true for about 5% of `ALLOW` outcomes (A-goods-13) | false | true |
| schema_version | string | no | `"1.0"` | `"1.0"` | `"1.0"` |

## goods_review_case
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| case_id | string (ULID) | no | immutable | — | `01J9GCASE00000000000000001` |
| decision_id | string | no | unique FK to the `HOLD_FOR_REVIEW` decision | — | `01J9GDEC000000000000000001` |
| state | enum (workflow_state_machine.md) | no | — | `OPEN` | `IN_REVIEW` |
| assigned_reviewer_ref | string | yes | pseudonymous; must differ from subject owner (GOODS_CONFLICT_OF_INTEREST) | null | `act_ref_9c1d0e27` |
| lease_expires_at | timestamp | yes | claim time + 24 h (A-goods-08) | null | `2026-11-11T09:00:00.000Z` |
| sla_due_at | timestamp | no | opened_at + 72 h (A-goods-08) | — | `2026-11-13T09:00:00.000Z` |
| reviewer_note | string | yes | max 500 chars, NFC, no control characters except newline; internal only | null | `Documents requested` |
| reason_code | enum (review reason codes) | yes | set on decision | null | `REVIEW_ALLOWED_WITH_CONDITIONS` |
| opened_at, decided_at | timestamp | no / yes | UTC | opened_at server time | — |
| version | integer | no | optimistic lock | 1 | 2 |

## Enumerations
- `policy_class`: `STANDARD`, `CONDITIONAL`, `REVIEW`, `REFER`.
- `condition_codes` (A-goods-06): `AGE_RESTRICTED`, `LICENSE_REFERENCE_REQUIRED`, `SAFETY_NOTICE_REQUIRED`, `ORIGIN_DECLARATION_REQUIRED`, `SECOND_HAND_DECLARATION`, `HAZARD_HANDLING_NOTICE`, `MANUFACTURER_LABEL_REQUIRED`, `DIRECT_EXCHANGE_ONLY`.
- Evaluation `reason_code`: `MATCHED_STANDARD`, `MATCHED_CONDITIONAL`, `MATCHED_REVIEW`, `MATCHED_REFER`, `NO_ACTIVE_RULE_DEFAULT_REVIEW`.
- Review `reason_code`: `REVIEW_ALLOWED`, `REVIEW_ALLOWED_WITH_CONDITIONS`, `REVIEW_REJECTED`, `REVIEW_REFERRED`, `REVIEW_WITHDRAWN_BY_OWNER`.
- `retirement_reason_code`: `SUPERSEDED`, `POLICY_WITHDRAWN`, `ERROR_CORRECTION`, `DISCARDED_BEFORE_ACTIVE`.

## Invariants
- **I1 (no overlap).** No two rules with the same `category_id` and `jurisdiction_scope`, both in `SCHEDULED` or `ACTIVE`, may have overlapping `[effective_from, effective_until)` ranges. Violation returns GOODS_RULE_OVERLAP.
- **I2 (append-only decisions).** Application code never updates or deletes a `goods_decision` row. Corrections append a new row.
- **I3 (immutable active content).** Content of a rule in `SCHEDULED`, `ACTIVE` or `RETIRED` is immutable. Changes require a new rule version.
- **I4 (scope precedence).** When several ACTIVE rules match, the most specific scope wins in this order: subdivision, then country, then `GLOBAL`. Overlap checks (I1) apply only within one specificity level.
- **I5 (referential integrity).** Every `category_id`, `rule_id` and `case_id` resolves within this module. Cross-module references are opaque IDs only.

## Assumptions
- **A-goods-01.** Identifiers are ULIDs as shown. CTR-ID-001 keeps the UUID/ULID choice OPEN; this module switches only if CTR-ID-001 changes, and the switch is a schema major change.
- **A-goods-02.** `schema_version` is the string `"1.0"` until CTR-SCH-001 is published. Additive changes stay in 1.x.
- **A-goods-03.** mod_prohibited owns the prohibited-item list and determinations. This module only routes `REFER` subjects to it.
- **A-goods-04.** Jurisdiction and subdivision codes are read from the mod_jurisdictions reference. `GLOBAL` is the default scope.
- **A-goods-05.** When no ACTIVE rule matches, the outcome is `HOLD_FOR_REVIEW` with `NO_ACTIVE_RULE_DEFAULT_REVIEW`. Absence of a rule never produces `ALLOW`.
- **A-goods-06.** The condition code list above is provisional and is owned by this module until the F12 and mod_prohibited vocabularies are reconciled.

## Open decisions
- **OD-GOODS-01.** Whether goods categories reuse the F01 listing category taxonomy or stay separate. Recommended default: separate catalog with a mapping table owned here.
- **OD-GOODS-02.** Whether `REJECTED` opens an F12 appeal automatically. Default: yes, as a referral event; the appeal record stays in F12.
- Related open items in [DECISIONS.md](../../../DECISIONS.md): D07 (retention), D10 (auth and portability). Not changed here.
