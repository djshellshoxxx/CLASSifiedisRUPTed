# PS-084-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_records. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02), CTR-SCH-001 (R10).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-084-03.R01 | Item federate flag: off → on (owner opt-in) → off (owner withdraw). | MVP |
| PS-084-03.R02 | Withdrawal stops future export immediately and triggers peer-side tombstone only if the item is deleted. | MVP |
| PS-084-03.R03 | Registry row: proposed → active → deprecated → retired. Retirement requires no live federated items of that type. | MVP |

## Data / schema
States in `federate` and registry `status` per [domain_schema.md](domain_schema.md).

## Commands / queries / events
`records.set_federate` → `record.federate_enabled` / `record.federate_disabled`; `record_type.registered`, `record_type.deprecated`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| off | records.set_federate(true) | PS-084-02 passes | on | item eligible for bundles |
| on | records.set_federate(false) | none | off | stop queued exports; emit event |
| proposed | registry.activate | F10 review record (if class raised) | active | none |
| active | registry.deprecate | replacement type named | deprecated | notify owners |
| deprecated | registry.retire | no live federated items | retired | none |

## Validation & errors
`RECORDS.INVALID_TRANSITION` (409).

## Authorization
Item owner: flag changes. Platform Lead: registry changes. Privacy Lead: class review.

## Failure, idempotency, concurrency, offline
Flag changes idempotent per (item, revision). Offline changes apply only on ack.

## Privacy, retention, abuse
Transitions carry IDs only.

## Observability & budgets
Gauges per registry status; count of items federated per type.

## Tests
- TEST-PS-084-03-01 (state): table rows pass.
- TEST-PS-084-03-02 (withdrawal): flag off stops bundling in next build.
- TEST-PS-084-03-03 (retire): retire blocked while live items exist.

## Acceptance criteria
1. Table exhaustive.
2. Withdrawal effective at next build.
3. Retirement guard enforced.

## Assumptions & open decisions
- ASSUMPTION: withdrawal semantics above.
