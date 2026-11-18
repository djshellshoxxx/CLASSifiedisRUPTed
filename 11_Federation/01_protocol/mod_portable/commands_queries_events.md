# PS-083-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (Commands section), CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-083-04.R01 | `portable.create_bundle` requires `idempotency_key` and `audience`. | MVP |
| PS-083-04.R02 | `portable.import_bundle` is idempotent per `(origin_node, bundle_id)`. | MVP |
| PS-083-04.R03 | Events: `bundle.created`, `bundle.delivered`, `bundle.imported`, `bundle.rejected`, `bundle.expired`, `bundle.revoked`. | MVP |

## Data / schema
Schemas `bundle.*@1.0.0` registered per CTR-SCH-001. Fields in [domain_schema.md](domain_schema.md).

| Command | Actor | Event | Errors |
|---|---|---|---|
| portable.create_bundle | item owner | bundle.created | CLASS_NOT_EXPORTABLE, ITEM_NOT_FEDERATED, AUDIENCE_REQUIRED |
| portable.verify_bundle | peer or owner | none (dry run) | FED.SIGNATURE_INVALID, FED.KEY_REVOKED |
| portable.import_bundle | trusted peer | bundle.imported / bundle.rejected | FED.* codes, BUNDLE_EXPIRED |

## States & transitions
Per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
[validation_rules.md](validation_rules.md); CTR-ERR-001 envelope.

## Authorization
[authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Same key and digest return original; different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Each event increments aggregate revision (CTR-EVT-001 R02).

## Privacy, retention, abuse
Events carry bundle ID, counts and codes. No item payload in events.

## Observability & budgets
Events per type; consumer lag ≤ 60 s (ASSUMPTION).

## Tests
- TEST-PS-083-04-01 (contract): each event validates.
- TEST-PS-083-04-02 (idempotency): duplicate import yields one `bundle.imported`.
- TEST-PS-083-04-03 (contract): `bundle.rejected` carries code only, no payload.

## Acceptance criteria
1. Command/event table complete.
2. Duplicate import is a no-op.
3. Rejection events hold no content.

## Assumptions & open decisions
- ASSUMPTION: 60 s lag.
- PENDING: consumers listed in DEPENDENCY_MATRIX.md.
