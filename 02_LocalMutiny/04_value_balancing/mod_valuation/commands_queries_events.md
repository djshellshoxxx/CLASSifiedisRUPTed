# PS-027-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_valuation. **Parent:** [mod_valuation SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-COM-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-027-04.R01 | Every command carries `idempotency_key` and `expected_revision` (CTR-EVT-001 R02, R03). | MVP |
| PS-027-04.R02 | Snapshot query response ≤ 32 KB for 16 items. | MVP |
| PS-027-04.R03 | Events use CTR-EVT-001 envelope, `aggregate_type` = `cycle`, `max_data_class` = FINANCIAL_EVIDENCE once DECLARED. | MVP |
| PS-027-04.R04 | Commands return the snapshot hash; clients must reference that hash, not a revision number, when consenting. | MVP |

## Data / schema
| Command | Signature | Idempotency key | Version |
|---|---|---|---|
| `valuation.compute` | (`cyc_`, expected_revision, quote_set_hash) → snapshot | (actor, command, key) | 1.0.0 |
| `valuation.get` | (`cyc_`, revision or `current`) → snapshot | n/a (query) | 1.0.0 |
| `valuation.declare_value` | (`cyc_`, par_id, item_ref, value_source, declared_minor, currency, quote_id?) | (actor, command, key) | 1.0.0 |

## Commands / queries / events
| Event (`schema_id`) | Emitted by | Payload |
|---|---|---|
| `valuation.snapshot_computed` | compute | cyc_, revision, snapshot_hash, valid_until |
| `valuation.snapshot_stale` | state timer / revision | cyc_, snapshot_hash, reason enum |
| `valuation.value_declared` | declare_value | cyc_, par_id, item count only |

Errors: PS-027-02 codes plus `SYS.CONFLICT` on revision mismatch.

## States & transitions
Command outcomes map to PS-027-03. A declare_value command creates a new revision (through mod_counteroffer) and does not change an existing snapshot.

## Validation & errors
Schema validation first (JSON Schema 2020-12), then PS-027-02. Unknown fields rejected (`SYS.REQUEST_MALFORMED`).

## Authorization
Declaration: owner of the slot (`cyc.propose`). Compute: `sys` only. Read: PS-027-05.

## Failure, idempotency, concurrency, offline
Duplicate key with same digest returns original snapshot. Stale `expected_revision` returns `SYS.CONFLICT`. Event delivery at-least-once; consumers dedupe on `event_id`.

## Privacy, retention, abuse
`valuation.value_declared` omits value and currency. Snapshot values reach only participants (PS-027-05).

## Observability & budgets
Compute p95 ≤ 100 ms (ASSUMPTION). Event lag p95 ≤ 2 s.

## Tests
- TEST-PS-027-04-01 (contract): all three commands and three events validate against CTR-SCH-001 schemas.
- TEST-PS-027-04-02 (integration): duplicate compute returns identical hash.
- TEST-PS-027-04-03 (contract): `valuation.value_declared` payload has no `declared_minor` field.
- TEST-PS-027-04-04 (integration): consent with an outdated snapshot hash returns `VALUE.SNAPSHOT_STALE`.

## Acceptance criteria
1. All commands and events registered in CTR-SCH-001.
2. Consent references snapshot hash, verified in integration test.
3. Event payload audit shows zero monetary fields in value_declared.

## Assumptions & open decisions
- ASSUMPTION: idempotency key retention 24 h.
- Snapshot schema is consumed by F02.S01.M04 and F02.S02.M05 via full ID references only. See [DECISIONS.md](../../../DECISIONS.md) D03.
