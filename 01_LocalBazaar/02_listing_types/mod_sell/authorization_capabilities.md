# PS-006-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_sell. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01–R13), CTR-ID-001, CTR-PRV-001 (R06, R11), CTR-ERR-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-006-05.R01 | Default deny. Each action below is allowed only by the stated relation rule or explicit grant. | MVP |
| PS-006-05.R02 | A buyer can read only their own `prq_` records. An owner can read requests on their own listings. Any other caller gets `SYS.NOT_FOUND`. | MVP |
| PS-006-05.R03 | Only the listing owner can change terms, accept or decline requests, and release a reservation. | MVP |
| PS-006-05.R04 | `sys_` (F09 event consumer) may write only `sell_state`, `quantity_remaining` and `reservation`. Any other field write returns `SYS.FORBIDDEN`. | MVP |
| PS-006-05.R05 | Operators have no read access to `prq_` records or buyer references. Operator access is limited to feature-flag control (F15). | MVP |
| PS-006-05.R06 | Moderator read of `prq_` requires a `case:<cas_>` grant with stated purpose (CTR-CAP-001 R06). | MVP |

## Data / schema
Capability matrix (action = `<resource>.<verb>`):

| Action | Principal | Resource scope | Rule | Outcome |
|---|---|---|---|---|
| lst.update (set_terms) | user (owner) | self, lst_ | owner; sell_state AVAILABLE | ALLOW; else TERMS_LOCKED or SYS.FORBIDDEN |
| lst.propose (request_purchase) | user, non-owner who sees listing | participant-visible lst_ | visible; account not suspended (F12 flag) | ALLOW |
| lst.accept / lst.reject | user (owner) | self, lst_ | owner | ALLOW |
| prq.withdraw | user (buyer, self) or owner (active reservation) | prq_ | participant | ALLOW |
| prq.read | user (buyer self, owner) | prq_ | participant | ALLOW; else SYS.NOT_FOUND |
| prq.read | mod | case:<cas_> | grant with purpose | ALLOW; no grant → SYS.NOT_FOUND |
| lst.execute (record_sale) | sys (F09 consumer) | lst_ with trx_ | writes limited to R04 fields | ALLOW |
| any | ope | prq_ | none by default | DENY → SYS.NOT_FOUND |

Field visibility: `price_minor`, `currency`, `quantity_*`, `sell_state`, `condition`, `pickup_method`, `region_cell` are `public`. `buyer_ref`, `reservation` are `participant`. Fields with no allowing rule are omitted, not returned as null (CTR-CAP-001 R10).

## Validation & errors
Denied actions return `SYS.FORBIDDEN` when the object is visible and `SYS.NOT_FOUND` when it is not (CTR-CAP-001 example table).

## States & transitions
Authorization runs before each transition in [PS-006-03](workflow_state_machine.md).

## Authorization
This file is the authorization definition. Capability IDs (`lst.*`, `prq.*`) follow CTR-CAP-001 R03. No grant to sell records is stored outside CTR-CAP-001 decision records.

## Failure, idempotency, concurrency, offline
Decision cache TTL is zero for all writes and for `prq.read` (CTR-CAP-001 R09). A revoked suspension takes effect at the next decision.

## Privacy, retention, abuse
Decision records store outcome and reason code only (CTR-CAP-001 R13). Moderator access to `prq_` is audited (`aud_`) with resource ID and purpose (CTR-CAP-001 R08).

## Observability & budgets
Count of denied decisions per action, without principal IDs in metric labels.

## Tests
- TEST-PS-006-05-01 (unit): one test per matrix row, including each DENY outcome.
- TEST-PS-006-05-02 (integration): non-owner on an invisible listing receives `SYS.NOT_FOUND` for `lst.update`.
- TEST-PS-006-05-03 (security, negative): `sys_` attempting to write `price_minor` returns `SYS.FORBIDDEN`.
- TEST-PS-006-05-04 (security, negative): operator principal cannot read `prq_` by ID.

## Acceptance criteria
1. Every action in the matrix has an automated allow and deny test.
2. Default deny holds for any action not in the matrix.
3. No `prq_` content is readable by operators or by moderators without a case grant.

## Assumptions & open decisions
- PROVISIONAL (CTR-CAP-001 grant model, unapproved): explicit grants and relation rules as defined.
- ASSUMPTION: "account not suspended" is an F12 flag readable at decision time.
- D10 PROVISIONAL (default: user-controlled keys). Signed owner commands are out of MVP scope.
