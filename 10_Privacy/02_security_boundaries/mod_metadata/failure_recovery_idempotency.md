# PS-080-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_metadata (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-FED-001 (R12), CTR-ERR-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-080-06.R01 | Egress filter fails closed: missing policy or filter error → payload not sent. | MVP |
| PS-080-06.R02 | Sanitiser crash never serves partially sanitised bytes; output is written to a temp key and promoted only after the residual scan passes. | MVP |
| PS-080-06.R03 | Policy activation is atomic: exactly one active version per surface at all times. | MVP |
| PS-080-06.R04 | Rollback of a policy version restores the previous approved version without re-sanitising clean files. | MVP |
| PS-080-06.R05 | Offline clients keep attachments unsent until upload is acknowledged; sanitisation is server-side only. | MVP |

## Data / schema
`sanitize_job`: `att_id`, `attempt`, `lease_until`, `temp_key`, `last_error_code`.

## Commands / queries / events
`attachment.quarantined` emitted after attempt limit.

## States & transitions
Per PS-080-03.

## Validation & errors
`SYS.UNAVAILABLE` (retryable) when policy store is down; `META.STRIP_FAILED` (not retryable) after two attempts.

## Authorization
Sanitiser lease under sys grant.

## Failure, idempotency, concurrency, offline
Lease 5 min; retry backoff 10 s then 60 s. Offline upload retried by client under D08 queue until server acknowledgment.

## Privacy, retention, abuse
Temp keys deleted on failure within 1 h.

## Observability & budgets
`meta_fail_closed_total` (should be rare; alert if > 0.1% of outbound payloads).

## Tests
- TEST-PS-080-06-01 (fault): inject crash after write; no partial clean output.
- TEST-PS-080-06-02 (fail-closed): policy store down → push payload dropped, not sent unfiltered.

## Acceptance criteria
1. No clean output without residual scan (TEST-PS-080-06-01).
2. Fail-closed test passes (TEST-PS-080-06-02).
3. Single active policy per surface under concurrent activation (test).

## Assumptions & open decisions
- ASSUMPTION: lease and backoff values above.
- PROVISIONAL (D08 default): local pending queue until relay acknowledgment.
