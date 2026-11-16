# PS-002-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_create. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (action vocabulary, relation rules, decisions, field visibility), CTR-ID-001 (principal IDs), CTR-ERR-001 (denial codes).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-002-05.R01 | Action is `lst.create`, scope `self`. Allowed only for a `user` principal (`acc_`) in good standing. | MVP |
| PS-002-05.R02 | Authorization is evaluated on `acc_`. A `prf_` session creates only as its owning `acc_` (CTR-CAP-001 R02). | MVP |
| PS-002-05.R03 | No grant is needed for create. The owner relation is derived from the authenticated principal (CTR-CAP-001 R05). | MVP |
| PS-002-05.R04 | `sys`, `fpr`, `ope` and `mod` principals cannot create listings in MVP, including on behalf of a user. | MVP |
| PS-002-05.R05 | Operators and support cannot create, edit or read another user's draft through this module (CTR-CAP-001 R12). | MVP |
| PS-002-05.R06 | Every draft field has field visibility `owner`. Non-owners get `SYS.NOT_FOUND` for the draft ID (CTR-CAP-001 R10, R04). | MVP |
| PS-002-05.R07 | Each DENY writes a `dec_` record with reason code and no content (CTR-CAP-001 R13). | MVP |

## Data / schema
Action `lst.create`. Decision record fields per CTR-CAP-001. No grant record is created.

## Commands / queries / events
Authorization is checked before `listing.create` reads the body. No event is emitted for ALLOW (not a privileged decision, CTR-CAP-001 R08).

## States & transitions
Not applicable. Account eligibility comes from F07.

## Validation & errors
| Case | Outcome | Reason code | Error |
|---|---|---|---|
| Owner in good standing | ALLOW | ALLOW_OWNER | — |
| Account suspended, or recovery in progress (F07 state) | DENY | STATE_FORBIDS | `LST.ACCOUNT_NOT_ELIGIBLE` (403) |
| `sys`, `fpr`, `ope` or `mod` principal | DENY | NO_RELATION | `SYS.FORBIDDEN` (403) |
| No session | DENY | — | `SYS.UNAUTHENTICATED` (401) |
| Body includes `owner_ref` | Body key ignored for authz; rejected by PS-002-02 R03 | — | `SYS.REQUEST_MALFORMED` |

## Authorization
Actions: `lst.create` (owner, self). Capability IDs: `lst.create`. No `grt_` grants are issued for this module.

## Failure, idempotency, concurrency, offline
Clients never decide authorization. A queued create is re-authorized at commit. If the account became ineligible while offline, the commit is denied with `LST.ACCOUNT_NOT_ELIGIBLE` and the entry is marked `not_applied` (PS-002-06). Decisions fail closed: F07 or F16 unavailable gives `SYS.UNAVAILABLE` (retryable).

## Privacy, retention, abuse
Denial records hold no draft content. Repeated DENY from one principal feeds CTR-CAP-001 alerts (BT-01). Dual control does not apply: create touches no PRIVATE_PERSONAL, FINANCIAL_EVIDENCE or LOCATION_PRECISE data.

## Observability & budgets
Metric `authz_decisions_total{action="lst.create",outcome,reason_code}`. Decision p95 ≤ 5 ms (CTR-CAP-001 budget).

## Tests
- TEST-PS-002-05-01 (matrix): each row in the Validation table gives the stated outcome, reason and error.
- TEST-PS-002-05-02 (negative): `sys`, `fpr`, `ope`, `mod` and anonymous callers cannot create; a `prf_` session creates under its `acc_` only.
- TEST-PS-002-05-03 (negative): a non-owner GET of a draft ID returns a body identical to a nonexistent ID except `request_id`.

## Acceptance criteria
1. `lst.create` is the only capability this module uses.
2. The matrix in TEST-PS-002-05-01 passes with zero unexpected ALLOW.
3. No operator path creates or edits drafts (TEST-PS-002-05-02).
4. TEST-PS-002-05-01 to -03 pass in CI.

## Assumptions & open decisions
- PROVISIONAL (ASSUMPTION grant model, unapproved): owner relation rule without grants, per CTR-CAP-001.
- OPEN (F07 and F12): whether a suspended account may keep reading its own drafts. This spec assumes reads are allowed and creates are denied.
- ASSUMPTION: no operator override creates listings for a user.
