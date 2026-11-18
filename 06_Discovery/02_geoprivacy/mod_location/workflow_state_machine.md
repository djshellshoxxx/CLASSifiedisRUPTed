# PS-048-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_location. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03, R06), CTR-CAP-001 (R04), CTR-EVT-001 (R08); PENDING CTR-DSC-001.

**Decision labels:** Withdrawal clears stored cell PROVISIONAL (D07 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-048-03.R01 | Stored cell states: `unset`, `set`, `cleared`. Consent states: `none`, `granted`, `withdrawn`. | MVP |
| PS-048-03.R02 | Withdrawal of consent clears a device-sourced cell within 60 s and emits `location.cell.changed` with `state: cleared`. | MVP |
| PS-048-03.R03 | Picker-sourced cell is not affected by device consent withdrawal. | MVP |
| PS-048-03.R04 | Account deletion clears the cell (RET-ACC). | MVP |

## Data / schema
Single row per `acc_`. History not kept beyond the audit event (RET-AUD, cell values only).

## Commands / queries / events
Transitions driven by `location.cell.set`, `location.cell.clear`, `location.consent.grant`, `location.consent.withdraw`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| unset | cell.set (picker) | cell valid | set | event changed |
| unset | cell.set (device) | consent granted | set | event changed |
| set | cell.set (new cell) | valid | set | event changed |
| set | cell.clear | — | cleared | event changed |
| set (device) | consent.withdraw | — | cleared | event changed, client cache purged |
| cleared | cell.set | valid | set | event changed |
| any | account deleted | — | cleared | purge |

## Validation & errors
Invalid transition → `LOCATION.INVALID_TRANSITION` (retryable false).

## Authorization
Self-scope only (PS-048-05).

## Failure, idempotency, concurrency, offline
Consent withdrawal wins over concurrent set (last-write by consent revision). Client purges local cache on logout and withdrawal.

## Privacy, retention, abuse
No coordinates in any state.

## Observability & budgets
Counter `location_transitions_total{from,to}`; withdrawal-to-clear p95 ≤ 60 s.

## Tests
- TEST-PS-048-03-01 (unit): every table row.
- TEST-PS-048-03-02 (integration): withdrawal clears device-sourced cell; picker cell retained.
- TEST-PS-048-03-03 (integration): deletion clears cell within 24 h (fixture).

## Acceptance criteria
1. Table rows tested.
2. Withdrawal clears within 60 s.
3. Picker cell survives device withdrawal.

## Assumptions & open decisions
- ASSUMPTION: 60 s clearing SLA.
