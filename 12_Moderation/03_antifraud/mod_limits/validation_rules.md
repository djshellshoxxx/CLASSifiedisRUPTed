# PS-098-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_limits. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-SCH-001, CTR-PRV-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-098-02.R01 | `quota_key` must be in the registry (PS-098-01). Unknown → `LIMITS.QUOTA_KEY_UNKNOWN`. | MVP |
| PS-098-02.R02 | `limit_value` 0–10 000 inclusive. Outside → `LIMITS.VALUE_OUT_OF_RANGE`. | MVP |
| PS-098-02.R03 | `region_cell` scope value must be a registered cell (CTR-PRV-001 R04); unregistered → `LIMITS.SCOPE_INVALID`. | MVP |
| PS-098-02.R04 | Lowering a limit below current usage is allowed and applies to new actions only; existing items are never removed by this module. | MVP |
| PS-098-02.R05 | `rationale_code` ∈ {ABUSE_PATTERN, CAPACITY, LEGAL_REQUIREMENT, PLATFORM_DEFAULT, TEST_ROLLOUT}. | MVP |
| PS-098-02.R06 | Activation requires `approved_by` distinct from `created_by`. | MVP |

## Data / schema
Module prefix `LIMITS` (6 characters).

| Code | Category | HTTP | Retryable | `details.rule` |
|---|---|---|---|---|
| `LIMITS.QUOTA_KEY_UNKNOWN` | validation | 400 | false | `quota_key` |
| `LIMITS.VALUE_OUT_OF_RANGE` | validation | 400 | false | `limit_value` |
| `LIMITS.SCOPE_INVALID` | validation | 400 | false | `scope_value` |
| `LIMITS.RATIONALE_UNKNOWN` | validation | 400 | false | `rationale_code` |
| `LIMITS.APPROVER_CONFLICT` | forbidden | 403 | false | `approved_by` |
| `LIMITS.TRANSITION_NOT_ALLOWED` | unprocessable_state | 422 | false | `state` |
| `LIMITS.QUOTA_EXCEEDED` | unprocessable_state | 422 | false | `quota_key` (returned to owner modules, not to end users as raw counts) |
| `LIMITS.POLICY_UNAVAILABLE` | unavailable | 503 | true | — |
| `LIMITS.EXPORT_TOO_LARGE` | validation | 400 | false | `cursor` (> 10 000 policies, PS-098-10) |

## Commands / queries / events
Check order: quota key, scope, active policy resolution, usage read, comparison.

## States & transitions
Validation failures write no `lim_event`.

## Validation & errors
`LIMITS.QUOTA_EXCEEDED` contains only the quota key and the policy `version`; it never includes the account's exact usage (prevents inference of other users' activity).

## Authorization
`LIMITS.SCOPE_INVALID` returned for scopes the caller cannot administer (CTR-ERR-001 R08 analogue: `SYS.NOT_FOUND` for unreadable policies).

## Failure, idempotency, concurrency, offline
Duplicate activation of the same `version` returns the original result.

## Privacy, retention, abuse
Error details never include coordinates, cell membership of an individual, or usage counts.

## Observability & budgets
Counter `limits_validation_error_total{code}`; `limits_quota_exceeded_total{quota_key}` (no account label).

## Tests
- `TEST-PS-098-02-01` unit: each code on exact condition only.
- `TEST-PS-098-02-02` negative: creator activates own policy → `LIMITS.APPROVER_CONFLICT`.
- `TEST-PS-098-02-03` negative: unregistered cell → `LIMITS.SCOPE_INVALID`.
- `TEST-PS-098-02-04` privacy: `QUOTA_EXCEEDED` body contains no count or account activity.

## Acceptance criteria
1. Every code maps to one condition and no other.
2. No usage numbers in error bodies.
3. Activation two-person rule tested.

## Assumptions & open decisions
- ASSUMPTION: default limits per quota key are set by F12 with F18 review; values are not specified here.
- D07 (retention), PROVISIONAL default applies to policy history (unapproved).
