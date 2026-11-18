# PS-083-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-FED-001 (R01, peer scopes).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-083-05.R01 | Only the item owner (`acc_`) may create a bundle for their items (`item.export`, scope self). | MVP |
| PS-083-05.R02 | Only peers in state `trusted` may import; `restricted` peers may send but not import portable bundles (ASSUMPTION). | MVP |
| PS-083-05.R03 | Operators cannot create bundles of other users' items, even with `ope` grants (CTR-CAP-001 R06). | MVP |
| PS-083-05.R04 | Default deny for all undeclared actions. | MVP |

## Data / schema
Capabilities: `item.export`, `evt.import`, `bundle.verify`.

## Commands / queries / events
[commands_queries_events.md](commands_queries_events.md).

## States & transitions
Peer state read from CTR-FED-001 peer lifecycle; authorization does not change state.

## Validation & errors
`SYS.FORBIDDEN` for owner-visible objects; `SYS.NOT_FOUND` otherwise. Quarantined peer → `FED.PEER_NOT_TRUSTED`.

## Authorization
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| owner | item.export | own items (federate=true) | ALLOW (owner) |
| owner | item.export | item with federate=false | DENY, PORTABLE.ITEM_NOT_FEDERATED |
| trusted peer | evt.import | bundle for its audience | ALLOW (peer scope) |
| quarantined peer | evt.import | any | DENY, FED.PEER_NOT_TRUSTED |
| ope | item.export | other user's item | DENY, SYS.NOT_FOUND |

## Failure, idempotency, concurrency, offline
Decision fails closed. Offline clients never create signed bundles.

## Privacy, retention, abuse
Each export and import writes an `aud_` record (CTR-CAP-001 R08).

## Observability & budgets
Metric `portable_authz_denies_total{action,reason}`.

## Tests
- TEST-PS-083-05-01 (matrix): table outcomes.
- TEST-PS-083-05-02 (peer): quarantined peer import denied.
- TEST-PS-083-05-03 (operator): ope export of another user's item denied.

## Acceptance criteria
1. Matrix passes.
2. Operators cannot export others' items.
3. Quarantine denies imports immediately.

## Assumptions & open decisions
- ASSUMPTION: restricted peers cannot import portable bundles.
- PROVISIONAL (CTR-CAP-001 default, unapproved).
