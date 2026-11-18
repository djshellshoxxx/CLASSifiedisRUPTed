# PS-126-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_authorization](SPEC.md) (Security Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (grant and decision record schemas), CTR-ID-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-126-01.R01 | Grant rows conform to the CTR-CAP-001 grant record; storage adds `created_at`, `revision` and `row_hash`. | MVP |
| PS-126-01.R02 | Every decision stores `policy_version` and `reason_code`; no object content is stored. | MVP |
| PS-126-01.R03 | At most one `active` grant per (`subject.ref`, `capability`, `resource.type`, `resource.scope`, `resource.object_id`). | MVP |
| PS-126-01.R04 | Decision-cache key includes `policy_version`; entries from another version are never returned. | MVP |
| PS-126-01.R05 | Indexes support lookup by subject, by object and by case with p95 ≤ 5 ms at 10 million grants (ASSUMPTION). | MVP |

## Data / schema
| Entity | Key | Key fields | Class |
|---|---|---|---|
| grant | `grt_` | subject (kind, ref), capability, resource (type, scope, case_id, object_id), constraints, status, approvals[] | FINANCIAL_EVIDENCE if purpose is evidence; else PSEUDONYMOUS |
| policy | `pol_` (ASSUMPTION) | version (semver), rules_hash (SHA-256), status, published_by, approvals[2] | PUBLIC |
| decision | `dec_` | principal (kind, ref), action, resource (type, id), outcome, reason_code, policy_version, decided_at, cache_hit | PSEUDONYMOUS |
| cache entry | composite | principal, action, resource_id, policy_version, outcome, expires_at | PSEUDONYMOUS, RET-EPH |

## Commands / queries / events
Not applicable to the schema. See [PS-126-04](commands_queries_events.md).

## States & transitions
See [PS-126-03](workflow_state_machine.md).

## Validation & errors
Field rules: [PS-126-02](validation_rules.md).

## Authorization
Table access is restricted to the authorization service identity (`sys_`). No human reads these tables directly.

## Failure, idempotency, concurrency, offline
Grant and approval writes use a revision column for optimistic concurrency. Decision records are append-only.

## Privacy, retention, abuse
Decision records: RET-AUD (12 months). Grant events: RET-EVD while the subject is active, then RET-AUD. Cache entries: RET-EPH (≤ 60 s effective).

## Observability & budgets
Table row counts and index sizes reported monthly; p95 lookups in [PS-126-08](observability_performance.md).

## Tests
- TEST-PS-126-01-01 (schema): grant fixtures validate against the CTR-CAP-001 grant schema.
- TEST-PS-126-01-02 (constraint): second active grant with identical key is rejected by the database.
- TEST-PS-126-01-03 (cache): policy version bump invalidates all cached entries for the old version.

## Acceptance criteria
1. Every decision row has a non-null `policy_version` and `reason_code`.
2. No decision row contains a field from object content.
3. Uniqueness constraint holds under 100 concurrent grant creates.

## Assumptions & open decisions
- ASSUMPTION: `pol_` prefix and index targets.
- PROVISIONAL (D05 default, unapproved): grants for LOCATION_PRECISE content carry object-level scope only.
- PROVISIONAL (D07 default, unapproved): decision retention 12 months.
