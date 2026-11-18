# PS-030-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_disputes. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001, CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-030-03.R01 | Local `link_state` ∈ {`requested`, `opened`, `refused`}. Canonical dispute state lives in F09 and is mirrored read-only. | MVP |
| PS-030-03.R02 | Dispute lifecycle states (owned by F09): `OPEN`, `AWAITING_RESPONSE`, `UNDER_REVIEW`, `RESOLVED_AGREED`, `RESOLVED_DECIDED`, `WITHDRAWN`, `EXPIRED_NO_RESPONSE`. Mirror labels use the CTR-COM-001 catalog. | MVP |
| PS-030-03.R03 | When subject is a settlement claim, a dispute moves that claim to `DISPUTED` (CTR-COM-001 R05, R16). No other claim state changes from this module. | MVP |
| PS-030-03.R04 | Every transition emits one CTR-EVT-001 event; `revision` increments by 1. | MVP |
| PS-030-03.R05 | `RESOLVED_*` and `WITHDRAWN` are terminal. A new dispute on the same subject requires a new subject transition. | MVP |
| PS-030-03.R06 | No-response: if counterparty does not respond within 7 days (ASSUMPTION), state becomes `UNDER_REVIEW` (not resolved in favour of either party). | MVP |

## Data / schema
`link_state` field per [domain_schema.md](domain_schema.md). Mirror state is a cache; F09 is authoritative on conflict.

## Commands / queries / events
Events: `service_dispute.link_opened`, `service_dispute.link_refused`. F09 events are consumed, not re-emitted.

## States & transitions (local link)
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | dispute.create submitted | validation passes | requested | F09 call with idempotency key |
| requested | F09 ack | dispute_ref returned | opened | emit link_opened; set subject flag |
| requested | F09 refusal | any code | refused | emit link_refused with code |
| requested | timeout > 5 s | unknown outcome | requested | retry same key (max 3) |

## States & transitions (mirrored, read-only)
| F09 state | Effect on subject |
|---|---|
| OPEN | subject frozen for milestone acceptance |
| AWAITING_RESPONSE | acceptance blocked; auto-accept timer paused |
| UNDER_REVIEW | no client or provider actions except evidence |
| RESOLVED_* / WITHDRAWN | subject unfrozen per resolution |
| EXPIRED_NO_RESPONSE | subject unfrozen; F09 marks outcome |

## Validation & errors
Invalid local transition → `DISPUTE.INVALID_TRANSITION` (retryable false).

## Authorization
Transitions require participant role, see [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Unknown F09 outcome keeps `requested`; retries reuse the key. Concurrent opens: F09 returns the existing ref; local link set to `opened`. Offline: opening is refused offline (see failure file).

## Privacy, retention, abuse
Mirror state carries no party narrative. Terminal link rows follow F09 retention.

## Observability & budgets
Time-in-state histogram per `link_state`. Alert if any link stays `requested` > 60 s (ASSUMPTION).

## Tests
- TEST-PS-030-03-01 unit: each local transition row.
- TEST-PS-030-03-02 integration: F09 timeout then success yields exactly one `link_opened`.
- TEST-PS-030-03-03 integration: subject frozen while F09 state is `OPEN`.

## Acceptance criteria
1. No local transition exists outside the table.
2. Claim moves to `DISPUTED` only inside the 14-day window.
3. No state label contains "paid", "payment received" or "settled" (CTR-COM-001 R15).

## Assumptions & open decisions
- ASSUMPTION: 7-day counterparty response window.
- D04 (partial execution) PROVISIONAL: remedy is recorded as attestation, not as an atomic transfer.
