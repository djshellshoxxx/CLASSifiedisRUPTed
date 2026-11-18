# PS-047-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_coarse. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R02, R04, R06), CTR-SCH-001, CTR-ID-001; PENDING CTR-DSC-001.

**Decision labels:** Cell set, K_MIN = 5 and merge-up policy are PROVISIONAL (D05 default, unapproved; K_MIN is ASSUMPTION for F10 validation).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-01.R01 | Cell registry is the only source of region codes used anywhere in discovery. | MVP |
| PS-047-01.R02 | Cell code format `^[A-Z]{2}-[A-Z0-9]{1,4}-[A-Z0-9]{1,4}$` (ASSUMPTION example: `DE-BE-C1`). | MVP |
| PS-047-01.R03 | Each cell has at most one parent; the parent graph is acyclic and depth ≤ 3. | MVP |
| PS-047-01.R04 | Registry records are versioned; a published version is immutable (CTR-SCH-001 R02). | MVP |
| PS-047-01.R05 | Stored publication state is a boolean flag and a merge target only; item counts are never stored in the registry. | MVP |

## Data / schema
```json
{
  "cell_code": "DE-BE-C1",
  "parent_code": "DE-BE or null",
  "status": "proposed|active|retired",
  "effective_from": "RFC 3339 UTC",
  "retired_at": "RFC 3339 UTC or null",
  "label_key": "geo.cell.de_be_c1",
  "registry_version": "integer >= 1",
  "publication": {"state": "publishable|merged|suppressed", "merged_into": "cell_code or null", "evaluated_at": "RFC 3339 UTC"}
}
```
Data class of registry: PUBLIC (cell codes). Data class of `publication` flags: PUBLIC aggregate (no count).

## Commands / queries / events
Summary: `cell.propose`, `cell.approve`, `cell.retire`, `publication.recompute`; event `geo.cell.published_state_changed`. Full table in PS-047-04.

## States & transitions
Cell: `proposed → active → retired`. Publication: `publishable ↔ merged`, `publishable ↔ suppressed` (PS-047-03).

## Validation & errors
See PS-047-02. Error prefix `COARSE.`.

## Authorization
See PS-047-05.

## Failure, idempotency, concurrency, offline
Registry changes are versioned and dual-approved; recompute is idempotent per window (PS-047-06).

## Privacy, retention, abuse
Registry: RET-ACC-equivalent non-personal config, kept for audit lifetime (RET-AUD). See PS-047-07.

## Observability & budgets
See PS-047-08.

## Tests
- TEST-PS-047-01-01 (unit): code format regex accepts `DE-BE-C1`, rejects lowercase and 5-character segments.
- TEST-PS-047-01-02 (unit): parent cycle and depth 4 rejected.
- TEST-PS-047-01-03 (contract): registry version immutability.

## Acceptance criteria
1. Registry schema validates; no count field present.
2. Cycle and depth checks pass on fixture graph.
3. Published registry version digest stored (SHA-256, CTR-SCH-001 R02).

## Assumptions & open decisions
- ASSUMPTION: cell code format and depth ≤ 3 (F10 to validate).
- D05 PROVISIONAL.
