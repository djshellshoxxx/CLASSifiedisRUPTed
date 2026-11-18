# PS-130-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-130-08.R01 | Expose `sig_verification_total{result}` and `sig_pending_total`. | MVP |
| PS-130-08.R02 | Sign p95 ≤ 5 ms and verify p95 ≤ 10 ms for cached keys (ASSUMPTION). | MVP |
| PS-130-08.R03 | Alert when invalid-result rate from one `fpr_` exceeds 1% over 15 min; feed F11 quarantine review. | MVP |
| PS-130-08.R04 | Logs contain no key material, payload bytes or raw signatures beyond the record ID. | MVP |

## Data / schema
Labels: `result`, `algorithm`, `subject_type`, `code`. No user IDs as labels.

## Commands / queries / events
Spans per command with `key_id`.

## States & transitions
N/A.

## Validation & errors
N/A.

## Authorization
Metrics readable by `ope` at global scope.

## Failure, idempotency, concurrency, offline
Metrics outage does not block signing.

## Privacy, retention, abuse
Telemetry retained 30 days (ASSUMPTION).

## Observability & budgets
| Signal | Target |
|---|---|
| sign p95 | ≤ 5 ms |
| verify p95 (cached key) | ≤ 10 ms |
| verify p95 (key miss, includes lookup) | ≤ 300 ms |
| pending age alert | > 10 min |

## Tests
- TEST-PS-130-08-01: load, 1,000 verifies/s on reference node (ASSUMPTION).
- TEST-PS-130-08-02: log scan for secrets and payloads.

## Acceptance criteria
1. Budgets met in TEST-PS-130-08-01.
2. Zero secret or payload strings found in log scan.

## Assumptions & open decisions
- ASSUMPTION: performance targets above.
- D01 (federated verification load): PROVISIONAL (D01 default, unapproved).
