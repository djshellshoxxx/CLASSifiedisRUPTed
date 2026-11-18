# PS-072-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_reconciliation (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04–R08), CTR-PRV-001 (R07). **Decisions:** D04 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-072-05.R01 | `recon.run` by `sys_` (schedule) or `ope_` with `reconciliation.execute` scoped to listed chains and windows. | MVP |
| PS-072-05.R02 | Findings are visible to operators only under a `case:` or dual-controlled `global` grant (CTR-PRV-001 R07). | MVP |
| PS-072-05.R03 | Resolution of `FINAL_WITHOUT_ADAPTER` requires two distinct `ope_` approvers. | MVP |
| PS-072-05.R04 | Participants see only their own claim status changes, never findings. | MVP |

## Data / schema
Capabilities: `reconciliation.execute`, `reconciliation.read`, `reconciliation.resolve`.

## Commands / queries / events
| Command | Action | Actor |
|---|---|---|
| `recon.run` | `reconciliation.execute` | sys_, ope_ |
| `recon.finding.list` | `reconciliation.read` | ope_ with case grant |
| `recon.finding.resolve` | `reconciliation.resolve` | ope_ (dual for FINAL types) |

## States & transitions
Grants per CTR-CAP-001 lifecycle.

## Validation & errors
Unauthorized: `SYS.FORBIDDEN`; hidden resource: `SYS.NOT_FOUND`.

## Authorization
Field visibility: amounts hidden unless case grant includes FINANCIAL_EVIDENCE purpose.

## Failure, idempotency, concurrency, offline
Grant checked at each list page.

## Privacy, retention, abuse
Every finding read emits `aud_` with finding ID and purpose.

## Observability & budgets
Alert on reads without case reference.

## Tests
- TEST-PS-072-05-01 (unit): matrix rows.
- TEST-PS-072-05-02 (integration): single operator cannot resolve FINAL finding (`CAP.SELF_APPROVAL_FORBIDDEN`).
- TEST-PS-072-05-03 (negative): participant cannot list findings.
- TEST-PS-072-05-04 (integration): finding read creates `aud_`.

## Acceptance criteria
1. Matrix implemented.
2. Dual control enforced.
3. Audit records complete.

## Assumptions & open decisions
- ASSUMPTION: grant maximum 72 h.
- D04 (PROVISIONAL default, unapproved).
