# PS-127-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/01_authz/mod_secrets (F16.S01.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-127-06.R01 | KMS unavailable: `lease.issue` fails closed with `SECRETS.KMS_UNAVAILABLE` (retryable). Consumers keep using a still-valid lease for up to its remaining TTL; no fallback to plaintext storage. | MVP |
| PS-127-06.R02 | Consumers cache leases in memory only, refresh at 80% of TTL, and never write leases to disk. | MVP |
| PS-127-06.R03 | Rotation interrupted by crash resumes or fails back to the prior active version on restart (PS-127-03 R04). | MVP |
| PS-127-06.R04 | Backup restore of secrets: only KMS-wrapped handles are restored; verifiers are restored; restore never re-creates a revoked version as active. | MVP |
| PS-127-06.R05 | Lease retry uses full-jitter backoff, base 500 ms, cap 30 s (ASSUMPTION). | MVP |

## Data / schema
Lease record: lease ID, secret name, version, requester module, issued_at, expires_at (no value).

## Commands / queries / events
`lease.issue` is non-idempotent; retries create new leases, bounded by rate limit.

## States & transitions
Not applicable beyond PS-127-03.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| SECRETS.KMS_UNAVAILABLE | true | unavailable / 503 | KMS down. |
| SECRETS.LEASE_EXPIRED | true | unauthenticated / 401 | Lease expired; requester obtains a new lease. |
| SECRETS.REVOKED | false | gone / 410 | Secret revoked. |

## Authorization
Lease re-issue repeats PS-127-05 checks.

## Failure, idempotency, concurrency, offline
Offline clients never hold secrets (this module is server-side only).

## Privacy, retention, abuse
Lease retries count toward rate limits; excessive retries alert.

## Observability & budgets
Metric: `secrets_kms_errors_total`; alert on any KMS error rate > 1% for 5 min.

## Tests
- TEST-PS-127-06-01 (fault): KMS down; leases fail closed; valid leases keep working until expiry.
- TEST-PS-127-06-02 (integration): crash during rotation; restart yields single active version set.
- TEST-PS-127-06-03 (restore): restored revoked version stays revoked.
- TEST-PS-127-06-04 (unit): no disk write of lease token (filesystem trace).

## Acceptance criteria
1. No plaintext fallback path exists (TEST-01).
2. TEST-PS-127-06-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 80% refresh threshold; 30 s backoff cap.
