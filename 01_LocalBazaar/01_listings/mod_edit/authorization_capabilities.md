# PS-003-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_edit. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01, R04, R05, R09, R10, R12), CTR-ID-001 (`lst_`, `prf_` view rule), CTR-ERR-001 (`SYS.FORBIDDEN`, `SYS.NOT_FOUND`).

**Decision labels:** Grant model PROVISIONAL (ASSUMPTION, unapproved). No grants are issued by this module. Default-deny is required (CTR-CAP-001 R01).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-003-05.R01 | Capabilities: `lst.update` (command), `lst.read` (query). No other capability is declared by this module. | MVP |
| PS-003-05.R02 | Authorization is evaluated on the `acc_` owner. A `prf_` view resolves to its `acc_` first (CTR-CAP-001 R02). | MVP |
| PS-003-05.R03 | Owner relation is derived from `listing.owner_ref` at decision time (CTR-CAP-001 R05). No stored grant. | MVP |
| PS-003-05.R04 | Operators (`ope`) and moderators (`mod`) cannot call `listing.edit`. Moderator changes go through 12_Moderation with its own capability. | MVP |
| PS-003-05.R05 | Decision cache TTL is zero for `lst.update` (CTR-CAP-001 R09). | MVP |

## Data / schema
Relation inputs: `owner_ref` (`acc_`), `state`, `has_open_offers`. Decision records store outcome and reason code only (CTR-CAP-001 R13).

## Commands / queries / events
Capability is checked before any command or query is processed.

## States & transitions
Not applicable. Edits in blocked states are denied by [workflow_state_machine.md](workflow_state_machine.md) after authorization passes.

## Validation & errors
Non-owner denial returns `SYS.FORBIDDEN` if the listing is visible, `SYS.NOT_FOUND` if not (CTR-ERR-001 R08).

## Authorization
| Actor | Action | Resource | Decision |
|---|---|---|---|
| owner (`acc_`) | `lst.update` | own `lst_` | ALLOW |
| owner (`acc_`) | `lst.read` | own `lst_` | ALLOW |
| non-owner, sees listing | `lst.update` | `lst_` | DENY `SYS.FORBIDDEN` |
| non-owner, cannot see | `lst.update` | `lst_` | DENY `SYS.NOT_FOUND` |
| `prf_` of owner | `lst.update` | own `lst_` | ALLOW (resolved to `acc_`) |
| `ope` | `lst.update` | any | DENY |
| `mod` | `lst.update` | `case:cas_` | DENY |
| `sys` | `lst.update` | any | DENY |

Field visibility (CTR-CAP-001 R10): `title`, `description`, `category_id`, `region_cell`, `price`, `currency`, `state`: `public`. `revision`, `updated_at`, `has_open_offers`: `owner`.

## Failure, idempotency, concurrency, offline
Denials are not retried. A revoked owner relation (for example after account deletion) denies at the next decision. Offline queued edits are rejected at commit (CTR-CAP-001 interoperability note).

## Privacy, retention, abuse
Denial reasons do not reveal whether a listing exists beyond CTR-ERR-001 R08. See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Count denials by code. No actor or listing IDs as metric labels. See [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-003-05-01 (unit): every row of the authorization table.
- TEST-PS-003-05-02 (integration): `prf_` view of the owner can edit; another `acc_` cannot.
- TEST-PS-003-05-03 (negative): `ope` and `mod` edit attempts denied and logged without content.
- TEST-PS-003-05-04 (security): non-visible listing returns identical response to nonexistent listing.

## Acceptance criteria
1. Default-deny holds: no path to `listing.edit` without owner relation.
2. Authorization table matches tests.
3. No operator or moderator path to edit exists.

## Assumptions & open decisions
- ASSUMPTION: owner relation derived from `owner_ref`; `owner_ref` ownership rules owned by mod_create.
- Grant model PROVISIONAL (ASSUMPTION, unapproved; CTR-CAP-001).
- D10 (PROVISIONAL, Dxx default, unapproved): user-controlled keys govern the `acc_` identity this rule depends on.
