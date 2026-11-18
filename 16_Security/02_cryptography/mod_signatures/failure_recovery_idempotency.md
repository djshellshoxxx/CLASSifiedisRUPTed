# PS-130-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-FED-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-130-06.R01 | If the key service is unavailable, `signature.sign` fails with `SIG.KEY_UNAVAILABLE` (503, retryable). No unsigned fallback. | MVP |
| PS-130-06.R02 | An event that requires a signature (CTR-EVT-001 R05) is not stored or exported unsigned. | MVP |
| PS-130-06.R03 | Sign timeout 500 ms; one retry with jitter; then `SYS.UNAVAILABLE` (ASSUMPTION). | MVP |
| PS-130-06.R04 | Verification never trusts a receiver clock: expiry compares to `occurred_at` and CTR-FED-001 bounds only. | MVP |
| PS-130-06.R05 | Verification of a batch runs after size and rate limits (CTR-FED-001 R10). | MVP |

## Data / schema
No additional tables. Uses records in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Retries reuse the same `idempotency_key`.

## States & transitions
Failed signing leaves the producing aggregate unchanged (saga compensation is the producer's responsibility).

## Validation & errors
| Code | Category | Retryable | message_key |
|---|---|---|---|
| SIG.KEY_UNAVAILABLE | unavailable (503) | true | err.sig.key_unavailable |
| SIG.KEY_REVOKED_FOR_SIGNING | unprocessable_state (422) | false | err.sig.key_revoked_for_signing |

## Authorization
N/A beyond [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
- Key rotation mid-batch: each event is signed with the key valid at its `occurred_at`; a rotation does not invalidate earlier signatures.
- Equivocation of signed events is handled by CTR-FED-001 R06, not here.
- Offline clients do not sign events; they queue pending commands (D08).

## Privacy, retention, abuse
Failure logs contain request ID and code only.

## Observability & budgets
Metric `sig_sign_failure_total{code}`; alert if > 1% over 5 min.

## Tests
- TEST-PS-130-06-01: chaos, key service killed; no unsigned event stored.
- TEST-PS-130-06-02: integration, rotation during batch preserves validity of each event.
- TEST-PS-130-06-03: retry, duplicate idempotency key returns original result.

## Acceptance criteria
1. Zero unsigned required events in 10,000 injected faults.
2. Duplicate sign never produces a second record.

## Assumptions & open decisions
- ASSUMPTION: timeout and retry values above.
- D08 (offline pending queue): PROVISIONAL (D08 default, unapproved).
