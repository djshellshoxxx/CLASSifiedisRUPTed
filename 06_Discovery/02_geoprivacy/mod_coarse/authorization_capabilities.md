# PS-047-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_coarse. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01, R03, R04), CTR-ERR-001 (R08); PENDING CTR-DSC-001.

**Decision labels:** Dual approval PROVISIONAL (D05 default, unapproved). Capability names are ASSUMPTION pending F16.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-05.R01 | Propose requires `administer` by `ope_` on `global`. | MVP |
| PS-047-05.R02 | Approve and retire require two distinct `ope_` principals and an F10 approval record. | MVP |
| PS-047-05.R03 | Recompute runs as `sys_` with `execute` on `global`; it cannot approve or retire. | MVP |
| PS-047-05.R04 | No principal can read raw item counts per cell; counts are only used in the sys job. | MVP |
| PS-047-05.R05 | Cell listing is readable by all principals; justifications are readable by `ope_` and F10 only. | MVP |

## Data / schema
| Capability | Scope | Verb | Holder |
|---|---|---|---|
| `geo.cell.propose` | global | administer | `ope_` |
| `geo.cell.approve` | global | administer | `ope_` (dual) + F10 record |
| `geo.cell.recompute` | global | execute | `sys_` |
| `geo.cells.read` | global | read | all |

## Commands / queries / events
Each decision writes `dec_` (RET-AUD).

## States & transitions
Revoked `ope_` grant cannot complete a pending dual approval.

## Validation & errors
Denied writes → `SYS.FORBIDDEN`; hidden objects → `SYS.NOT_FOUND`.

## Authorization
Actor × action matrix above; field visibility per CTR-CAP-001.

## Failure, idempotency, concurrency, offline
Dual approval expires after 72 h (ASSUMPTION).

## Privacy, retention, abuse
Approver identities recorded in audit (RET-AUD).

## Observability & budgets
Alert on any recompute running under non-sys principal.

## Tests
- TEST-PS-047-05-01 (unit): each matrix row allow/deny.
- TEST-PS-047-05-02 (integration): single-approver approval rejected.
- TEST-PS-047-05-03 (security): count fields unreadable through API by any principal.

## Acceptance criteria
1. Matrix tested row by row.
2. Dual approval enforced.
3. No API returns per-cell item counts.

## Assumptions & open decisions
- ASSUMPTION: 72 h approval expiry.
