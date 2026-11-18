# PS-014-04 — commands, queries and events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-014-04.R01 | Every mutating command carries `idempotency_key` (UUIDv4) and `expected_revision`. | MVP |
| PS-014-04.R02 | Event payloads carry IDs, status, slot index and region cell ID only; no `acc_`, no `prf_` beyond the event's `actor_ref`. | MVP |
| PS-014-04.R03 | Schema version `1.0.0`; unknown major → `SCH.UNKNOWN_VERSION`. | MVP |

## Data / schema
- `party.invite` `{cyc_id, invitee_prf_ref, idempotency_key}` → `{par_id, slot_index, status: "invited"}`. Invitee resolved server-side from `prf_` to `acc_`.
- `party.accept` `{par_id, expected_revision, region_cell_id, idempotency_key}`.
- `party.decline`, `party.withdraw` `{par_id, expected_revision, idempotency_key}`.
- Query `party.list_for_cycle` `{cyc_id, cursor, limit ≤ 6}` returns `prf_ref`, `slot_index`, `status`, `region_cell_id`.

## Commands / queries / events
Events `party.invited|accepted|declined|withdrawn|removed|expired`; `aggregate_type` = `party`. Example `party.accepted` payload: `{"par_id","cyc_id","slot_index","region_cell_id","max_data_class":"LOCATION_COARSE"}`.

## States & transitions
Effects per PS-014-03.

## Validation & errors
PS-014-02 codes. Idempotency conflict: `SYS.IDEMPOTENCY_KEY_REUSED`.

## Authorization
PS-014-05. Caller identity from authenticated principal only.

## Failure, idempotency, concurrency, offline
Same key and digest returns original (CTR-EVT-001 R03). Retries per PS-014-06.

## Privacy, retention, abuse
`actor_ref` carries `acc_` for the acting party (CTR-EVT-001 R06); federation export would re-key (not in MVP).

## Observability & budgets
Command p95 ≤ 250 ms; logs carry codes and IDs only.

## Tests
- TEST-PS-014-04-01 (contract): payload schema snapshot; forbidden-field scan.
- TEST-PS-014-04-02 (contract): replay returns original; zero new events.
- TEST-PS-014-04-03 (contract): same key with different digest → `SYS.IDEMPOTENCY_KEY_REUSED`.

## Acceptance criteria
1. All commands and events pass CTR-SCH-001 schema tests.
2. No event fixture carries `prf_` outside `actor_ref`.

## Assumptions & open decisions
- ASSUMPTION: invitee is addressed by `prf_` only; the invitee's `acc_` is never sent to the proposer.
- PENDING CTR-ID-001: `par` prefix is already registered (no action).
