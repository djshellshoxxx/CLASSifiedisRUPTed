# PS-035-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_reserve. **Parent:** [mod_reserve SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-035-05.R01 | Only the seller of `auc_` may set or lower its reserve (`auc.update`, scope `self`). | MVP |
| PS-035-05.R02 | Reserve value is visible to the seller only (field visibility `owner`); never `public`, `participant` or `case`, except operator dual-control case reads. | MVP |
| PS-035-05.R03 | Bidders and the public see `reserve_status` only. | MVP |
| PS-035-05.R04 | System comparison at bid acceptance is a `sys` action (`auc.execute`) that reads the value and writes only `reserve_state`. | MVP |
| PS-035-05.R05 | Operator access to reserve value requires `case:` scope and dual control (CTR-CAP-001 R06, R07). | MVP |

## Data / schema
Action matrix:

| Principal | Action | Resource | Outcome |
|---|---|---|---|
| user, seller | `auc.update` | own reserve | ALLOW (self) |
| user, other seller | `auc.update` | reserve | DENY → `SYS.NOT_FOUND` |
| user, bidder | `auc.read` | reserve value | DENY (field `never`) |
| user, anyone | `auc.read` | reserve_status | ALLOW (public) |
| sys | `auc.execute` | comparison | ALLOW (writes `reserve_state` only) |
| ope, single approval | `auc.read` | reserve value | DENY (dual control) |
| mod, case scope | `auc.read` | reserve value | ALLOW (grant, purpose required) |

## Commands / queries / events
Each command maps to a row above. Decision records hold outcome and reason only.

## States & transitions
Authorization re-checked per command. Seller loses edit right when auction closes.

## Validation & errors
`SYS.FORBIDDEN` for visible-but-disallowed; `SYS.NOT_FOUND` for hidden.

## Authorization
Capability IDs: `auc.update`, `auc.read`, `auc.execute`.

## Failure, idempotency, concurrency, offline
Decision TTL zero for writes and for reserve value reads (CTR-CAP-001 R09).

## Privacy, retention, abuse
Field-level rules prevent reserve leakage through API, events, logs and exports. Moderator reads create `aud_` with purpose and decision ID, no value.

## Observability & budgets
Metric `reserve_authz_denials_total{action,code}`. Alert on repeated `auc.read` denials for reserve by one principal (probing).

## Tests
- TEST-PS-035-05-01 (negative): each matrix row returns stated outcome.
- TEST-PS-035-05-02 (negative): bidder API read of reserve value returns no value field.
- TEST-PS-035-05-03 (negative): non-seller `reserve.set` returns `SYS.NOT_FOUND`.
- TEST-PS-035-05-04 (integration): operator read denied without second approver.

## Acceptance criteria
1. Matrix tests pass with zero unlisted outcomes.
2. Reserve value absent from all non-seller responses (automated scan).
3. Audit record for every privileged read contains no value.

## Assumptions & open decisions
- ASSUMPTION: moderator case grants max 72 h.
- OPEN: whether the reserve status should be `NOT_MET` or hidden before the first bid. See [DECISIONS.md](../../../DECISIONS.md) D10.
