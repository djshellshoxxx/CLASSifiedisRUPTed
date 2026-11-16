# PS-006-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_sell. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R02, R05, R07, R08), CTR-EVT-001 (R08), CTR-PRV-001 (R11, R12), CTR-FED-001 (R08, R12).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-006-10.R01 | Owner export includes the `sell` object, the owner's listing events, and buyer references at PSEUDONYMOUS class. Buyer-side export includes own `prq_` records only. | MVP |
| PS-006-10.R02 | Export never includes `reservation.trx_id` evidence payloads, requests from other buyers, or any LOCATION_PRECISE data (CTR-PRV-001 R11). | MVP |
| PS-006-10.R03 | Import of a federated sell listing requires a valid CTR-FED-001 envelope and PUBLIC class. Import never creates reservations or sales. | MVP |
| PS-006-10.R04 | Backup restore rebuilds `sell_state` by replaying listing events, then reconciles each open `trx_` against F09 (PS-006-06 R05). Backup state alone is not trusted. | MVP |
| PS-006-10.R05 | Rollback: feature flag `sell_listing_type` off (F15) stops new sell listings and new requests. Existing reservations run to completion or release. Events are never deleted. | MVP |
| PS-006-10.R06 | Schema changes: adding `"sell"` to `listing_kind` and new optional fields are MINOR. Changing the `sell` object shape is MAJOR (CTR-SCH-001 R03–R04). | MVP |

## Data / schema
Export file: JSON with `schema_id` and `schema_version` per record, plus SHA-256 digest (CTR-SCH-001 R02). Golden fixtures for `sell.listing-extension` 1.0.0 and each supported upcast path (CTR-SCH-001 R09).

## Commands / queries / events
Export is a query, `sell.export(lst_id | self)`, owner or buyer scope only. Import runs as `sys_` with `lst.execute`.

## States & transitions
Rollback path: flag off → no new T1 transitions; open reservations complete through T2–T7; no new events are required beyond those.

## Validation & errors
Import rejects unknown MAJOR with `SCH.UNKNOWN_VERSION`. Import with a digest mismatch is rejected with `SYS.CONFLICT` (ASSUMPTION for code choice).

## Authorization
Export scopes: owner (own listings), buyer (own requests). Import is `sys_` only. Restore runs as operator with dual control for any PRIVATE data (CTR-CAP-001 R07), none expected here.

## Failure, idempotency, concurrency, offline
Import is idempotent on `(origin_node, event_id)` (CTR-FED-001 R05). Restore is repeatable: running it twice yields the same state. Partial restore fails closed: `sell_state` stays unset until reconciliation completes.

## Privacy, retention, abuse
Exports of `prq_` are deleted from export storage after 7 days (ASSUMPTION). Export digests are logged; contents are not.

## Observability & budgets
Restore reconciliation counts (rebuilt, drifted, failed) emitted per run. Export p95 ≤ 5 s for 1000 listings (ASSUMPTION).

## Tests
- TEST-PS-006-10-01 (contract): golden fixture for `sell.listing-extension` 1.0.0 round-trips byte-identical.
- TEST-PS-006-10-02 (integration): restore from backup rebuilds `sell_state` and reconciles one drifted `trx_`.
- TEST-PS-006-10-03 (integration): flag off stops new requests; an open reservation releases correctly.
- TEST-PS-006-10-04 (negative): federated import without PUBLIC class or without a valid envelope is rejected.

## Acceptance criteria
1. Owner and buyer exports contain no data outside their scope.
2. Restore followed by reconciliation yields no drift against F09.
3. Rollback leaves no reservation without a live `trx_` or compensation.
4. Schema changes follow the version table in R06 and pass CTR-SCH-001 checks.

## Assumptions & open decisions
- D01 PROVISIONAL (default: versioned signed envelopes). Import relies on it.
- D07 PROVISIONAL (default: minimal retention). Export file retention is ASSUMPTION within it.
- D10 PROVISIONAL (default: user-controlled keys with documented recovery). Owner export is unsigned in MVP.
