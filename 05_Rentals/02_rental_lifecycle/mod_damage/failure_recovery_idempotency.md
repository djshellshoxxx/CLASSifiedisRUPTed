# PS-041-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_damage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (idempotency, saga), CTR-ERR-001 (retry), CTR-COM-001 (claims), CTR-SCH-001.

**Decision labels:** D08 PROVISIONAL (offline). D04 OPEN (partial execution); no atomic guarantee assumed.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-041-06.R01 | Writes idempotent per CTR-EVT-001 R03. | MVP |
| PS-041-06.R02 | Photo upload completes before `damage.report` commits; uncommitted uploads are purged after 24 h (ASSUMPTION). | MVP |
| PS-041-06.R03 | Deposit release request and damage resolution are one saga (`correlation_id`); a failed deposit step leaves damage RESOLVED and retries the request. | MVP |
| PS-041-06.R04 | Timer expiry (72 h) runs as an idempotent `sys` job; duplicate runs are no-ops. | MVP |
| PS-041-06.R05 | Offline acknowledgements queue as pending (D08); server revalidates line set and `state_version` at commit. | MVP |

## Data / schema
Upload record: digest, size, purge_after. Saga record: `correlation_id`, damage ID, deposit ID, step, status.

## Commands / queries / events
Retry-safe per PS-041-04. Event `damage.resolved` committed before deposit request is sent.

## States & transitions
No new states for failures. Failed transitions leave status unchanged.

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `SYS.PRECONDITION_FAILED`. Non-retryable: all `DAMAGE.*` codes.

## Authorization
`sys` jobs hold write scope on `damage` only; no claim creation.

## Failure, idempotency, concurrency, offline
- Upload interrupted: client resumes by digest; no duplicate photo.
- Concurrent acknowledge and withdraw: revision check; one wins.
- Offline acknowledge after report withdrawn: rejected, moved to "not applied".
- Deposit service down during resolve: saga retries with backoff; damage stays RESOLVED.

## Privacy, retention, abuse
Saga logs hold IDs and step names only. Purged uploads leave no digest record.

## Observability & budgets
`damage_saga_open_total`, `damage_timer_run_total`, `damage_upload_purged_total`.

## Tests
- TEST-PS-041-06-01 (failure): deposit service down during resolve → saga retries to completion.
- TEST-PS-041-06-02 (idempotency): timer job run twice → one escalation.
- TEST-PS-041-06-03 (offline): queued acknowledge after withdraw → "not applied".
- TEST-PS-041-06-04 (upload): killed upload resumes with no duplicate digest.

## Acceptance criteria
1. No resolved damage without a deposit step or a logged reason for deferral.
2. No duplicate escalations from timer replay.
3. No silently dropped offline command.

## Assumptions & open decisions
- ASSUMPTION: 24 h upload purge, saga retry schedule per CTR-ERR-001.
- PROVISIONAL (D08 default, unapproved).
- OPEN (D04): partial execution and compensation for mixed-value settlement.
