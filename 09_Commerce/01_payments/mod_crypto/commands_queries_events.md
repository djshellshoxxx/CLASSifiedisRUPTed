# PS-068-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_crypto (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (adapter commands), CTR-EVT-001 (R02, R05, R10), CTR-SCH-001, CTR-ERR-001. **Decisions:** D06 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-068-04.R01 | `adapter.verify`, `adapter.finality`, `adapter.reorg` accept only `sys_` principals with a verification-scoped grant. | MVP |
| PS-068-04.R02 | `chain_adapter.register` requires two distinct operator approvals and a signed registration document. | MVP |
| PS-068-04.R03 | Adapter results carry `adapter_id`, `raw_digest`, `block_hash`; retried results are idempotent by these fields. | MVP |
| PS-068-04.R04 | Event types use `clm.*` (CTR-COM-001) and `chain_adapter.*` (this module). | MVP |

## Data / schema
Schema `chain_adapter` 1.0.0; registration payload: `chain_id`, `adapter_pubkey`, `finality_confirmations`, `assets[]`, `signed_by[]`.

## Commands / queries / events
| Command | Event | Expected revision | Actor |
|---|---|---|---|
| `chain_adapter.register` | `chain_adapter.registered` | null | operator ×2 |
| `chain_adapter.disable` | `chain_adapter.disabled` | required | operator |
| `adapter.verify` | `clm.verified` or none | required (claim) | `sys_` |
| `adapter.finality` | `clm.finalized` or none | required (claim) | `sys_` |
| `adapter.reorg` | `clm.reorged` | required (claim) | `sys_` |
| `chain_adapter.list` (query) | none | n/a | public |

## States & transitions
Maps to PS-068-03 and the adapter states in PS-068-01.

## Validation & errors
Shared: `COM.*` codes from PS-068-02; `SYS.CONFLICT` for stale revisions.

## Authorization
Per PS-068-05.

## Failure, idempotency, concurrency, offline
Adapter commands are never queued on the client; they are server-side only.

## Privacy, retention, abuse
Events carry claim IDs and codes; raw adapter responses stay in the verification store.

## Observability & budgets
Counter per command and adapter. Latency p95 ≤ 2 s for `adapter.verify` (CTR-COM-001 ASSUMPTION).

## Tests
- TEST-PS-068-04-01 (contract): event payloads validate against CTR-EVT-001 and CTR-SCH-001.
- TEST-PS-068-04-02 (unit): `adapter.*` with a non-`sys_` actor returns `SYS.FORBIDDEN`.
- TEST-PS-068-04-03 (integration): duplicate `adapter.verify` with same digest yields one record.
- TEST-PS-068-04-04 (contract): registration with one signature returns `SYS.FORBIDDEN`.

## Acceptance criteria
1. Command table matches implementation.
2. No adapter command accepts a human principal.
3. Idempotency tests pass.

## Assumptions & open decisions
- ASSUMPTION: `chain_adapter` schema starts at 1.0.0.
- D06 (PROVISIONAL, unapproved).
