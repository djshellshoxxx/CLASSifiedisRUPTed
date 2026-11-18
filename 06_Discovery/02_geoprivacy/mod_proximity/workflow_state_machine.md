# PS-045-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_proximity. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (K_MIN, R04; disclosure), CTR-EVT-001 (listing events drive counts).

**Decision labels:** D05 PROVISIONAL. K_MIN ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-03.R01 | Cell publication states exactly PUBLISHED, MERGED_UP, SUPPRESSED. | MVP |
| PS-045-03.R02 | A cell with active count ≥ 5 is PUBLISHED. | MVP |
| PS-045-03.R03 | A cell below 5 is MERGED_UP into its parent if the parent count ≥ 5 after merge; otherwise SUPPRESSED. | MVP |
| PS-045-03.R04 | Recomputation runs every 15 min (ASSUMPTION) and on listing publish or expiry batch. | MVP |
| PS-045-03.R05 | No transition exposes a count below K_MIN, including during recomputation. | MVP |

## Data / schema
Each recomputation writes a new `refreshed_at`; prior state retained for one cycle to avoid flapping.

## Commands / queries / events
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | cell.registered | registry admin, F10 approval | SUPPRESSED (count 0) | Registry entry |
| SUPPRESSED, MERGED_UP | cell.published | count ≥ 5 | PUBLISHED | Bucket visible |
| PUBLISHED | cell.merged_up | count < 5 and parent ≥ 5 | MERGED_UP | Count rolls to parent |
| PUBLISHED, MERGED_UP | cell.suppressed | count < 5 and parent < 5 | SUPPRESSED | Hidden |

Event names use `cell.*` (aggregate `cell`, registry scope).

## States & transitions
No terminal state; cells are retired only through registry change (CTR-ID-001 style retirement, ASSUMPTION).

## Validation & errors
`PROXIM.CELL_UNKNOWN` for unregistered cells; `PROXIM.CELL_RETIRED` (410) for retired cells.

## Authorization
Registry changes by registry admin with F10 approval (dual control for changes to K_MIN or cell set, CTR-PRV-001 R04 rule).

## Failure, idempotency, concurrency, offline
Recomputation idempotent per cycle. Concurrent recompute: revision check; later write retries.

## Privacy, retention, abuse
State history retains only cell IDs and bucket values.

## Observability & budgets
`proximity_cell_transitions_total{from,to}`; alert on any response with count < 5 (must be 0).

## Tests
- TEST-PS-045-03-01 (state): every table row passes.
- TEST-PS-045-03-02 (threshold): count 4 → SUPPRESSED; 5 → PUBLISHED.
- TEST-PS-045-03-03 (merge): child 3 with parent 6 → MERGED_UP; parent count rises by 3.
- TEST-PS-045-03-04 (flapping): oscillating count does not change state more than once per cycle.

## Acceptance criteria
1. No API response below K_MIN (TEST-PS-045-03-02, PS-045-02 R06).
2. Merge preserves total counts.
3. Refresh cadence ≤ 15 min.

## Assumptions & open decisions
- ASSUMPTION: 15-minute cycle; K_MIN 5.
- OPEN (F10): K_MIN value and merge policy.
