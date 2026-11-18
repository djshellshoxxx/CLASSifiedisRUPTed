# PS-063-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_offers. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-COM-001 (R04 quote expiry), CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-063-03.R01 | Offer states: `open`, `countered`, `accepted`, `declined`, `withdrawn`, `expired`. Initial `open`. | MVP |
| PS-063-03.R02 | `accepted` means the recipient agreed to the version. It is binding only when a `cns_` record is `given` for the same version (CTR-COM R04; [PS-062-03](../mod_consent/workflow_state_machine.md)). | MVP |
| PS-063-03.R03 | `countered`, `accepted`, `declined`, `withdrawn`, `expired` are terminal for that version. | MVP |
| PS-063-03.R04 | `open` → `expired` when `expires_at` passes; enforced by scheduled job within 60 s. | MVP |
| PS-063-03.R05 | Every transition emits one event and increments the target revision. | MVP |

## Data / schema
State stored on `offer` record ([PS-063-01](domain_schema.md)).

## Commands / queries / events
See [PS-063-04](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | offer.created | valid per PS-063-02 | open | notify recipient (generic) |
| open | offer.countered | recipient; counter valid (R05 of PS-063-02) | countered | new `open` version created |
| open | offer.accepted | recipient; not expired; quote valid | accepted | consent request raised to mod_consent |
| open | offer.declined | recipient | declined | notify offerer |
| open | offer.withdrawn | offerer | withdrawn | notify recipient |
| open | offer.expired | `expires_at` passed | expired | notify both |
| accepted | (consent given) | consumed by mod_consent | accepted (binding) | none here |

Forbidden transitions return `OFFERS.STATE_FORBIDS`.

## Validation & errors
Guards use codes from [PS-063-02](validation_rules.md).

## Authorization
Actor per transition in [PS-063-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Accept and counter race: revision check; loser gets `EVT.REVISION_CONFLICT`. Expiry during accept: accept rejected with `OFFERS.EXPIRED`.

## Privacy, retention, abuse
Events carry IDs and state only; amounts not in event payloads.

## Observability & budgets
`offers_transition_total{from,event,to}`. Alert: `accepted` committed after `expires_at`.

## Tests
- TEST-PS-063-03-01 (unit): each table row; forbidden transitions.
- TEST-PS-063-03-02 (integration): accept vs expiry race at boundary; no accept after expiry.
- TEST-PS-063-03-03 (integration): counter creates new version; prior version terminal `countered`.

## Acceptance criteria
1. No `accepted` event with `committed_at > expires_at` (TEST-PS-063-03-02).
2. `accepted` never binds without consent (TEST-PS-063-03-01 asserts consent dependency).

## Assumptions & open decisions
- ASSUMPTION: expiry job runs every 60 s; accept checks expiry server-side at commit.
- OPEN: whether recipient may accept a version after its counter is created (default: no).
