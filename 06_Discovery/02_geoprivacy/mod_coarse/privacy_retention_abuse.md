# PS-047-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_coarse. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R02, R04, R05), CTR-FED-001 (R03 and LOCATION_COARSE rule in CTR-PRV-001 Federation section); PENDING CTR-DSC-001.

**Decision labels:** K_MIN = 5 (ASSUMPTION, F10). Cell-only disclosure PROVISIONAL (D05 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-07.R01 | A cell is shown only when active item count ≥ 5 (K_MIN); cells below are merged or suppressed. | MVP |
| PS-047-07.R02 | Counts below K_MIN are never returned, logged or emitted. | MVP |
| PS-047-07.R03 | Federation of coarse cells uses the same K_MIN rule as public display (CTR-PRV-001). | Future |
| PS-047-07.R04 | Cell geometry is stored at cell granularity only; no vertex finer than the registered cell boundary (ASSUMPTION). | MVP |
| PS-047-07.R05 | Registry justifications are deleted 24 months after approval (RET-AUD-aligned, ASSUMPTION). | MVP |

## Data / schema
Retention: registry versions RET-AUD; recompute windows RET-OPS; justification text as above.

## Commands / queries / events
No personal data flows through this module; input is aggregate counts from index.

## States & transitions
Suppression state is privacy-driven, not abuse-driven.

## Validation & errors
Not applicable beyond PS-047-02.

## Authorization
Justification access limited (PS-047-05 R05).

## Failure, idempotency, concurrency, offline
Privacy failure (K_MIN check unavailable) fails closed (PS-047-06 R04).

## Privacy, retention, abuse
Differencing attacks: an attacker comparing publication flags over time to infer when a single listing appears. Mitigation: flags recompute on 5-minute windows and change only on K_MIN crossing; publication change events are not per-listing (ASSUMPTION; F10 to threat-model further). Sybil abuse on cell proposals: proposals require `ope_`.

## Observability & budgets
Aggregate dashboards show cell state counts only when cell count of cells ≥ K_MIN.

## Tests
- TEST-PS-047-07-01 (unit): boundary at 4 and 5.
- TEST-PS-047-07-02 (property): no response includes integer count per cell.
- TEST-PS-047-07-03 (abuse): differencing simulation shows flag change does not reveal single listing (fixture).

## Acceptance criteria
1. K_MIN enforced across all outputs (API, events, logs, dashboards).
2. Differencing test within tolerance defined by F10.
3. Justification retention purge verified.

## Assumptions & open decisions
- ASSUMPTION: K_MIN = 5 (F10 to validate).
- D05 PROVISIONAL.
