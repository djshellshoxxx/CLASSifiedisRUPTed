# PS-048-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_location. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01, R04), CTR-PRV-001 (R03, R07), CTR-ERR-001 (R08).

**Decision labels:** Guest device resolution ASSUMPTION (F16 decision).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-048-05.R01 | Stored cell read and write: `self` scope on `acc_`, verbs `read` and `update`. | MVP |
| PS-048-05.R02 | Device consent grant and withdrawal: `self` scope, verb `consent`. | MVP |
| PS-048-05.R03 | No principal other than the owner can read a stored cell; operators may read counts only via aggregate (K_MIN). | MVP |
| PS-048-05.R04 | Guest may perform client-side device resolution for search; nothing is stored for a guest. | MVP |
| PS-048-05.R05 | Support staff cannot view or set another account's cell. | MVP |

## Data / schema
| Capability | Scope | Verb | Holder |
|---|---|---|---|
| `location.cell.own` | self | read, update | `acc_` |
| `location.consent.own` | self | consent | `acc_` |
| `location.cell.aggregate` | global | read (K_MIN) | `sys_` analytics |

## Commands / queries / events
Each consent change writes `dec_`/`aud_` (RET-AUD) with consent ID only.

## States & transitions
Pending consent expires after 15 min unconfirmed (ASSUMPTION).

## Validation & errors
Foreign account → `SYS.NOT_FOUND`.

## Authorization
Matrix above; no delegated access in MVP.

## Failure, idempotency, concurrency, offline
Revoked session cannot withdraw consent? It can: withdrawal is allowed for any valid session and by account recovery flow (F07).

## Privacy, retention, abuse
Account recovery must not reveal cell to recovery agent (F07 PS dependency: PENDING).

## Observability & budgets
Alert on any cross-account cell read attempt.

## Tests
- TEST-PS-048-05-01 (unit): matrix allow/deny.
- TEST-PS-048-05-02 (security): cross-account read returns SYS.NOT_FOUND.
- TEST-PS-048-05-03 (integration): support role denied write.

## Acceptance criteria
1. Matrix tested.
2. Cross-account reads indistinguishable from nonexistent.
3. Guest path stores nothing (test).

## Assumptions & open decisions
- ASSUMPTION: guest device resolution allowed (F16 decision).
