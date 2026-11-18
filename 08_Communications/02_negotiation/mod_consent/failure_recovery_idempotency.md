# PS-062-06 — failure recovery idempotency
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_consent. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-CAP-001 (offline rule, CR-14, S3-10), CTR-ERR-001, CTR-COM-001 (R04)

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-062-06.R01 | Offline-queued `cns.give` is held in the client pending queue (D08) and is re-validated at server commit against current version, digest, quote and lock state. | MVP |
| PS-062-06.R02 | A queued consent whose version is stale at commit is rejected, never silently rebased. The client shows the new terms and asks again. | MVP |
| PS-062-06.R03 | A queued `cns.withdraw` that arrives after a lock event is rejected at commit with `CONSENT.EXECUTION_LOCKED`. | MVP |
| PS-062-06.R04 | Retries use the same idempotency key; duplicate with same digest returns the original record. | MVP |
| PS-062-06.R05 | Server timeout 2 s per commit; client retry: exponential backoff with full jitter, base 1 s, cap 60 s, max 8 attempts. | MVP |
| PS-062-06.R06 | A consent record and its event are written in one transaction; no `given` without event. | MVP |

## Data / schema
Idempotency record as in CTR-EVT-001 R03, retained 7 days.

## Commands / queries / events
No new commands. Lock-induced withdrawal refusals emit no event (rejections do not write).

## States & transitions
Offline queue items: `queued` → `committed` | `rejected` (stale, locked, expired) | `expired_local` (queued > 7 days, dropped with notice).

## Validation & errors
| Code | Retryable | Category / HTTP | Note |
|---|---|---|---|
| CONSENT.STALE_VERSION | false | conflict / 409 | Client must re-consent. |
| CONSENT.EXECUTION_LOCKED | false | unprocessable_state / 422 | Withdrawal after lock. |
| CONSENT.PROPOSAL_EXPIRED | false | gone / 410 | Proposal past expiry. |
| SYS.UNAVAILABLE | true | unavailable / 503 | Retry with `retry_after_ms`. |

## Authorization
Re-run at commit ([PS-062-05](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Partial failure after commit but before response: client retry returns the committed record. Concurrency: lock and withdraw serialize on the proposal aggregate revision. Revocation of a slot before commit rejects queued consent.

## Privacy, retention, abuse
Queue contents are PSEUDONYMOUS IDs and digests; cleared on logout from device (RET-EPH).

## Observability & budgets
`consent_queue_rejected_total{reason}`; alert if rejected-stale rate > 5% of queued consents per day (ASSUMPTION).

## Tests
- TEST-PS-062-06-01 (offline, critical S4-02): device offline, lock event occurs, device reconnects and sends queued withdraw → rejected, record unchanged.
- TEST-PS-062-06-02 (offline): queued consent with version N, server at N+1 → `CONSENT.STALE_VERSION`; no record written.
- TEST-PS-062-06-03 (idempotency): duplicate queued give → single record.
- TEST-PS-062-06-04 (integration): crash after event append before response → retry returns original record.

## Acceptance criteria
1. No consent is given against terms the party did not see (TEST-PS-062-06-02).
2. No withdrawal succeeds after lock (TEST-PS-062-06-01).

## Assumptions & open decisions
- D08 (PWA offline writes): PROVISIONAL (D08 default, unapproved).
- ASSUMPTION: queued consent max age 7 days.
- Related risk: S4-02 and CR-14 (consent revocation vs queued offline commands), tracked in REVIEW_2026-11-16 M-06.
