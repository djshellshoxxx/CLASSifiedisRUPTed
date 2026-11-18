# PS-128-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_key (F16.S02.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-128-08.R01 | Metrics: `key_registrations_total{purpose,algorithm}`, `key_proofs_total{result}`, `key_revocations_total{reason}`, `key_snapshot_age_seconds`. | MVP |
| PS-128-08.R02 | Alerts: revocation burst (> 20 per owner per hour), private-material rejection burst (> 5 in 10 min), snapshot staleness (> 24 h for > 5% of clients). | MVP |
| PS-128-08.R03 | `key.prove` p95 <= 50 ms; `key.get` p95 <= 30 ms (ASSUMPTION). | MVP |
| PS-128-08.R04 | Logs carry key ID, purpose, status and codes; never public key bytes beyond the fingerprint. | MVP |

## Data / schema
Labels: `purpose`, `algorithm`, `result`, `reason` enums.

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Not applicable.

## Authorization
Dashboards aggregate only (PS-128-05).

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
No owner identifiers in metrics.

## Observability & budgets
Budgets in R03.

## Tests
- TEST-PS-128-08-01 (unit): alert rules.
- TEST-PS-128-08-02 (performance): prove and get latency under load meets R03.
- TEST-PS-128-08-03 (log scan): no key material beyond fingerprint in logs.
- TEST-PS-128-08-04 (chaos): snapshot staleness alert fires on stopped publisher.

## Acceptance criteria
1. Latency budgets met (TEST-02).
2. TEST-PS-128-08-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: thresholds above; F16 to tune after pilot.
