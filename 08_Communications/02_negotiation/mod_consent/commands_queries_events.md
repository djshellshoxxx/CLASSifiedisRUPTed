# PS-062-04 — commands queries events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_consent. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001, CTR-ID-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-062-04.R01 | All commands require `idempotency_key`, `proposal_version`, `terms_digest` and `scope` (for give). | MVP |
| PS-062-04.R02 | Commands are rejected when the request body contains a slot or party ID different from the authenticated principal's slot. | MVP |
| PS-062-04.R03 | Status query returns the current record per slot; no query lists other parties' consent. | MVP |

## Data / schema
```json
{"cmd":"cns.give","args":{"proposal_ref":"cyc_…","slot":"par_…","proposal_version":3,"terms_digest":"…","scope":"participate","quote_id":null},"idempotency_key":"…"}
{"cmd":"cns.decline","args":{"proposal_ref":"cyc_…","slot":"par_…","proposal_version":3},"idempotency_key":"…"}
{"cmd":"cns.withdraw","args":{"consent_id":"cns_…"},"expected_revision":2,"idempotency_key":"…"}
```

## Commands / queries / events
| Command / query | Event(s) | Idempotent | Notes |
|---|---|---|---|
| cns.give | consent.given (+ consent.superseded on prior) | yes | validates per PS-062-02 |
| cns.decline | consent.declined | yes | |
| cns.withdraw | consent.withdrawn | yes | refused after lock |
| cns.status (query) | none | n/a | returns own slot only |

Events: `consent.given`, `consent.declined`, `consent.withdrawn`, `consent.superseded`, `consent.expired`. `max_data_class`: PSEUDONYMOUS. Payloads: IDs, version, scope, state.

## States & transitions
See [PS-062-03](workflow_state_machine.md).

## Validation & errors
Order: schema → participant → version → digest → quote → state. See [PS-062-02](validation_rules.md).

## Authorization
Per [PS-062-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope per CTR-EVT-001 R03. Concurrent give and version bump: give fails with `CONSENT.STALE_VERSION`.

## Privacy, retention, abuse
Payloads contain no terms text and no amounts (amounts are FINANCIAL_EVIDENCE and referenced by `ofr_` ID only).

## Observability & budgets
`consent_command_total{cmd,outcome}`; p95 command latency ≤ 300 ms (ASSUMPTION).

## Tests
- TEST-PS-062-04-01 (contract): request and response shapes match the blocks above.
- TEST-PS-062-04-02 (negative): body `slot` belonging to another party → `SYS.NOT_FOUND` (identical to absent slot).
- TEST-PS-062-04-03 (contract): `consent.given` payload contains no terms text and no amounts.
- TEST-PS-062-04-04 (idempotency): duplicate `cns.give` returns the original `consent_id`.

## Acceptance criteria
1. Contract tests pass (TEST-PS-062-04-01, -03).
2. No body-supplied party ID affects authorization (TEST-PS-062-04-02).

## Assumptions & open decisions
- PENDING CTR-SCH-001 registration of `consent.v1`.
- ASSUMPTION: `cns.status` returns at most 2 records per slot (current, prior).
