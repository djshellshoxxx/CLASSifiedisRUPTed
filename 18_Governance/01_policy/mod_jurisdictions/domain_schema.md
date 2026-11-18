# PS-145-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_jurisdictions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-145-01.R01 | Regions use coarse codes only (ISO 3166-1 alpha-2 or an approved sub-region code); no postal code, coordinates or address fields. | MVP |
| PS-145-01.R02 | Every rule has a `source_ref` (document identifier and date) and an `approved_by` `acc_` ID. | MVP |
| PS-145-01.R03 | Rule versions are immutable; withdrawal sets `withdrawn_at` and keeps the record. | MVP |
| PS-145-01.R04 | `max_data_class` is `PUBLIC`; the register stores no user data. | MVP |

## Data / schema
`jurisdiction_rule`:
- `rule_key`: string, `^JR-[A-Z]{2}-[0-9]{3}$`, immutable.
- `region_code`: ISO 3166-1 alpha-2 or approved sub-region.
- `goods_category_keys`: array of keys from [mod_goods](../mod_goods/SPEC.md).
- `listing_type`: enum `goods`, `service`, `rental`, `auction`, `barter`.
- `effect`: enum `permitted`, `restricted`, `disclosure_required`, `prohibited`.
- `disclosure_key`: message key or null.
- `source_ref`: `{document_id, published_on, url_hash}`; `approved_by`: `acc_`.
- `effective_from`, `effective_to`: date. `version`: semver. `withdrawn_at`: timestamp or null.

Provenance: `source_ref` only; the register holds no copy of statute text.

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-145-01-01 (unit): a coordinate-like value in a region field is rejected.
- TEST-PS-145-01-02 (schema): a rule without source_ref is rejected.

## Acceptance criteria
1. TEST-PS-145-01-01, TEST-PS-145-01-02 pass in CI.
2. Each requirement in this file maps to at least one test above.


## Assumptions & open decisions
- ASSUMPTION: field list is provisional until the module owner review; rule text itself is not stored.
- D05 (geoprivacy) governs region granularity: PROVISIONAL (D05 default, unapproved).
