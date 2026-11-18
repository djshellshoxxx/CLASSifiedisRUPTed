# PS-042-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (idempotency, saga, revision), CTR-ERR-001 (retry), CTR-SCH-001.

**Decision labels:** D08 PROVISIONAL (offline queue). D04 OPEN.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-042-06.R01 | All writes idempotent per CTR-EVT-001 R03. | MVP |
| PS-042-06.R02 | Attestation queued offline is held as pending (D08) and revalidated at commit against window, state and checklist. | MVP |
| PS-042-06.R03 | Rental activation after COMPLETE is a saga step with `correlation_id`; a failed activation is retried, and the handoff stays COMPLETE. | MVP |
| PS-042-06.R04 | Expiry and reminder jobs are idempotent per `(handoff_id, state_version)`. | MVP |
| PS-042-06.R05 | A queued attestation whose window expired at commit is moved to "not applied" with `message_key`; never silently dropped. | MVP |

## Data / schema
Saga record: `correlation_id`, handoff ID, rental ID, step, status. Pending queue entries are client-side, RET-EPH.

## Commands / queries / events
Each command retry-safe. `rental_handoff.attested` committed before any notification.

## States & transitions
No new states; failed steps leave status unchanged.

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `SYS.PRECONDITION_FAILED`. Non-retryable: `RNTHAND.*`.

## Authorization
`sys` job holds write on `rental_handoff` only.

## Failure, idempotency, concurrency, offline
- Both parties attest at once: revision check; second attest sees COMPLETE and returns the stored result.
- Phone offline at handoff: attestation queued; commit after reconnect; if window closed → "not applied".
- Rental service down at activation: saga retries; handoff remains COMPLETE; rental shows "activation pending".

## Privacy, retention, abuse
Saga logs carry IDs and steps only.

## Observability & budgets
`rental_handoff_saga_open_total`, `rental_handoff_expired_total`, `rental_handoff_pending_queue_age_seconds` p95 ≤ 3600 (ASSUMPTION).

## Tests
- TEST-PS-042-06-01 (failure): rental service down at COMPLETE → activation retried, exactly one activation.
- TEST-PS-042-06-02 (offline): queued attest after expiry → "not applied".
- TEST-PS-042-06-03 (idempotency): replayed expiry job → one EXPIRED event.
- TEST-PS-042-06-04 (race): simultaneous attest from both parties → one COMPLETE.

## Acceptance criteria
1. No COMPLETE without a successful activation or a logged retry (TEST-PS-042-06-01).
2. No silent drops of offline attestations (TEST-PS-042-06-02).
3. Zero duplicate events from job replay.

## Assumptions & open decisions
- ASSUMPTION: 1-hour pending queue age target.
- PROVISIONAL (D08 default, unapproved).
- OPEN (D04): compensation if activation cannot complete.
