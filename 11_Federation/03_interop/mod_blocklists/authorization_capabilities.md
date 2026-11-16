# PS-089-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_blocklists. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (model, verbs, dual control, grants), CTR-FED-001 (peer scopes), CTR-PRV-001 (field visibility), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-089-05.R01 | Default deny for every `blk.*` action (CTR-CAP-001 R01). Unknown capability → `CAP.UNKNOWN_CAPABILITY`. | MVP |
| PS-089-05.R02 | Module vocabulary: `blk.read`, `blk.propose`, `blk.accept`, `blk.withdraw`, `blk.export`, `blk.rollback`, `blk.administer`. Verbs per CTR-CAP-001 R03. | MVP |
| PS-089-05.R03 | Proposer, approver and grant subject are distinct principals. Federate activation and batch rollback require two distinct `ope_` approvers (ASSUMPTION). | MVP |
| PS-089-05.R04 | `fpr_` peers hold no `blk.*` capability. Their imports only create `proposed` entries through CTR-FED-001 ingress. | MVP |
| PS-089-05.R05 | End-user `acc_` principals hold no `blk.*` capability. Entries never expose end-user identity. | MVP |

## Data / schema
Capability grants use CTR-CAP-001 grant schema. Privileged grants (`mod` case scope, `ope` or `sys` global) require `purpose`, `expires_at` ≤ 72 h after `not_before`, and `case_id` for case scope (CTR-CAP-001 R06). Mod purpose value: `blocklist_case_review` (PENDING F16 purpose registry).

## Commands / queries / events
Grant lifecycle events are CTR-CAP-001 events. Module commands are in PS-089-04.

## States & transitions
Grant states per CTR-CAP-001 (`active`, `revoked`, `expired`).

## Validation & errors
Reuse CTR-CAP-001 codes only: `SYS.FORBIDDEN`, `SYS.NOT_FOUND`, `CAP.SELF_APPROVAL_FORBIDDEN`, `CAP.DUAL_APPROVAL_REQUIRED`, `CAP.UNKNOWN_CAPABILITY`. No module-specific auth codes.

## Authorization
| Principal | Action | Resource | Outcome |
|---|---|---|---|
| mod (case grant) | `blk.propose` | local entry sourced from held `cas_` | ALLOW |
| mod (case grant) | `blk.propose` | federate scope | DENY, `SYS.FORBIDDEN` (ope required) |
| mod (case grant) | `blk.read` | entries sourced from held `cas_` | ALLOW |
| mod | `blk.accept` | any | DENY, `SYS.FORBIDDEN` |
| mod (proposer) | `blk.withdraw` | own entry | ALLOW (participant) |
| ope (single) | `blk.accept` | federate, proposed | DENY, `CAP.DUAL_APPROVAL_REQUIRED` |
| ope (second, distinct) | `blk.accept` | same entry | ALLOW |
| ope (proposer) | `blk.accept` | own entry | DENY, `CAP.SELF_APPROVAL_FORBIDDEN` |
| ope (dual) | `blk.rollback` | `dlv_` | ALLOW |
| sys (exporter) | `blk.export` | active federate entries | ALLOW |
| sys | `blk.accept` | any | DENY, `SYS.FORBIDDEN` |
| fpr (trusted) | import event | peer scope | ALLOW → `proposed` |
| fpr (quarantined) | any | any | DENY, `FED.PEER_NOT_TRUSTED` |
| acc (user) | `blk.read` | any | DENY, `SYS.NOT_FOUND` |

## Failure, idempotency, concurrency, offline
- Grant store or policy store unavailable → DENY with `SYS.UNAVAILABLE` (fail closed, CTR-CAP-001).
- Export job runs under a `sys_` grant renewed per run; expired grant stops export, not enforcement.
- Offline clients make no decisions (CTR-CAP-001).

## Privacy, retention, abuse
Decision records hold outcome and reason code only (CTR-CAP-001 R13). Repeated DENY from one principal raises a CAP alert (BT-01).

## Observability & budgets
`authz_decisions_total{module="blocklists",outcome,reason_code}`. Alert on any `mod` principal with more than 20 DENY per hour (ASSUMPTION).

## Tests
- TEST-PS-089-05-01 (unit): default deny for every `blk.*` action with no grant.
- TEST-PS-089-05-02 (matrix): each row of the authorization table produces stated outcome.
- TEST-PS-089-05-03 (negative): self-approval of own proposal is rejected.
- TEST-PS-089-05-04 (negative): single `ope` cannot activate a federate entry.
- TEST-PS-089-05-05 (integration): quarantined peer import denied at ingress.
- TEST-PS-089-05-06 (integration): user principal receives `SYS.NOT_FOUND` for any entry.

## Acceptance criteria
1. Default deny holds for all `blk.*` actions; TEST-PS-089-05-01 passes.
2. Authorization matrix matches implementation; TEST-PS-089-05-02 passes.
3. Dual control and self-approval rules hold; TEST-PS-089-05-03 and -04 pass.

## Assumptions & open decisions
- ASSUMPTION: dual control for federate activation and rollback (F16 to confirm).
- PENDING F16: purpose registry value `blocklist_case_review`.
- PROVISIONAL (D10 is not applicable to this module; no user keys involved).
