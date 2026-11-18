# PS-048-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_location. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R03, R06, R11), CTR-ERR-001, CTR-ID-001, CTR-SCH-001; PENDING CTR-DSC-001.

**Decision labels:** None beyond D05 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-048-04.R01 | All state-changing commands require `idempotency_key` (CTR-EVT-001 R03). | MVP |
| PS-048-04.R02 | Event `location.cell.changed` max_data_class = LOCATION_COARSE; no coordinate field. | MVP |
| PS-048-04.R03 | Query `location.cell.get` returns only the caller's own cell (self scope). | MVP |

## Data / schema
| Name | Kind | Signature | Idempotency | Version | Errors |
|---|---|---|---|---|---|
| `location.cell.set` | command | `(region_cell, source, consent_id?)` | key | 1.0.0 | LOCATION.UNKNOWN_CELL, LOCATION.PRECISE_NOT_ALLOWED, LOCATION.CONSENT_REQUIRED |
| `location.cell.clear` | command | `()` | key | 1.0.0 | LOCATION.INVALID_TRANSITION |
| `location.consent.grant` | command | `(scope: device_resolution)` | key | 1.0.0 | SYS.FORBIDDEN |
| `location.consent.withdraw` | command | `(consent_id)` | key | 1.0.0 | SYS.NOT_FOUND |
| `location.cell.get` | query | `()` | n/a | 1.0.0 | SYS.NOT_FOUND |
| `location.cell.changed` | event | `{account_ref, region_cell, source, state}` | n/a | 1.0.0 | n/a |

Client-only function `resolveCell(fix) → region_cell | error` is not an API; it runs on device against cell geometry.

## States & transitions
See PS-048-03.

## Validation & errors
See PS-048-02.

## Authorization
See PS-048-05.

## Failure, idempotency, concurrency, offline
See PS-048-06.

## Privacy, retention, abuse
Event payload excludes coordinates by schema.

## Observability & budgets
Trace id per command; no coordinates in traces.

## Tests
- TEST-PS-048-04-01 (contract): command schemas match registry.
- TEST-PS-048-04-02 (contract): `location.cell.changed` schema rejects any coordinate key.
- TEST-PS-048-04-03 (unit): duplicate `cell.set` with same key returns original.

## Acceptance criteria
1. Command table complete with versions and idempotency rules.
2. Event schema static check passes.

## Assumptions & open decisions
- D05 PROVISIONAL.
