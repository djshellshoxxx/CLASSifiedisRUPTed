# PS-091-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_trust. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-FED-001 (peer events).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-091-04.R01 | Every state-changing command requires `Idempotency-Key` (UUIDv7 or ULID, ASSUMPTION) and `expected_revision`. | MVP |
| PS-091-04.R02 | Command p95 server latency ≤ 300 ms; hard timeout 2 s. | MVP |
| PS-091-04.R03 | Events are `peer.<past-tense verb>` per CTR-EVT-001 R10; schema_version 1.0.0. | MVP |
| PS-091-04.R04 | Queries return only fields permitted by PS-091-05 (CTR-CAP-001 R10). | MVP |

## Data / schema
Command bodies (JSON, `additionalProperties: false`):

| Command | Body | Event |
|---|---|---|
| `peer.admit` | `peer_id`, `expected_revision`, `fingerprint_confirmation` | `peer.admitted` |
| `peer.restrict` | `peer_id`, `expected_revision`, `reason_code` (SIG_FAILURES, ADMIN_REVIEW), `evidence_ref?` | `peer.restricted` |
| `peer.quarantine` | `peer_id`, `expected_revision`, `reason_code`, `evidence_ref` (required) | `peer.quarantined` |
| `peer.restore` | `peer_id`, `expected_revision`, `target_state` (trusted, restricted), `review_ref` | `peer.restored` |
| `peer.revoke` | `peer_id`, `expected_revision`, `reason_code` | `peer.revoked` |

Queries: `peer.get_trust` → `{peer_id, trust_state, revision, last_transition_at}`; `peer.list_by_state` → cursor page, limit ≤ 100; `peer.get_assessments` → cursor page of `trs_` (operator, case scope).

## Commands / queries / events
Example:
```http
POST /v1/federation/peers/fpr_01J9Z3K8M2Q4R6S8T0V2W4X6Y8/quarantine
Idempotency-Key: 0190f3a1-7c2e-7d9a-8b1f-4e5d6c7f8a9b

{"expected_revision": 4, "reason_code": "EQUIVOCATION", "evidence_ref": "evd_01J9Z3..."}

200 {"peer_id": "fpr_01J9Z3K8M2Q4R6S8T0V2W4X6Y8", "trust_state": "quarantined", "revision": 5, "event_id": "evt_01J9Z4..."}
```
Event envelope per CTR-EVT-001. Payload contains `peer_id`, `from_state`, `to_state`, `reason_code`, `evidence_ref`; `max_data_class` = PSEUDONYMOUS. The `actor_ref` is `ope_`, `mod_` or `sys_`; `idempotency_key` is removed on federation export (CTR-EVT R13).

## States & transitions
Event names map one-to-one to the transitions in [PS-091-03](workflow_state_machine.md).

## Validation & errors
Error codes per [PS-091-02](validation_rules.md). Idempotency key reused with a different digest → `EVT.IDEMPOTENCY_KEY_REUSED`.

## Authorization
Capabilities per [PS-091-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope = (actor, command type, key) per CTR-EVT-001 R03. Retry policy in [PS-091-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Event payloads omit free text and evidence content. Only `evidence_ref` IDs appear.

## Observability & budgets
Each command emits span `trust.<command>` with `request_id`, `code` and duration; no body logging (CTR-ERR-001 R10).

## Tests
- `TEST-PS-091-04-01` contract: request and event bodies validate against the JSON schemas; unknown fields rejected.
- `TEST-PS-091-04-02` integration: 1 accepted command → exactly 1 event with `revision` +1.
- `TEST-PS-091-04-03` contract: event payload with `reason_text` rejected by the producer.

## Acceptance criteria
1. All five commands and three queries are documented with body schema, event and error codes.
2. Every event validates against CTR-EVT-001 and CTR-SCH-001 schema registry entries.
3. Latency budget in R02 is met in the load test (PS-091-08).

## Assumptions & open decisions
- ASSUMPTION: CTR-SCH-001 registry entries for `peer.*` v1.0.0 are created with this module's first release.
- D01 (federated protocol), PROVISIONAL default: signed envelopes with explicit opt-in (unapproved).
