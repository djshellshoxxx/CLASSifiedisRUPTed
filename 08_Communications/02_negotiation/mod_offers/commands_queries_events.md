# PS-063-04 — commands queries events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_offers. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001, CTR-ID-001, CTR-COM-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-063-04.R01 | State-changing commands require `idempotency_key` and `expected_revision`. | MVP |
| PS-063-04.R02 | Terms are sent as a complete object; partial term patches are rejected (`OFFERS.AMOUNT_INVALID` or schema error). | MVP |
| PS-063-04.R03 | Queries return ≤ 50 offers per page with opaque cursor; only offers where the caller is offerer or recipient. | MVP |
| PS-063-04.R04 | Events carry no amounts (PS-063-07). | MVP |

## Data / schema
```json
{"cmd":"ofr.create","args":{"target":{"type":"listing","ref":"lst_…"},"recipient":"acc_…","terms":{…},"expires_at":"…"},"idempotency_key":"…"}
{"cmd":"ofr.counter","args":{"offer_id":"ofr_…","terms":{…}},"expected_revision":1,"idempotency_key":"…"}
{"cmd":"ofr.accept","args":{"offer_id":"ofr_…","terms_digest":"…"},"expected_revision":1,"idempotency_key":"…"}
```

## Commands / queries / events
| Command | Events | Idempotent | Notes |
|---|---|---|---|
| ofr.create | offer.created | yes | |
| ofr.counter | offer.countered | yes | new version |
| ofr.accept | offer.accepted | yes | terms_digest must match |
| ofr.decline | offer.declined | yes | |
| ofr.withdraw | offer.withdrawn | yes | offerer only |
| ofr.expire (system) | offer.expired | yes | scheduled |
| ofr.list (query) | none | n/a | caller's offers only |

`max_data_class` = `FINANCIAL_EVIDENCE` for events that include `terms_digest` only; `PSEUDONYMOUS` otherwise. No event payload carries `amount_minor` or currency codes.

## States & transitions
See [PS-063-03](workflow_state_machine.md).

## Validation & errors
Order: schema → participant → state → money → quote → expiry. See [PS-063-02](validation_rules.md).

## Authorization
[PS-063-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope per CTR-EVT-001 R03; accept carries digest so stale accept fails.

## Privacy, retention, abuse
Payload excludes terms; subscribers fetch terms via authorized query.

## Observability & budgets
`offers_command_total{cmd,outcome}`; p95 ≤ 300 ms.

## Tests
- TEST-PS-063-04-01 (contract): shapes match blocks above.
- TEST-PS-063-04-02 (contract): event payloads contain no `amount_minor`.
- TEST-PS-063-04-03 (integration): accept with stale `terms_digest` → `OFFERS.STATE_FORBIDS` or digest-mismatch error; no event.

## Acceptance criteria
1. Contract tests pass (TEST-PS-063-04-01, -02).
2. Stale-digest accept never emits `offer.accepted` (TEST-PS-063-04-03).

## Assumptions & open decisions
- PENDING CTR-SCH-001 registration of `offer.v1`.
- ASSUMPTION: list page size 50.
