# PS-095-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_abuse (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-095-05.R01 | Capabilities used: `finding.read`, `abuse.scan`, `abuse.moderate`, `account.restrict`, `abuse.govern`. | MVP |
| PS-095-05.R02 | Review queue exposes category, severity and rule only. Matched text is reachable only under case grant and purpose `abuse_review`. | MVP |
| PS-095-05.R03 | Governance (`abuse.govern`) needs two `ope` principals who are not on the rule's test fixtures as authors. | MVP |
| PS-095-05.R04 | Scanner `sys_` may scan and record findings; it may not review, restrict or read matched text. | MVP |

## Action matrix
| Principal | Action | Resource | Outcome |
|---|---|---|---|
| sys (scanner) | abuse.scan | source in scope | ALLOW |
| sys (scanner) | abuse.moderate | any | DENY → `SYS.FORBIDDEN` |
| mod (triage grant) | abuse.moderate | open finding | ALLOW |
| mod (no case grant) | finding.read (text) | any | DENY → `SYS.NOT_FOUND` |
| mod (case grant) | finding.read (text) | finding in `cas_` | ALLOW (purpose `abuse_review`) |
| mod | account.restrict | acc_ > 7 days | DENY without ope co-approval, `CAP.DUAL_APPROVAL_REQUIRED` |
| ope (two) | abuse.govern | rule bundle | ALLOW |
| user (subject) | finding.read | own finding | DENY → `SYS.NOT_FOUND` |

## Data / schema
`match_digest` = `never`. `subject_ref`, `reviewer_ref` = `case`. Reporter-misuse counters = `ope` aggregate only.

## Validation & errors
`CAP.SCOPE_INVALID`, `CAP.DUAL_APPROVAL_REQUIRED`, `CAP.SELF_APPROVAL_FORBIDDEN`.

## Authorization (this module)
Default deny. Rule authors cannot approve their own rules.

## Failure, idempotency, concurrency, offline
Decision store down → deny. Scanner grants are short-lived service credentials (F16).

## Privacy, retention, abuse
Text access is logged in `aud_` with finding ID and purpose. Repeated denials from one `mod` raise a CAP alert.

## Observability & budgets
`abuse_authz_denials_total`; alert on any `mod` text read outside an active case.

## Tests
- TEST-PS-095-05-01 (matrix): every row returns stated outcome.
- TEST-PS-095-05-02 (scanner): scanner principal denied on review and restrict endpoints.
- TEST-PS-095-05-03 (governance): one ope approving a rule bundle → `CAP.DUAL_APPROVAL_REQUIRED`.

## Acceptance criteria
1. Matched text unreachable without case grant (TEST-01).
2. Subject cannot see findings about self (TEST-02 identical 404).

## Assumptions & open decisions
- OPEN: purpose registry (F16).
- ASSUMPTION: grants for text access capped at 72 h.
