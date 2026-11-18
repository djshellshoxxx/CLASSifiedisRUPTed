# PS-145-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_jurisdictions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-145-07.R01 | Only region codes at country or approved sub-region level are stored; no point location. | MVP |
| PS-145-07.R02 | Region lookups from listings send the listing's region code only; no user identifier is attached to the query. | MVP |
| PS-145-07.R03 | Rule versions are retained while referenced by decisions, then for 2 years (D07 default, PROVISIONAL). | MVP |

## Abuse controls
- **Region spoofing** to avoid rules: region is taken from the listing's declared region and checked against coarse signals in F10 (ASSUMPTION; D05).
- **Rule injection:** only approved principals publish; two-person rule applies.

## Assumptions & open decisions
- ASSUMPTION: rules are public; no secret rule content.
- D05 (geoprivacy) and D07 (retention) defaults: PROVISIONAL (unapproved).
