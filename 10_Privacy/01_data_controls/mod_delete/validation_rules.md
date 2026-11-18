# PS-077-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_delete (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-077-02.R01 | `scope` outside the closed enum → `DEL.SCOPE_INVALID` (400) before any lookup. | MVP |
| PS-077-02.R02 | `target_id` must parse as a CTR-ID-001 ID with the prefix matching scope (`prf_`, `lst_`, `msg_`, `att_`; `profile_field` uses `prf_` plus field name from an allowlist). Else `ID.PREFIX_MISMATCH` (400). | MVP |
| PS-077-02.R03 | Target not owned by the actor → `SYS.NOT_FOUND` (CTR-ERR-001 R08), identical to nonexistent target. | MVP |
| PS-077-02.R04 | Account deletion requires authentication age ≤ 10 min (ASSUMPTION); else `DEL.REAUTH_REQUIRED` (401). | MVP |
| PS-077-02.R05 | Request body may not contain `subject_acc_id`; any such field → `SYS.REQUEST_MALFORMED` (400). The subject is taken from the authenticated principal (CTR-CAP-001 R11). | MVP |
| PS-077-02.R06 | `target_id` under active legal hold is accepted but marked held (not rejected) and returns `DEL.FULLY_HELD` (422) only when every target in the request is held. | MVP |

## Data / schema
Validation inputs: `scope` (enum), `target_id` (string, max 30 chars), `reauth_at` (timestamp, account scope only). No free-text field exists; therefore no input values can be echoed (CTR-ERR-001 R07).

## Commands / queries / events
Applies to `privacy.deletion.request` only (PS-077-04). Errors use `details[].field` JSON-pointer paths and `details[].rule` from the registry enum.

## States & transitions
Validation runs before state transitions. Rejected requests create no row and emit no event.

## Validation & errors
| Code | Retryable | Category / HTTP | Rule |
|---|---|---|---|
| DEL.SCOPE_INVALID | false | validation / 400 | R01 |
| DEL.REAUTH_REQUIRED | false | unauthenticated / 401 | R04 (client must re-authenticate) |
| DEL.FULLY_HELD | false | unprocessable_state / 422 | R06 |
| DEL.ALREADY_PENDING | false | conflict / 409 | PS-077-01 R02 duplicate; returns existing `dsr_` in details |
| SYS.NOT_FOUND | false | not_found / 404 | R03 |

## Authorization
Validation runs after authentication and before authorization checks that depend on aggregate state. `self` is the only permitted subject.

## Failure, idempotency, concurrency, offline
Validation is pure and deterministic. Re-validating the same body yields the same result. Offline-queued requests are re-validated on submission; the server result is final.

## Privacy, retention, abuse
Rejected inputs are not logged (CTR-ERR-001 R10). Validation errors contain no echoed values.

## Observability & budgets
`del_validation_rejections_total{rule}`; validation p95 ≤ 20 ms (ASSUMPTION).

## Tests
- TEST-PS-077-02-01 (unit): every rule R01–R06 has one positive and one negative case.
- TEST-PS-077-02-02 (negative): `subject_acc_id` in body is rejected; no row created.

## Acceptance criteria
1. Each rule code appears in CTR-ERR-001 registry with the listed retryable value.
2. No rejected request writes a row or event (verified by TEST-PS-077-02-02).
3. Non-owned target returns a body byte-identical to nonexistent target (TEST-PS-077-02-01).

## Assumptions & open decisions
- ASSUMPTION: 10 min reauth window.
- PROVISIONAL (D07 default): legal-hold exceptions apply to validation outcome in R06.
