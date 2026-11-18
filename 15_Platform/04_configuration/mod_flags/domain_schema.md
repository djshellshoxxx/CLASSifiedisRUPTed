# PS-124-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_flags (F15.S04.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-CAP-001, CTR-ID-001, CTR-PRV-001. **Canonical owner of record class "runtime flag definition and rollout state":** F15.S04.M02. Moderation reports (`rpt_`, F12.S01.M01 `mod_flags`) are a different record class and are not flags.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-124-01.R01 | Each flag has one `feature_slug` from PS-123 and one `key`; a flag without a catalog feature is refused. | MVP |
| PS-124-01.R02 | `type` is a closed enum: `boolean`, `string`, `number`. Variants are declared per type. | MVP |
| PS-124-01.R03 | Rollout percentage is an integer in 0–10000 (basis points). | MVP |
| PS-124-01.R04 | Temporary flags carry `expires_at` no later than 180 days after creation (ASSUMPTION); on expiry the flag reverts to default. | MVP |
| PS-124-01.R05 | Flags never grant capabilities; a flag is not an authorization decision (CTR-CAP-001 R01). | MVP |

## Data / schema
```json
{
  "key": "snake_case, unique, never reused",
  "feature_slug": "PS-123 slug",
  "type": "boolean | string | number",
  "default_value": "typed per type; must be safe-off for gated features",
  "variants": [{"name": "snake_case", "value": "typed", "weight_bp": "0..10000"}],
  "rollout_bp": "0..10000",
  "targeting": [{"attribute": "allow-list name", "op": "in | eq", "values": ["..."]}],
  "kill_switch": "boolean",
  "expires_at": "RFC 3339 UTC ms or null",
  "revision": "integer >= 1",
  "updated_at": "RFC 3339 UTC ms"
}
```
Constraints: `variants` weights sum to 10000; `kill_switch = true` forces default value at evaluation.

## Commands / queries / events
See PS-124-04.

## States & transitions
See PS-124-03.

## Validation & errors
See PS-124-02.

## Authorization
See PS-124-05.

## Failure, idempotency, concurrency, offline
Changes are revision-checked; evaluation is deterministic (PS-124-06).

## Privacy, retention, abuse
Targeting attributes are restricted to the allow-list in PS-124-07.

## Observability & budgets
Flag evaluation counts per key (no identifiers).

## Tests
- TEST-PS-124-01-01 (schema): variant weights must sum to 10000.
- TEST-PS-124-01-02 (lint): flag without catalog feature refused.
- TEST-PS-124-01-03 (unit): expiry date beyond 180 days refused.
- TEST-PS-124-01-04 (unit): flag evaluation cannot authorize a capability (fixture with `true` value on a protected action still denied).

## Acceptance criteria
1. Schema and lint pass for all flags.
2. TEST-PS-124-01-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 180-day maximum for temporary flags.
- PROVISIONAL (D05 default): location-related flags use coarse regions only.
