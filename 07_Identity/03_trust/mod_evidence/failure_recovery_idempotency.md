# PS-057-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_evidence. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03, offline rules), CTR-SCH-001 (R08 lossless), CTR-COM-001 (R14 attestation reference pattern).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-057-06.R01 | Record, supersede and withdraw commit atomically with their event (transaction or outbox). | MVP |
| PS-057-06.R02 | Duplicate delivery returns original result; no duplicate evidence row. | MVP |
| PS-057-06.R03 | Key registry outage: signature checks fail with retryable `KEY_UNKNOWN`; no evidence is accepted unsigned when a signature is required. | MVP |
| PS-057-06.R04 | Client retries only retryable codes, max 5 attempts, backoff with jitter. | MVP |
| PS-057-06.R05 | Offline recordings held in pending queue until relay ack, then cleared. | MVP |
| PS-057-06.R06 | Reputation recompute failure does not roll back evidence commit; recompute retried until success (max 15 min lag, alert beyond). | MVP |

## Data / schema
Idempotency record (7 days). Pending entry: `evidence_draft_id`, `body_digest`, `signature_ref`, `status`. Purged on ack (RET-EPH).

## Commands / queries / events
Retry rules apply to `RecordEvidence`, `SupersedeEvidence`, `WithdrawEvidence`.

## States & transitions
| From | Event | Guard | To |
|---|---|---|---|
| `pending` (device) | relay ack | — | `acknowledged` |
| `pending` | `KEY_UNKNOWN` | key sync pending | `pending` (retry with backoff) |
| `pending` | non-retryable error | — | `not_applied` (visible, not discarded) |

## Validation & errors
Non-retryable codes never retried automatically (CTR-ERR-001).

## Authorization
Server re-authorizes each attempt.

## Failure, idempotency, concurrency, offline
- Crash after commit before ack: retry returns stored result.
- Revocation of issuer key during pending queue: queued items signed with revoked key become `not_applied` with `SIGNATURE_INVALID`.
- Queue limit 50 items or 7 days (ASSUMPTION).

## Privacy, retention, abuse
Pending drafts hold content locally only while pending; purged at logout. Rate limit 10 recordings per subject per 24 h from a single issuer (ASSUMPTION) to stop evidence flooding.

## Observability & budgets
`evidence_outbox_lag_seconds` p95 ≤ 5 s; `evidence_recompute_lag_seconds` p95 ≤ 60 s.

## Tests
- TEST-PS-057-06-01 (integration): crash after commit; single event.
- TEST-PS-057-06-02 (fault): key registry down; retryable error; recovery after sync.
- TEST-PS-057-06-03 (offline): key revoked while queued → `not_applied`.
- TEST-PS-057-06-04 (property): replay of write sequences yields same final state.

## Acceptance criteria
1. No evidence accepted without required signature.
2. Atomicity under fault injection.
3. Recompute lag within bound or alert fires.
4. Offline items never discarded silently.

## Assumptions & open decisions
- ASSUMPTION: queue limit 50 items / 7 days; 10 recordings per subject per issuer per 24 h.
- PROVISIONAL (D08 default, unapproved): offline queue until acknowledgment.
