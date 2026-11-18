# PS-081-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_model. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-081-06.R01 | A failed approval never leaves a version half-approved; state is all-or-nothing. | MVP |
| PS-081-06.R02 | Publishing a version is idempotent by `(version, digest)`. | MVP |
| PS-081-06.R03 | If the model store is unavailable, CI drift check fails closed (build fails, not passes). | MVP |

## Data / schema
Uses `revision` and `digest_sha256` in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Retry rules apply to all commands in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Recovery is replay from the event log; no manual state edits.

## Validation & errors
| Code | Retryable | When |
|---|---|---|
| SYS.UNAVAILABLE | true | store down |
| EVT.REVISION_CONFLICT | false | concurrent proposal |
| MODEL.DRIFT_DETECTED | false | code declares a flow absent from the model |

## Authorization
Retries re-authorize.

## Failure, idempotency, concurrency, offline
Concurrency via `expected_version`. Model changes are online-only (no offline queue).

## Privacy, retention, abuse
Recovery logs carry IDs and codes only.

## Observability & budgets
Metric `model_drift_detected_total`; CI check runtime ≤ 2 min (ASSUMPTION).

## Tests
- TEST-PS-081-06-01 (idempotency): duplicate publish returns one version.
- TEST-PS-081-06-02 (fault): store outage fails CI drift check.
- TEST-PS-081-06-03 (concurrency): two approvals on one version, one wins.

## Acceptance criteria
1. No half-approved versions in fault tests.
2. CI drift check fails closed.
3. Idempotency verified for publish.

## Assumptions & open decisions
- ASSUMPTION: CI runtime bound.
- PROVISIONAL (D10 default, unapproved): key assets follow same rules.
