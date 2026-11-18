# PS-067-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_cash (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01–R08), CTR-COM-001 (Authorization), CTR-PRV-001 (R07). **Decisions:** D06 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-067-05.R01 | Only the two parties of a `trx_` may submit, attest or dispute a cash claim (`participant` scope). | MVP |
| PS-067-05.R02 | Configuration reads are public; configuration writes require `cash_method.administer` with `ope_` principal and dual control. | MVP |
| PS-067-05.R03 | Dispute resolution of cash claims requires `mod` with `case:` scope and decision record. | MVP |
| PS-067-05.R04 | Operators cannot read claim amounts or counterparties without a privileged grant (CTR-PRV-001 R07). | MVP |
| PS-067-05.R05 | `sys_` adapters have no rights over cash claims (no verification capability). | MVP |

## Data / schema
Capability IDs: `cash_method.read`, `cash_method.administer`, `clm.submit`, `clm.attest`, `clm.dispute`, `clm.resolve`.

## Commands / queries / events
| Command | Action | Actor |
|---|---|---|
| `clm.submit` (cash) | `clm.propose` | party |
| `clm.attest` | `clm.attest` | counterparty |
| `clm.dispute` | `clm.reject` | party within window |
| `case.resolve` | `clm.moderate` | `mod_` with `case:` |
| `cash_method.configure` | `cash_method.administer` | `ope_` (dual control) |

## States & transitions
Grants follow CTR-CAP-001 lifecycle; a grant for `cash_method.administer` expires within 72 h (CTR-CAP-001 R06).

## Validation & errors
Non-party: `SYS.NOT_FOUND`. Party without rights: `SYS.FORBIDDEN`.

## Authorization
Field visibility: counterparty sees claim state, amount and currency; moderators see claim under case grant only; no `sys_` visibility beyond verification scope.

## Failure, idempotency, concurrency, offline
Grant checks run per request; revoked grants fail on next decision.

## Privacy, retention, abuse
Privileged reads emit `aud_` records with IDs and purpose only (CTR-CAP-001 R08).

## Observability & budgets
Count of privileged reads per week; alert on any read without case reference.

## Tests
- TEST-PS-067-05-01 (unit): matrix rows allow listed actors only.
- TEST-PS-067-05-02 (integration): single operator cannot approve own configuration change (`CAP.SELF_APPROVAL_FORBIDDEN`).
- TEST-PS-067-05-03 (negative): `sys_` adapter cannot call claim attest or cash verify.
- TEST-PS-067-05-04 (integration): non-party receives `SYS.NOT_FOUND`.

## Acceptance criteria
1. Matrix matches implementation (generated test).
2. Dual control enforced for configuration changes.
3. No system principal can verify a cash claim.

## Assumptions & open decisions
- ASSUMPTION: grant expiry 72 h maximum for privileged access.
- D06 (PROVISIONAL, unapproved).
