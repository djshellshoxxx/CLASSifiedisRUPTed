# PS-021-04 — Commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-021-04.R01 | Every state-changing command declares `expected_revision`, `idempotency_key` (UUIDv7, 36 chars) and emitted `event_type` list (CTR-EVT-001). | MVP |
| PS-021-04.R02 | Commands complete server-side p95 ≤ 300 ms (ASSUMPTION). | MVP |
| PS-021-04.R03 | Queries return only the caller's own consent state plus cycle-level counts (ACCEPTED of N). | MVP |
| PS-021-04.R04 | Command and event schemas versioned `1.0.0`; additive changes are MINOR (CTR-SCH-001). | MVP |

## Data / schema
Command request (JSON, `schema_version` 1.0.0):
```json
{"cycle_id":"cyc_01HZX...","proposal_version":3,"snapshot_hash":"<64 hex>","decision":"ACCEPTED","idempotency_key":"0190f2c4-...","expected_revision":null}
```
Response: `{"consent_id":"cns_...","decision":"ACCEPTED","state":"CONSENTING","revision":1}`.

## Commands / queries / events
| Name | Signature | Idempotency | Errors | Emits |
|---|---|---|---|---|
| `cyc.consent` (command) | `consent(cycle_id, proposal_version, snapshot_hash, decision, idempotency_key)` | key scoped per party and version | validation_rules.md codes | `cycle.consent_recorded` |
| `cyc.consent.withdraw` | `withdraw(cycle_id, proposal_version, idempotency_key)` | repeat → same result | `CYC_CONSENT.CYCLE_NOT_OPEN` | `cycle.consent_withdrawn` |
| `cyc.consent.get` (query) | `get(cycle_id, proposal_version)` | n/a | `SYS.NOT_FOUND` | none |
| `cyc.consent.counts` (query) | `counts(cycle_id, proposal_version)` | n/a | `SYS.NOT_FOUND` | none |
| `cycle.consent_expired` | system timer | per (cycle_id, version) | n/a | event |
| `cycle.consented` | system | per (cycle_id, version) | n/a | consumed by mod_lock |

Event envelope per CTR-EVT-001; `event_type` pattern `^[a-z][a-z_]{1,31}\.[a-z][a-z_]{1,31}$` is satisfied by `cycle.consent_recorded` (ASSUMPTION: underscore suffix accepted by regex).

## States & transitions
Transitions produce the events above; see [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md). Consumers must treat unknown `event_type` as ignorable.

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Duplicate `idempotency_key` returns the original response with HTTP 200 and `idempotent_replay: true`. Stale `expected_revision` → `SYS.CONFLICT`.

## Privacy, retention, abuse
Events carry `max_data_class` PSEUDONYMOUS; no snapshot contents in payload beyond `snapshot_hash`.

## Observability & budgets
Per command: count, latency histogram, error code. Event consumer lag p95 ≤ 5 s.

## Tests
- TEST-PS-021-04-01 (contract): request/response examples validate against 1.0.0 schemas.
- TEST-PS-021-04-02 (integration): duplicate key replays original result.
- TEST-PS-021-04-03 (contract): unknown event type ignored by consumer without error.

## Acceptance criteria
1. All commands and queries in the table implemented with declared signatures.
2. Contract tests pass for every emitted event.
3. Idempotent replay returns identical body bytes.

## Assumptions & open decisions
- ASSUMPTION: `cyc.consent.withdraw` and `cyc.consent.get` are sub-verbs of `cyc.consent`; CTR-CAP-001 vocabulary change is MINOR.
- [DECISIONS.md](../../../DECISIONS.md) D08 — offline writes. PROVISIONAL (D08 default, unapproved): consent queued locally until relay acknowledgment.
