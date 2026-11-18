# PS-094-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_flags (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-094-05.R01 | Capabilities used: `rpt.create`, `rpt.read`, `rpt.withdraw`, `rpt.triage`, `rpt.link_case`. | MVP |
| PS-094-05.R02 | Triage queue grant (`rpt.triage`, scope `global`, purpose `report_triage`) exposes no content and no reporter identity. | MVP |
| PS-094-05.R03 | Case access to `reporter_ref` and `detail_text` requires a `case` grant (CTR-CAP-001 R06). | MVP |
| PS-094-05.R04 | A reporter can read only their own report status; reported party and target owner get outcome notices, never reporter identity. | MVP |

## Action matrix
| Principal | Action | Resource | Outcome |
|---|---|---|---|
| user (not restricted) | rpt.create | visible target | ALLOW |
| user (restricted) | rpt.create | any | DENY → `FLG.REPORTING_RESTRICTED` |
| user (owner of target) | rpt.create | own target | DENY → `FLG.SELF_REPORT_FORBIDDEN` |
| user (reporter) | rpt.withdraw | own report, queued | ALLOW (relation) |
| user (reporter) | rpt.read | other report | DENY → `SYS.NOT_FOUND` |
| user (target owner) | rpt.read | report on own target | DENY → `SYS.NOT_FOUND` |
| mod (triage grant) | rpt.triage | queued report | ALLOW (grant) |
| mod (no grant) | rpt.triage | any | DENY → `SYS.FORBIDDEN` |
| mod (case grant) | rpt.read | report in `cas_` | ALLOW (grant, purpose `moderation_case_review`) |
| ope | rpt.read | any content | DENY (dual control, CTR-CAP-001 R07) |

## Data / schema
Field visibility: `reporter_ref`, `detail_text`, `target_owner_ref`, `weight` = `case`; `status` = `participant`/`owner` coarse only; `dedupe_hmac` = `never`.

## Validation & errors
`CAP.SCOPE_INVALID`, `CAP.EXPIRY_REQUIRED` for triage grants above 72 h.

## Authorization (this module)
Default deny. Self-triage of own report by mod is forbidden (`CAP.SELF_APPROVAL_FORBIDDEN` on any approval path).

## Failure, idempotency, concurrency, offline
Authorization is re-checked at commit for offline withdraws (CTR-CAP-001). Decision store down → `SYS.UNAVAILABLE`.

## Privacy, retention, abuse
Triage queue access logs `aud_` by queue query, not by row. Bulk status queries limited to own reports.

## Observability & budgets
`flags_authz_denials_total{action,reason_code}`; alert on single principal > 50 denials/h (ASSUMPTION).

## Tests
- TEST-PS-094-05-01 (matrix): each action-matrix row returns the stated outcome.
- TEST-PS-094-05-02 (negative): target owner cannot discover reporter by timing or ID guessing (identical 404).
- TEST-PS-094-05-03 (scope): triage queue response contains no `detail_text` or `reporter_ref`.

## Acceptance criteria
1. No role outside the matrix can read reporter identity.
2. Restricted reporters are blocked at commit as well as at submit.

## Assumptions & open decisions
- ASSUMPTION: triage queue is `global` scope with no content; this is the one `global` grant the module needs.
- OPEN: purpose registry values (F16).
- PROVISIONAL (D10 default, unapproved): account recovery does not reset report history.
