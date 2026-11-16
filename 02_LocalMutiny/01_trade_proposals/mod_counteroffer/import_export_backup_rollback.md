# PS-012-10 — import export backup rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_counteroffer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (export format, expand/contract migrations), CTR-PRV-001 (export and deletion), CTR-FED-001 (federated import, Future), CTR-EVT-001 (replay).

**Decision label:** Federated import and export are PROVISIONAL deferral (D01 default, unapproved). Feature flag name is ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-012-10.R01 | Owner export returns counters as JSON `counter.v1` with classes per CTR-PRV-001.R11. | MVP |
| PS-012-10.R02 | Backups include `counter` rows with their `cyc_` rows. Restore is refused unless invariants pass (below). | MVP |
| PS-012-10.R03 | Feature flag `counteroffer.create_enabled` (ASSUMPTION) blocks `counter.create` only. Accept, reject and withdraw of OPEN counters stay available. | MVP |
| PS-012-10.R04 | Federated counter import and export are not in MVP. Inbound `counter.*` events from peers are rejected with `FED` codes per CTR-FED-001. | Future |

## Export and import
| Item | Rule |
|---|---|
| Export format | `counter.v1` JSON array, sorted by `cyc_id`, `revision` |
| Export of counterparty content | Only the requester's own counters and shared `cyc_` history at allowed classes |
| Import (MVP) | None. Counters are created only by `counter.create`. |
| Federation (Future) | Deferred until CTR-FED-001 event envelope and D01 are decided |

## Backup, restore and rollback
| Step | Rule |
|---|---|
| Restore invariant 1 | At most one OPEN per `cyc_` |
| Restore invariant 2 | `cyc_.revision` equals the revision of its ACCEPTED counter, if any |
| Restore invariant 3 | No OPEN counter with `expires_at` in the past; expiry sweep runs first |
| Invariant failure | Block `cyc_` transitions; alert Marketplace Lead; no automatic repair |
| Migration | CTR-SCH-001 expand then contract; no in-place rename of `counter.v1` fields |
| Rollback of release | Disable `counteroffer.create_enabled`; leave schema in place; do not drop `counter` rows |

## Assumptions & open decisions
- ASSUMPTION: restore point objective 15 min for `counter` rows, same as `cyc_` rows (owner F15).
- D01 PROVISIONAL (D01 default, unapproved): federated protocol decided later; this file defers it.
- PENDING: owner of backup policy for `cyc_` (F02 cycle module).
