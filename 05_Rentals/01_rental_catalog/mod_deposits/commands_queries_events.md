# PS-040-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_deposits. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, idempotency), CTR-ERR-001 (codes), CTR-SCH-001 (payload schemas), CTR-COM-001 (claim commands it calls), CTR-CAP-001 (capabilities).

**Decision labels:** D09 PROVISIONAL (no custody). D08 PROVISIONAL (offline queue).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-040-04.R01 | Every command requires `idempotency_key` (scope = actor, command, key; CTR-EVT-001 R03). | MVP |
| PS-040-04.R02 | Every state-changing command requires `expected_revision`. Mismatch → `SYS.CONFLICT`. | MVP |
| PS-040-04.R03 | Each command emits exactly one `deposit.*` event (CTR-EVT-001 R10), `aggregate_type = deposit`. | MVP |
| PS-040-04.R04 | Claim-moving steps call CTR-COM-001 commands (`clm.submit`, `clm.attest`); deposit never writes claim state directly. | MVP |
| PS-040-04.R05 | Command p95 ≤ 300 ms excluding claim-service latency (ASSUMPTION). | MVP |

## Data / schema
Command payloads: `deposit.propose` = `rental_id`, `owner_ref`, `renter_ref`, `amount_minor`, `currency`, `method`, `release_rule`, `notes?`. Event payloads: IDs, `status`, `state_version`, `terms_hash`. Amounts are allowed in payloads at FINANCIAL_EVIDENCE; they are never in logs. Schemas registered per CTR-SCH-001.

## Commands / queries / events
| Command | Caller | Event | Error codes |
|---|---|---|---|
| `deposit.propose` | either party of an eligible rental | deposit.proposed | AMOUNT_OVER_CAP, METHOD_NOT_ALLOWED, DUPLICATE_ARRANGEMENT, RENTAL_NOT_ELIGIBLE, INVALID_PARTIES |
| `deposit.agree` | other party | deposit.agreed | TERMS_CHANGED, CONSENT_EXPIRED, INVALID_TRANSITION |
| `deposit.cancel` | either party before HELD | deposit.cancelled | INVALID_TRANSITION |
| `deposit.record_given` | renter | clm.submitted (CTR-COM-001) | COM.AMOUNT_INVALID, COM.CUSTODY_FORBIDDEN |
| `deposit.attest_received` | owner | deposit.held | COM.ATTESTATION_INVALID, INVALID_TRANSITION |
| `deposit.request_release` | system on `rtn_` close | deposit.release_requested | INVALID_TRANSITION |
| `deposit.release` | owner, then renter confirm | deposit.released | RELEASE_EXCEEDS_HELD |
| `deposit.partial_release` | owner | deposit.partially_released | NO_DEDUCTION_AGREEMENT, RELEASE_EXCEEDS_HELD |
| `deposit.dispute` | either party inside window | deposit.disputed | COM.DISPUTE_WINDOW_CLOSED |

Queries: `deposit.get` and `deposit.list_by_rental` (participant only). Pagination: 50 per page, cursor-based. Errors use the CTR-ERR-001 envelope.

## States & transitions
Event-to-state mapping is in PS-040-03. Commands with no matching transition return `DEPOSITS.INVALID_TRANSITION`.

## Validation & errors
Checks per PS-040-02, run before the command executes.

## Authorization
Caller column above is the minimum. Capability IDs in PS-040-05.

## Failure, idempotency, concurrency, offline
Retries reuse the same key. Same key with a different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Idempotency records kept 7 days (CTR-EVT-001 R03).

## Privacy, retention, abuse
Events carry `max_data_class = FINANCIAL_EVIDENCE`. Never federated. Event payloads omit `notes`.

## Observability & budgets
`deposit_command_latency_ms` histogram per command. Event count per aggregate must equal `state_version`.

## Tests
- TEST-PS-040-04-01 (contract): each command validates against its schema; each event carries the envelope fields.
- TEST-PS-040-04-02 (idempotency): same key twice → one event; same key, different body → `EVT.IDEMPOTENCY_KEY_REUSED`.
- TEST-PS-040-04-03 (concurrency): stale `expected_revision` → `SYS.CONFLICT`.
- TEST-PS-040-04-04 (integration): `deposit.record_given` produces a `clm.submitted` event and does not write claim state.

## Acceptance criteria
1. Each command row maps to one event and one state transition (PS-040-03).
2. Idempotency and revision rules hold under TEST-PS-040-04-02 and -03.
3. No command writes claim state directly (R04).

## Assumptions & open decisions
- ASSUMPTION: 300 ms p95 command budget.
- PROVISIONAL (D09 default, unapproved).
- PENDING CTR-ID-001 `dep` prefix and CTR-SCH-001 registration for deposit payloads.
