# PS-009-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/03_inventory/mod_variants. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-009-05.R01 | Writes to variants require `lst.update` with scope `self` on the owning listing. No other verb is used. | MVP |
| PS-009-05.R02 | Reads of active variants require `lst.read` on the listing, under the listing's visibility rules. | MVP |
| PS-009-05.R03 | Archived variants are visible to the listing owner only; to others they are omitted from responses (CTR-CAP-001 R10). | MVP |
| PS-009-05.R04 | The availability process (`sys_`) reads active variant IDs under `lst.read` with a purpose constraint. It cannot write variants. | MVP |
| PS-009-05.R05 | No `ope_` or `mod_` principal can edit variant attributes. Moderators act on the listing (`lst.moderate`, case scope). | MVP |

## Data / schema
Authorization inputs: actor (`acc_`, `sys_`, `mod_`), action, resource (`lst_` with optional `var_` sub-resource), scope. No new resource type is registered: PENDING CTR-CAP-001.

## Commands / queries / events
Mapping per operation: add, update, archive → `lst.update`; get → `lst.read`; hide → `lst.moderate` (case scope).

## States & transitions
Not applicable; authorization is evaluated per request (CTR-CAP-001 R05).

## Validation & errors
A non-owner who can see the listing gets `SYS.FORBIDDEN` on write. A non-owner who cannot see the listing gets `SYS.NOT_FOUND` (CTR-CAP-001 example rows).

## Authorization
| Actor | Action | Resource | Result |
|---|---|---|---|
| owner (user) | lst.update | own lst_ | ALLOW |
| other user, can see listing | lst.update | lst_ | DENY SYS.FORBIDDEN |
| other user, cannot see listing | any | lst_ | DENY SYS.NOT_FOUND |
| buyer | lst.read | lst_ (active variants) | ALLOW |
| sys_ availability reader | lst.read | lst_ (purpose: availability) | ALLOW, IDs and status only |
| mod_ with case grant | lst.moderate | cas_ scope | ALLOW (hide listing) |
| ope_ | lst.update | any variant | DENY |

## Failure, idempotency, concurrency, offline
Decision cache TTL zero for writes (CTR-CAP-001 R09). Revocation of a grant takes effect at next decision.

## Privacy, retention, abuse
Every decision on a privileged read writes an `aud_` record; ordinary variant reads do not.

## Observability & budgets
Denied-write count per actor class is emitted without actor IDs (PS-009-08).

## Tests
- TEST-PS-009-05-01 (unit): each row of the authorization table.
- TEST-PS-009-05-02 (integration): archived variant absent from a buyer's response, present for owner.
- TEST-PS-009-05-03 (negative): `sys_` write attempt is denied and recorded as an aud_ record.

## Acceptance criteria
1. Every table row is covered by a test ID.
2. Field omission (not null) confirmed for archived variants.
3. No write path is reachable by `ope_` or `mod_` principals without a listing-level grant.

## Assumptions & open decisions
- ASSUMPTION: availability reads are sys_ principal reads with purpose constraint (CTR-CAP-001 R06).
- PENDING CTR-CAP-001: resource type `variant` sub-scope, if the owner wants one.
- No Dxx decision changes this process; the values above are ASSUMPTION until F15/F16 review.
