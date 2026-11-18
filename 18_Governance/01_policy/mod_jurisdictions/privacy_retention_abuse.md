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

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

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

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-145-07-01 (privacy): a region lookup query carries the region code only.
- TEST-PS-145-07-02 (privacy): stored records contain no postal code or point location.

## Acceptance criteria
1. TEST-PS-145-07-01, TEST-PS-145-07-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: rules are public; no secret rule content.
- D05 (geoprivacy) and D07 (retention) defaults: PROVISIONAL (unapproved).
