# PS-144-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-01.R01 | Each category has one parent (or none for roots) and a unique `category_key`; the tree has no cycles and depth ≤ 6. | MVP |
| PS-144-01.R02 | A category carrying any restriction flag must reference at least one rule ID. | MVP |
| PS-144-01.R03 | Published category records are immutable; changes create a new `taxonomy_version`. | MVP |
| PS-144-01.R04 | `max_data_class` is `PUBLIC`. | MVP |

## Data / schema
`goods_category`:
- `category_key`: string, `^[a-z][a-z0-9_]{2,63}$`, immutable.
- `parent_key`: string or null. `depth`: integer 0–6.
- `label_keys`: map locale → message key (no prose in schema).
- `status`: enum `proposed`, `published`, `deprecated`.
- `attributes`: array of `{attr_key, type: enum[enum, integer, string_short], required: boolean, unit?}`.
- `restriction_flags`: array of enum `safety_review`, `age_restricted`, `disclosure_required`, `jurisdiction_dependent`, `prohibited_candidate`.
- `rule_refs`: array of rule IDs from mod_prohibited or mod_jurisdictions.
- `taxonomy_version`: semver. `replaced_by_key`: string or null (deprecated categories).

`goods_taxonomy_version`: `version`, `published_at`, `approved_by` (`acc_`), `category_count`.
