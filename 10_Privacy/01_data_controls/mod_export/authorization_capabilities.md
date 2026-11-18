# PS-078-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_export (Privacy Lead, F10; review F16). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01–R13), CTR-PRV-001 (owner export matrix, R11), CTR-ERR-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-078-05.R01 | Capability `privacy_export.create` and `privacy_export.read` with scope `self`. | MVP |
| PS-078-05.R02 | Export includes only the subject's own records; counterparty fields are replaced by per-export pseudonyms (PS-078-07 R03). | MVP |
| PS-078-05.R03 | Download token is a bearer secret valid for one full download; possession of the `acc_` session alone is not sufficient to download when the token is missing (token is required on every download request). | MVP |
| PS-078-05.R04 | Operators cannot create or download a subject's export in MVP. Legal-request exports are Future scope, requiring dual control (CTR-CAP-001 R07). | MVP |
| PS-078-05.R05 | `sys_` generator grant: `privacy_export.generate`, scope `global`, purpose `subject_export`, expires ≤ 72 h. | MVP |
| PS-078-05.R06 | Audit `aud_` record per download with `dsr_` ID and decision ID; no content. | MVP |

## Data / schema
Grant references `grt_`; decision records `dec_` outcome only.

## Commands / queries / events
Request and get → `privacy_export.create`/`read`; download → `privacy_export.read` plus token; generate → `privacy_export.generate`.

## States & transitions
Not state-dependent except download, which requires state `ready` or `downloaded`.

## Validation & errors
Unauthorized object → `SYS.NOT_FOUND`; visible but denied → `SYS.FORBIDDEN`.

## Authorization
| Actor | request | get | download | generate |
|---|---|---|---|---|
| subject acc_ | self | self | self + token | no |
| other acc_ | no | no | no | no |
| ope_ | no (MVP) | no | no | no |
| sys_ generator | no | no | no | global, purpose-bound |

## Failure, idempotency, concurrency, offline
Decision cache TTL zero for download and PRIVATE-class reads (CTR-CAP-001 R09).

## Privacy, retention, abuse
Download event retention RET-AUD. Session revocation after download does not revoke the token; token is single-use.

## Observability & budgets
`export_authz_denied_total{actor_type}`; any `ope_` access attempt alerts.

## Tests
- TEST-PS-078-05-01 (negative): other `acc_` requesting a download of another subject's `dsr_` → `SYS.NOT_FOUND`.
- TEST-PS-078-05-02 (negative): valid session without token → `SYS.UNAUTHENTICATED`.

## Acceptance criteria
1. Matrix enforced deny-by-default.
2. Negative tests pass.
3. No operator path exists in MVP build (route audit).

## Assumptions & open decisions
- ASSUMPTION: generator grant ≤ 72 h.
- PROVISIONAL (D10 default): user-controlled keys for package encryption and recovery documented before first release.
