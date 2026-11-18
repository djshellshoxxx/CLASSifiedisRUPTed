# PS-013-04 — commands, queries and events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_offer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-013-04.R01 | Every mutating command requires `idempotency_key` (UUIDv4 client-generated, 36 chars) and `expected_revision`. | MVP |
| PS-013-04.R02 | Queries return only fields allowed by PS-013-05; absent fields are omitted, not null. | MVP |
| PS-013-04.R03 | Event payloads carry IDs, counts and state only: no note text, no listing titles, no coordinates. | MVP |
| PS-013-04.R04 | All commands and events carry `schema_version` `1.0.0`; unknown major → `SCH.UNKNOWN_VERSION`. | MVP |

## Data / schema
Command `offer.draft.create`: `{slot_ref, cyc_ref, give_lines, want_lines, valuation, note?, expires_at, idempotency_key}` → `{ofr_id, revision_no: 1, status: "draft"}`.
Command `offer.submit`: `{ofr_id, expected_revision, idempotency_key}` → `{ofr_id, revision_no, status: "submitted", submitted_at}`.
Command `offer.withdraw`: `{ofr_id, expected_revision, idempotency_key}`.
Query `offer.get`: `{ofr_id}`. Query `offer.list_for_cycle`: `{cyc_id, cursor, limit ≤ 50}`.

## Commands / queries / events
Events (`event_type` = `offer.<verb>`): `submitted`, `superseded`, `withdrawn`, `expired`, `locked`, `closed`. Example payload for `offer.submitted`: `{"ofr_id","revision_no","par_id","cyc_id","give_count","want_count","max_data_class":"PSEUDONYMOUS"}`.
Idempotency scope and replay: CTR-EVT-001 R03 (7-day retention).

## States & transitions
Command effects per PS-013-03.

## Validation & errors
Validation per PS-013-02. Command-level errors: `SYS.IDEMPOTENCY_KEY_REUSED` on digest mismatch; `EVT.REVISION_CONFLICT` mapped to `OFFER.REVISION_CONFLICT`.

## Authorization
Per PS-013-05. Caller identity from authenticated principal only; body-supplied `par_id` is checked against the slot's owner.

## Failure, idempotency, concurrency, offline
Same key and digest returns original result with no new event. Concurrent submits: one succeeds, others get `OFFER.REVISION_CONFLICT`. Details in PS-013-06.

## Privacy, retention, abuse
Event envelopes carry no `acc_`; `actor_ref` is `acc_` for the acting party only (CTR-EVT-001 R06).

## Observability & budgets
Command latency p95 ≤ 300 ms submit; ≤ 150 ms read. Logs: `code`, `request_id`, module, timing only (CTR-ERR-001 R10).

## Tests
- TEST-PS-013-04-01 (contract): event payloads match schema snapshot; no forbidden fields.
- TEST-PS-013-04-02 (contract): replay of same key+digest returns original, emits zero events.
- TEST-PS-013-04-03 (contract): same key different digest returns `SYS.IDEMPOTENCY_KEY_REUSED`.

## Acceptance criteria
1. All commands and events validated by CTR-SCH-001 schema tests.
2. Zero events contain note text or listing titles in fixture corpus.

## Assumptions & open decisions
- ASSUMPTION: `offer.list_for_cycle` returns counterparties' give/want lines only to cycle participants.
- PENDING CTR-ID-001: `ofr` prefix.
