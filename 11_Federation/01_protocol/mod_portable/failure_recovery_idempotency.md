# PS-083-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (Failure section, R05, R06), CTR-EVT-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-083-06.R01 | A failed build leaves no signed bundle; retry rebuilds from `requested`. | MVP |
| PS-083-06.R02 | A bundle that fails verification at import leaves no rows. | MVP |
| PS-083-06.R03 | Re-delivery of a signed bundle is idempotent by `bundle_id`. | MVP |
| PS-083-06.R04 | If the key store is unavailable, signing fails closed (`SYS.UNAVAILABLE`, retryable). | MVP |

## Data / schema
Uses `bundle_id`, `key_id`, `revision` in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Retries apply to [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Recovery per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | When |
|---|---|---|
| SYS.UNAVAILABLE | true | key store down |
| FED.KEY_UNKNOWN | true | import before key propagates (deferred up to 24 h) |
| FED.KEY_REVOKED | false | signed under revoked key |

## Authorization
Retries re-authorize.

## Failure, idempotency, concurrency, offline
Concurrent builds for one (owner, audience) serialized by build lock. Revision gaps hold the aggregate (CTR-EVT-001 R02).

## Privacy, retention, abuse
Logs carry bundle ID and code only.

## Observability & budgets
Metrics `portable_build_failures_total{code}`, `portable_import_rejections_total{code}`.

## Tests
- TEST-PS-083-06-01 (fault): key store outage during signing leaves no bundle.
- TEST-PS-083-06-02 (idempotency): redelivered bundle no-ops.
- TEST-PS-083-06-03 (deferred): unknown key deferred then accepted when key arrives within 24 h.

## Acceptance criteria
1. No partial bundles or imports under fault injection.
2. Deferred key path tested.

## Assumptions & open decisions
- PROVISIONAL (D10 default, unapproved): key rotation with documented recovery.
