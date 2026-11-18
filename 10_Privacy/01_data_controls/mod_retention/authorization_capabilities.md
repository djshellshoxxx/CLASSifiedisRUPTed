# PS-079-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_retention (Privacy Lead, F10; review F16 Security Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R04 case scope, R06 privileged grants, R07 dual control, R08 audit), CTR-PRV-001 (R07 hold scope), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-079-05.R01 | `retention_policy.publish` and `activate`: global scope, F10 approval record required; no single principal can both propose and approve (CAP.SELF_APPROVAL_FORBIDDEN). | MVP |
| PS-079-05.R02 | `retention_hold.apply` and `release`: `case:<cas_>` scope, dual control with two distinct `ope_` or `mod_` approvers (CTR-CAP-001 R07). | MVP |
| PS-079-05.R03 | Hold grant carries `constraints.purpose` (coded), `expires_at` ≤ 72 h after `not_before` (CTR-CAP-001 R06); hold lifetime is separate (PS-079-02 R03). | MVP |
| PS-079-05.R04 | Sweep uses `sys_` grant `retention.sweep` with scope `global` and purpose `retention_enforcement`; cannot read record content. | MVP |
| PS-079-05.R05 | Operators cannot read PRIVATE_PERSONAL content through hold tooling; hold tooling shows counts only. | MVP |
| PS-079-05.R06 | Every apply, release, publish and sweep emits an `aud_` record and a CTR-EVT-001 event (CTR-CAP-001 R08). | MVP |

## Data / schema
Grant references `grt_`; decisions `dec_` with reason codes.

## Commands / queries / events
Map: policy.* → `retention_policy.publish`/`activate`; hold.* → `retention_hold.apply`/`release`; sweep → `retention.sweep`.

## States & transitions
Authorization per command; hold release requires hold in `applied`.

## Validation & errors
Unauthorized and invisible → `SYS.NOT_FOUND`; visible denied → `SYS.FORBIDDEN`.

## Authorization
| Actor | publish/activate | hold apply/release | sweep | read counts |
|---|---|---|---|---|
| F10 approver ope_ | approve (not propose) | approve | no | yes |
| ope_ case operator | no | propose (case scope) | no | case scope |
| sys_ scheduler | activate at effective_from | no | global, purpose-bound | global |
| subject acc_ | no | no | no | no |

## Failure, idempotency, concurrency, offline
Revocation of an operator grant does not release existing holds; release requires dual control.

## Privacy, retention, abuse
Audit records RET-AUD. Hold tooling denies content read (R05).

## Observability & budgets
Alert on any hold applied without two approvers (should be impossible; detection test).

## Tests
- TEST-PS-079-05-01 (negative): proposer approving own hold → CAP.SELF_APPROVAL_FORBIDDEN.
- TEST-PS-079-05-02 (negative): sweep grant attempting content read → SYS.FORBIDDEN.

## Acceptance criteria
1. Matrix enforced deny-by-default.
2. Dual control tested for apply and release.
3. Audit records present for each privileged action (sample audit).

## Assumptions & open decisions
- ASSUMPTION: grant ≤ 72 h.
- PROVISIONAL (D07 default).
- OPEN (R07): whether hold existence can be disclosed to the subject.
