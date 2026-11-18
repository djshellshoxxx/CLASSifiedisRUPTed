# PS-067-06 — failure, recovery, idempotency and offline behavior

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_cash (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-COM-001 (Failure section), CTR-ERR-001 (R03). **Decisions:** D08 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-067-06.R01 | Duplicate `clm.submit` with the same key returns the original claim (CTR-COM-001). | MVP |
| PS-067-06.R02 | Offline cash claims queue as pending (D08). The server re-validates method enablement, ceiling, party status and quote at commit. | MVP |
| PS-067-06.R03 | A pending cash claim rejected at commit shows the applicable code and is kept in the user's history as rejected, not deleted. | MVP |
| PS-067-06.R04 | If the method is disabled while a claim is pending, commit fails with `CASH.METHOD_DISABLED`; no retroactive acceptance. | MVP |
| PS-067-06.R05 | Adapter outage does not apply to cash (no adapter call). | MVP |

## Data / schema
Outbox row per CTR-COM-001 offline rules: `command_id`, `payload_digest`, `state` (`pending`, `acknowledged`, `rejected`).

## Commands / queries / events
Retries reuse original keys.

## States & transitions
Outbox: `pending` → `acknowledged` | `rejected`.

## Validation & errors
Stale pending claims: `COM.QUOTE_EXPIRED`, `CASH.METHOD_DISABLED`, `CASH.CEILING_EXCEEDED`, `SYS.CONFLICT`.

## Authorization
Re-validated at commit, not at queue time.

## Failure, idempotency, concurrency, offline
Concurrent claim submissions for one trx and party: second returns `RECEIPT.DUPLICATE_CLAIM` or original claim per key rule. Client never auto-attests after reconnect.

## Privacy, retention, abuse
Outbox entries are deleted on acknowledgment or after 7 days.

## Observability & budgets
Counter: pending claims rejected at commit by code.

## Tests
- TEST-PS-067-06-01 (integration): offline submit, reconnect, commit succeeds once.
- TEST-PS-067-06-02 (integration): method disabled during offline window; commit rejected with `CASH.METHOD_DISABLED`.
- TEST-PS-067-06-03 (property): replayed submit yields one claim.
- TEST-PS-067-06-04 (negative): reconnect does not create attestation.

## Acceptance criteria
1. No cash claim is created without server commit.
2. Rejected pending claims remain visible as rejected.
3. Idempotency tests pass.

## Assumptions & open decisions
- ASSUMPTION: 7-day outbox retention.
- D08 (PROVISIONAL default, unapproved).
