# PS-027-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_valuation. **Parent:** [mod_valuation SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-027-05.R01 | Only the slot owner may declare a value for that slot (`cyc.propose`, scope `participant`). | MVP |
| PS-027-05.R02 | Snapshot values are readable by participants of the revision only. Non-participants receive `SYS.NOT_FOUND`. | MVP |
| PS-027-05.R03 | Snapshot compute is a `sys` action (`cyc.execute`) with no content read by the `sys` principal beyond values needed for arithmetic. | MVP |
| PS-027-05.R04 | Listing reference lines require `lst.read` by the owning party; a listing the party cannot read yields `VALUE.LISTING_NOT_OWNED`. | MVP |
| PS-027-05.R05 | Moderators see snapshot content only under a `case:` scope with purpose. Operators need dual control (CTR-CAP-001 R07). | MVP |

## Data / schema
Action matrix:

| Principal | Action | Resource | Outcome |
|---|---|---|---|
| user, slot owner | `cyc.propose` | own slot value | ALLOW |
| user, other participant | `cyc.propose` | that slot | DENY → `SYS.FORBIDDEN` |
| user, non-participant | `cyc.read` | snapshot | DENY → `SYS.NOT_FOUND` |
| sys | `cyc.execute` | compute | ALLOW |
| mod, case scope | `cyc.read` | snapshot in `cas_` | ALLOW (grant) |
| ope, single approval | `cyc.read` | snapshot | DENY (dual control) |

## Commands / queries / events
Each command maps to one row above. Decision records hold outcome and reason code only.

## States & transitions
Authorization re-checked at each command. A participant removed by a later revision keeps no access to new snapshots.

## Validation & errors
`SYS.FORBIDDEN` for visible-but-disallowed writes; `SYS.NOT_FOUND` for hidden objects.

## Authorization
Capability IDs: `cyc.propose`, `cyc.read`, `cyc.execute`. No module-specific verbs.

## Failure, idempotency, concurrency, offline
Decision TTL zero for writes and FINANCIAL_EVIDENCE reads (CTR-CAP-001 R09). Revocation effective at next decision.

## Privacy, retention, abuse
Pseudonyms resolve to `acc_` before authorization. Moderator reads create `aud_` records without snapshot content.

## Observability & budgets
Metric `valuation_authz_denials_total{action,code}`. Alert on sustained `SYS.NOT_FOUND` bursts from one principal.

## Tests
- TEST-PS-027-05-01 (negative): each matrix row returns stated outcome.
- TEST-PS-027-05-02 (integration): non-owner cannot declare on another slot.
- TEST-PS-027-05-03 (negative): `lst_` owned by another party returns `VALUE.LISTING_NOT_OWNED`.
- TEST-PS-027-05-04 (integration): operator read without second approver denied.

## Acceptance criteria
1. Matrix tests pass with zero unlisted outcomes.
2. Snapshot never returned in public listing or search responses.
3. Error bodies never reveal snapshot values to non-participants.

## Assumptions & open decisions
- ASSUMPTION: moderator case grants max 72 h (CTR-CAP-001 R06).
- OPEN: whether a dispute counterparty outside the revision may see the valuation basis. See [DECISIONS.md](../../../DECISIONS.md) D03.
