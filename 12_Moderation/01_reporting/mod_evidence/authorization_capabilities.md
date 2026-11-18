# PS-093-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_evidence (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-093-05.R01 | Capabilities used: `evidence.create`, `evidence.read`, `evidence.redact`, `evidence.legal_hold`, `evidence.export`. No others. | MVP |
| PS-093-05.R02 | Content reads require a `mod` grant with `case` scope, `purpose` = `moderation_case_review`, `expires_at` ≤ 72 h. | MVP |
| PS-093-05.R03 | Legal-hold application requires two distinct `ope` approvers (CTR-CAP-001 R07). | MVP |
| PS-093-05.R04 | Reported party and counterparties have no `evidence.read` on any evidence about them. | MVP |
| PS-093-05.R05 | Each content read writes an `aud_` record with `mev_` ID, purpose and decision ID; no content. | MVP |

## Action matrix
| Principal | Action | Resource | Outcome |
|---|---|---|---|
| user (reporter) | evidence.create | own open report | ALLOW (relation: owner of report) |
| user (reporter) | evidence.read | own evidence | DENY → `SYS.NOT_FOUND` after submission (receipt only) |
| user (reported party / counterparty) | evidence.read | any | DENY → `SYS.NOT_FOUND` |
| mod (case grant) | evidence.read | `mev_` in `cas_` | ALLOW (grant, PS-093-05 R02) |
| mod (no grant) | evidence.read | `mev_` | DENY → `SYS.NOT_FOUND` |
| mod (case grant) | evidence.redact | `mev_` in `cas_` | ALLOW (grant with redact capability) |
| ope (single) | evidence.legal_hold | any | DENY, `CAP.DUAL_APPROVAL_REQUIRED` |
| ope (dual) | evidence.legal_hold | `mev_` | ALLOW (grant) |
| sys | evidence.export | any | DENY unless signed legal-process ticket (PS-093-10) |

## Data / schema
Grant `subject.kind` ∈ {mod, ope}. `constraints.purpose` value from F16 registry (OPEN). Field visibility: `captured_by` = `case`; `content_key_ref` = `never`.

## Validation & errors
`CAP.SCOPE_INVALID`, `CAP.EXPIRY_REQUIRED`, `CAP.DUAL_APPROVAL_REQUIRED`, `CAP.SELF_APPROVAL_FORBIDDEN` (CTR-CAP-001).

## States & transitions
Grant lifecycle per CTR-CAP-001; expiry ends content access within 60 s for derived tokens (CTR-CAP-001 R09).

## Authorization (this module)
Default deny. A `mod` principal cannot grant itself case access (`CAP.SELF_APPROVAL_FORBIDDEN`).

## Failure, idempotency, concurrency, offline
Decision store down → DENY with `SYS.UNAVAILABLE`. Offline clients never read content.

## Privacy, retention, abuse
Repeated `evidence.read` denials from one principal raise a CAP alert (CTR-CAP-001 abuse controls). Bulk list counts include only visible items.

## Observability & budgets
`evidence_reads_total{purpose,outcome}`; alert on content read outside active case.

## Tests
- TEST-PS-093-05-01 (matrix): every row of the action matrix returns the stated outcome and code.
- TEST-PS-093-05-02 (negative): guessed `mev_` IDs of other reports return identical `SYS.NOT_FOUND` bodies.
- TEST-PS-093-05-03 (privileged): read with expired grant → DENY; read in valid case → ALLOW plus `aud_`.

## Acceptance criteria
1. No role outside the matrix can read content.
2. Dual control enforced for legal hold (TEST-02).

## Assumptions & open decisions
- ASSUMPTION: 72 h maximum grant (CTR-CAP-001).
- OPEN: purpose registry values (F16).
- PROVISIONAL (D10 default, unapproved): recovery of a reporter account does not restore access to evidence it captured.
