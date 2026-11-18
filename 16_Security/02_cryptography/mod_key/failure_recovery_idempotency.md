# PS-128-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_key (F16.S02.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-128-06.R01 | Registration and proof are retry-safe with the same key or challenge; repeats return the stored result. | MVP |
| PS-128-06.R02 | Lost private key: the owner's key is revoked with reason `recovery` after recovery-proof (F07 recovery flow), and a new key is registered. The platform never re-issues a private key. | MVP |
| PS-128-06.R03 | Revocation is durable before the API acknowledges it; propagation to federation peers is retried with the same event ID (CTR-FED-001). | MVP |
| PS-128-06.R04 | Revocation list is served as a signed snapshot; clients with an older snapshot treat the key as valid only until the snapshot age exceeds 24 h (ASSUMPTION). | MVP |
| PS-128-06.R05 | Restore from backup must not re-activate a revoked key (PS-120 restore path). | MVP |

## Data / schema
Revocation snapshot: `{"as_of": ms, "revoked": [{"key_id", "revoked_at"}], "digest": "sha256"}`.

## Commands / queries / events
As PS-128-04.

## States & transitions
As PS-128-03.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| KEY.PROOF_INVALID | true | validation / 400 | Bad signature; new challenge required. |
| KEY.SNAPSHOT_STALE | true | precondition_failed / 412 | Client snapshot older than 24 h. |

## Authorization
Recovery proof is evaluated by F07, not here (CTR-CAP-001 R12).

## Failure, idempotency, concurrency, offline
Offline key generation is allowed; registration is queued (PS-116). Concurrency: one active key per (owner, purpose) per rotation step.

## Privacy, retention, abuse
No private material is ever in failure payloads.

## Observability & budgets
Metric: `key_snapshot_age_seconds` by client version; alert when > 24 h for > 5% of clients.

## Tests
- TEST-PS-128-06-01 (integration): revocation survives restart before acknowledgment.
- TEST-PS-128-06-02 (federation): peer receives revocation via retry with same event ID.
- TEST-PS-128-06-03 (restore): revoked key stays revoked after backup restore.
- TEST-PS-128-06-04 (unit): snapshot older than 24 h treated as stale.

## Acceptance criteria
1. No revoked key re-activates in any path (TEST-03).
2. TEST-PS-128-06-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 24-hour snapshot freshness.
- OPEN (D10): user-controlled recovery and rotation procedure.
