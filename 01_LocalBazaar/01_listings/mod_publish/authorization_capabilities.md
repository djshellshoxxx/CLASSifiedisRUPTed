# PS-004-05 — authorization capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_publish. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (model, grants, decision records, field visibility), CTR-ID-001 (`acc_`, `prf_`, `mod_`, `sys_`, `ope_`), CTR-ERR-001. **Pending:** PENDING CTR-MOD-001 (moderation case events; F12).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-004-05.R01 | Default deny. A publish or hold action needs an owner relation (`lst.update`) or an active `cas.moderate` grant. | MVP |
| PS-004-05.R02 | Owner relation is derived from `owner_ref` at decision time (CTR-CAP-001 R05). It is not stored as a grant. | MVP |
| PS-004-05.R03 | Release or rejection of a hold requires `cas.moderate`, `resource.scope = case`, `case_id`, purpose `moderation_case_review`, and `expires_at` ≤ 72 h after `not_before` (CTR-CAP-001 R06). | MVP |
| PS-004-05.R04 | No `ope_` or `global` grant overrides owner publish. Such a request returns SYS.FORBIDDEN. | MVP |
| PS-004-05.R05 | The risk check is an internal call made by the publish command. It runs as `sys_` with no write capability on `lst_`. Only this module writes `state` and `hold`. | MVP |
| PS-004-05.R06 | Owner sees `hold.reason_code` and `placed_at`. Case ID and moderator identity are visible only under case scope. | MVP |

## Capability use
| Action | Used by | Notes |
|---|---|---|
| `lst.update` | owner (`lst.publish`, `lst.get_publish_state`) | No `publish` verb exists in CTR-CAP-001 R03. ASSUMPTION: reuse `lst.update` with the state gate V5. |
| `cas.moderate` | `mod_` with case grant (T3, T4) | Resource type `listing`, scope `case`. |

## Decision matrix (normative for this module)
| Principal | Action | Resource | Outcome | reason_code |
|---|---|---|---|---|
| user (owner) | `lst.update` | own draft | ALLOW | ALLOW_OWNER |
| user (owner) | `lst.update` | own held listing | DENY, PUB.HOLD_ACTIVE | STATE_FORBIDS |
| user (non-owner, sees listing) | `lst.update` | published listing | DENY, SYS.FORBIDDEN | NO_RELATION |
| user (non-owner, cannot see) | `lst.update` | draft listing | DENY, SYS.NOT_FOUND | NO_RELATION |
| mod (case grant active) | `cas.moderate` | held listing in case | ALLOW | ALLOW_GRANT |
| mod (no grant) | `cas.moderate` | listing | DENY, SYS.NOT_FOUND | NO_GRANT |
| mod (grant expired) | `cas.moderate` | listing | DENY, SYS.NOT_FOUND | GRANT_EXPIRED |
| ope (any) | `lst.update` | another owner's listing | DENY, SYS.FORBIDDEN | NO_RELATION |
| sys (risk check) | `lst.update` | any | DENY, SYS.FORBIDDEN | NO_GRANT |

## Field visibility (CTR-CAP-001 R10)
| Field | owner | case | public |
|---|---|---|---|
| `state`, `revision`, `listing_kind`, `title`, `price`, `region_cell`, `published_at`, `expires_at` | yes | yes | published only |
| `owner_ref` | acc_ | acc_ | prf_ view only |
| `hold.reason_code`, `hold.placed_at` | yes | yes | never |
| `case_id`, moderator identity | never | yes | never |

## Privileged grants
Hold release: subject `mod_`, capability `cas.moderate`, scope `case`, `case_id` required, purpose `moderation_case_review`, `max_uses` = 1 for T3 or T4 (ASSUMPTION). Dual approval for rejection of `policy_violation` cases is OPEN (F12).

## Errors
PUB.HOLD_ACTIVE, PUB.INVALID_STATE, PUB.ACCOUNT_RESTRICTED, SYS.FORBIDDEN, SYS.NOT_FOUND; CAP.EXPIRY_REQUIRED, CAP.GRANT_NOT_ACTIVE from CTR-CAP-001.

## Assumptions & open decisions
- ASSUMPTION: `lst.update` covers publish until CTR-CAP-001 adds a verb (MINOR change).
- PROVISIONAL (D10 default, unapproved): owner authority follows the user-controlled account key; recovery cannot transfer listing ownership without the recovery proof (CTR-CAP-001 R12).
- OPEN: dual approval for hold rejection (F12).

## Tests
- TEST-PS-004-05-01 (matrix): every row of the decision matrix returns the stated outcome and code.
- TEST-PS-004-05-02 (negative): guessed listing IDs and cross-user IDs return identical SYS.NOT_FOUND or SYS.FORBIDDEN per visibility.
- TEST-PS-004-05-03 (privileged): moderator grant without `case_id`, or expiry beyond 72 h, is rejected.
- TEST-PS-004-05-04 (field): non-owner response omits `hold` and `owner_ref` as `acc_`.

## Acceptance criteria
1. TEST-PS-004-05-01 to -04 pass in CI.
2. No operator or sys principal can write `state` directly (static check on write paths).
