# PS-045-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_proximity. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R04, R11), CTR-FED-001 (R02), CTR-SCH-001 (R07).

**Decision labels:** D05 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-10.R01 | Cell registry import only from the admin tool with F10 approval record; no peer import in MVP. | MVP |
| PS-045-10.R02 | Registry export is public-safe (PUBLISHED cells and buckets only). | MVP |
| PS-045-10.R03 | Owner export of budget counters: remaining count only. | MVP |
| PS-045-10.R04 | Backups restore registry state as of backup; budget counters are not restored (RET-EPH). | MVP |
| PS-045-10.R05 | Forward-only registry schema; upcast on read. | MVP |
| PS-045-10.R06 | Flag `proximity.enabled` off stops region queries (503 with message key); anonymous registry reads of PUBLISHED cells continue. | MVP |

## Data / schema
Registry export: `export_id`, `schema_version`, `cells[]` (PUBLISHED and buckets), `sha256`.

## Commands / queries / events
`cell.export` query (public-safe); no import command in MVP.

## States & transitions
Export changes no state.

## Validation & errors
`PROXIM.IMPORT_NOT_ALLOWED` (403) for peer imports.

## Authorization
Export of registry: public-safe. Full registry export: `global` with dual control, excluding item counts below K_MIN.

## Failure, idempotency, concurrency, offline
Export idempotent per snapshot ID.

## Privacy, retention, abuse
No per-user data in export. Full registry export contains only cells and states, no per-user data.

## Observability & budgets
`proximity_export_total`; p95 ≤ 10 s (ASSUMPTION).

## Tests
- TEST-PS-045-10-01 (contract): public export has no sub-K_MIN bucket.
- TEST-PS-045-10-02 (negative): peer import attempt rejected.
- TEST-PS-045-10-03 (backup): restore does not restore budget counters.
- TEST-PS-045-10-04 (rollback): flag off → 503 for region queries; anonymous registry read still works.

## Acceptance criteria
1. Public export has no sub-K_MIN values.
2. No peer import path exists.
3. Rollback fails region queries closed.

## Assumptions & open decisions
- ASSUMPTION: export rate and snapshot IDs.
- OPEN (F10): full registry export scope.
