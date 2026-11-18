# PS-047-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_coarse. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R04, R05), CTR-SCH-001 (R03); PENDING CTR-DSC-001.

**Decision labels:** Merge-up policy PROVISIONAL (D05 default, unapproved). K_MIN = 5 ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-03.R01 | Cell states: `proposed`, `active`, `retired`. `retired` is terminal. | MVP |
| PS-047-03.R02 | Publication states: `publishable`, `merged`, `suppressed`. Recomputed every 5 min. | MVP |
| PS-047-03.R03 | A cell with active item count ≥ 5 is `publishable`; below 5 with a parent ≥ 5 → `merged` into parent; otherwise `suppressed`. | MVP |
| PS-047-03.R04 | Transition from `publishable` to `suppressed` or `merged` takes effect for query results within 5 min. | MVP |
| PS-047-03.R05 | Each publication transition emits `geo.cell.published_state_changed` with no count. | MVP |

## Data / schema
Publication flags on registry version (PS-047-01). Counts exist only in the in-memory recompute job and are discarded after evaluation (RET-EPH).

## Commands / queries / events
Transitions driven by `cell.approve`, `cell.retire` and `publication.recompute`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| proposed | cell.approve (dual) | validation pass | active | new registry version |
| active | cell.retire (dual) | V4 pass | retired | new version; queries return COARSE.CELL_RETIRED |
| publishable | recompute, count < 5 | parent ≥ 5 | merged | state event |
| publishable | recompute, count < 5 | parent < 5 | suppressed | state event |
| merged / suppressed | recompute, count ≥ 5 | — | publishable | state event |
| any active | recompute, cell retired | — | retired | no further publication |

## Validation & errors
Invalid transition → `COARSE.INVALID_TRANSITION` (retryable false).

## Authorization
Approvals require two distinct `ope_` principals plus F10 approver (PS-047-05).

## Failure, idempotency, concurrency, offline
Recompute job writes per-cell flags in one transaction per registry version; partial failure keeps previous flags.

## Privacy, retention, abuse
Merge into parent may reveal that a cell is sparse; no count revealed.

## Observability & budgets
Gauge `coarse_cells_by_publication_state`; recompute p95 ≤ 60 s for 100 000 indexed items (ASSUMPTION).

## Tests
- TEST-PS-047-03-01 (unit): each row of the transition table.
- TEST-PS-047-03-02 (boundary): 4 items → merged or suppressed; 5 → publishable.
- TEST-PS-047-03-03 (integration): publication change visible in query within 5 min.

## Acceptance criteria
1. Boundary tests pass for 4, 5 and 6 items.
2. Retired cells never return results.
3. Recompute idempotent: two runs produce identical flags.

## Assumptions & open decisions
- ASSUMPTION: 5-minute recompute cadence (F15 to validate).
