# PS-015-04 — commands, queries and events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_two. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-015-04.R01 | Mutating commands carry `idempotency_key` (UUIDv4) and `expected_revision`. | MVP |
| PS-015-04.R02 | Events carry IDs, size, status and counts only. | MVP |
| PS-015-04.R03 | Schema version `1.0.0`; unknown major → `SCH.UNKNOWN_VERSION`. | MVP |

## Data / schema
- `cycle.propose` `{par_ids[2..6], expires_at, origin, candidate_ref?, idempotency_key}` → `{cyc_id, status: "proposed", revision: 1}`.
- `cycle.withdraw` `{cyc_id, expected_revision, idempotency_key}`.
- `cycle.lock` and `cycle.close`: system-only, `{cyc_id, expected_revision}`.
- Query `cycle.get` `{cyc_id}`; query `cycle.list_mine` `{cursor, limit ≤ 50}`.

## Commands / queries / events
Event example `cycle.fully_accepted`: `{"cyc_id","size","revision","confirm_until","max_data_class":"PSEUDONYMOUS"}`. `aggregate_type` = `cycle`.

## States & transitions
Effects per PS-015-03.

## Validation & errors
PS-015-02 codes; `SYS.IDEMPOTENCY_KEY_REUSED` on digest mismatch.

## Authorization
PS-015-05.

## Failure, idempotency, concurrency, offline
Same key and digest returns original result. Concurrent withdraw and lock: PS-015-03.

## Privacy, retention, abuse
`actor_ref` carries `acc_` of the acting party only.

## Observability & budgets
Command p95 ≤ 300 ms; list p95 ≤ 150 ms.

## Tests
- TEST-PS-015-04-01 (contract): schema snapshot for all commands and events.
- TEST-PS-015-04-02 (contract): replay returns original; no duplicate events.
- TEST-PS-015-04-03 (contract): event payloads contain no item or account fields.

## Acceptance criteria
1. All commands and events pass CTR-SCH-001 tests.
2. Zero forbidden fields in event fixtures.

## Assumptions & open decisions
- ASSUMPTION: `origin = matched` commands are accepted only from the system principal of F02.S02.M03.
