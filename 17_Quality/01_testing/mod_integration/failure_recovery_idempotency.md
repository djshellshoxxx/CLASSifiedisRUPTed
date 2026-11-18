# PS-135-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_integration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-135-06.R01 | Each scenario resets its environment to a known seed digest before running. | MVP |
| PS-135-06.R02 | Environment provisioning failure marks the run `skipped` with reason `ENV_UNAVAILABLE`, not `fail`. | MVP |
| PS-135-06.R03 | Scenario timeout 10 min (ASSUMPTION); on timeout the run is `fail`. | MVP |
| PS-135-06.R04 | A retried scenario reuses the fixture digest; it does not reseed from a different source. | MVP |
| PS-135-06.R05 | Tests that depend on wall-clock time use injected clocks. | MVP |

## Data / schema
Environment records: `environment_id`, `seed_digest`, `provisioned_at`.

## Commands / queries / events
Retry policy: 3 attempts per scenario (see PS-135-03).

## States & transitions
Environment failure transitions a run to `skipped`, not `running` forever.

## Validation & errors
| Code | Category | Retryable | message_key |
|---|---|---|---|
| INTEGR.ENV_UNAVAILABLE | unavailable (503) | true | err.integr.env_unavailable |

## Authorization
N/A.

## Failure, idempotency, concurrency, offline
- Parallel runs use isolated environments; no shared mutable seed.
- Offline queue scenarios (D08) run against the simulated relay, not a live relay.

## Privacy, retention, abuse
Environment logs redacted by PS-135-07.

## Observability & budgets
Metric `integration_env_unavailable_total`.

## Tests
- TEST-PS-135-06-01: chaos, environment killed; run becomes `skipped` with reason.
- TEST-PS-135-06-02: determinism, same seed twice gives identical results.

## Acceptance criteria
1. No `fail` caused by environment provisioning in CI over 30 days (ASSUMPTION).
2. Seed digest verified before every run.

## Assumptions & open decisions
- ASSUMPTION: 10-minute timeout.
- D08 (simulated offline relay): PROVISIONAL (D08 default, unapproved).
