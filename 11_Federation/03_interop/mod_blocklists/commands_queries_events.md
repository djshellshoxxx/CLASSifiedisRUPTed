# PS-089-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_blocklists. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, idempotency, revision), CTR-SCH-001 (`blocklist.*` PENDING), CTR-FED-001 (batch import, export), CTR-CAP-001 (authz), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-089-04.R01 | Every state-changing command carries `idempotency_key` (16–128 chars, CTR-EVT-001 R03) and `expected_revision` (null on create). Missing either → `SYS.REQUEST_MALFORMED`. | MVP |
| PS-089-04.R02 | Each command emits only the events listed below, in the CTR-EVT-001 envelope with `aggregate_type` = `blocklist` and `aggregate_id` = `blk_`. | MVP |
| PS-089-04.R03 | `blocklist.check` is internal, emits no event, and p95 ≤ 2 ms (PS-089-08). | MVP |
| PS-089-04.R04 | Federated events (`scope = federate`) carry no `actor_ref` beyond the per-audience pseudonym (CTR-FED-001 R08). | MVP |

## Data / schema
Command inputs (JSON, `additionalProperties: false`):
- `blocklist.propose`: `target_kind`, `target_ref`, `scope`, `action`, `reason_code`, `source_kind`, `source_ref`, `expires_at?`.
- `blocklist.activate` / `blocklist.reject`: `blk_id`, `reason_code` (reject only), `approver_ref`.
- `blocklist.withdraw`: `blk_id`, `cause` (`operator` | `case_reversed`).
- `blocklist.import_batch`: `dlv_id`, `origin_peer` (`fpr_`), `events[]` (≤ 100; CTR-FED-001 R10).
- `blocklist.rollback_batch`: `dlv_id`.

Events emitted (`schema_version` 1.0.0, PENDING CTR-SCH-001):
| `event_type` | Payload | Max data class | Federated |
|---|---|---|---|
| `blocklist.proposed` | `blk_id`, target, scope, action, reason_code, source | PSEUDONYMOUS | Only if `federate` and peer trusted |
| `blocklist.activated` | `blk_id`, `expires_at` | PSEUDONYMOUS | Only if `federate` |
| `blocklist.rejected` | `blk_id`, reason_code | PUBLIC | No |
| `blocklist.withdrawn` | `blk_id`, `withdraw_cause` | PUBLIC | If previously federated |
| `blocklist.expired` | `blk_id`, `expires_at` | PUBLIC | No; receivers use `expires_at` |

Receivers treat an inbound `blocklist.activated` as `peer_import` and create `proposed` (PS-089-03).

## Commands / queries / events
| Command | Idempotency scope | Expected revision | Emits | Errors |
|---|---|---|---|---|
| propose | actor + key | null | proposed or rejected | TARGET_INVALID, REASON_INVALID, SOURCE_REF_REQUIRED, EXPIRY_INVALID, SCOPE_NOT_ALLOWED |
| activate | actor + key | required | activated | STATE_FORBIDS, CAP.SELF_APPROVAL_FORBIDDEN, CAP.DUAL_APPROVAL_REQUIRED, EVT.REVISION_CONFLICT |
| reject | actor + key | required | rejected | STATE_FORBIDS, CAP.SELF_APPROVAL_FORBIDDEN |
| withdraw | actor + key | required | withdrawn | STATE_FORBIDS, SYS.NOT_FOUND |
| import_batch (sys) | (origin_node, event_id) per CTR-FED-001 R05 | n/a | per event: proposed, rejected or duplicate | FED.SIZE_EXCEEDED, FED.PEER_NOT_TRUSTED |
| rollback_batch | actor + key | n/a | withdrawn (cause `batch_rollback`) | CAP.DUAL_APPROVAL_REQUIRED, SYS.FORBIDDEN |

Queries: `blocklist.list` (filters: scope, status; page ≤ 100), `blocklist.get` (by `blk_`), `blocklist.check` (internal; returns ALLOW or DENY with matched `blk_`).

## States & transitions
Not applicable here. Transition rules are in PS-089-03.

## Validation & errors
Field rules in PS-089-02. Batch and event-level errors reuse CTR-FED-001 codes.

## Authorization
Per command: PS-089-05.

## Failure, idempotency, concurrency, offline
Idempotent replay returns the original result without a new event. Reuse of a key with a different request digest returns `EVT.IDEMPOTENCY_KEY_REUSED`. Batch import is per-event, not all-or-nothing (PS-089-06).

## Privacy, retention, abuse
Payloads contain IDs, enum values and timestamps only. Event retention follows CTR-EVT-001 and PS-089-07.

## Observability & budgets
`blocklist_command_latency_ms{command}` p95 ≤ 200 ms for propose, activate and withdraw (ASSUMPTION).

## Tests
- TEST-PS-089-04-01 (contract): each command rejects a missing `idempotency_key` or `expected_revision`.
- TEST-PS-089-04-02 (integration): replay with same key returns original; different digest returns `EVT.IDEMPOTENCY_KEY_REUSED`.
- TEST-PS-089-04-03 (contract): every emitted event validates against the CTR-EVT-001 envelope and its registered schema.
- TEST-PS-089-04-04 (unit): `blocklist.check` emits zero events.
- TEST-PS-089-04-05 (contract): federated event payloads contain no field outside PS-089-07 allowlist.
- TEST-PS-089-04-06 (integration): batch of 101 events returns `FED.SIZE_EXCEEDED`.

## Acceptance criteria
1. Every command and event in the tables is implemented as specified; TEST-PS-089-04-03 passes.
2. Idempotency holds for all state-changing commands; TEST-PS-089-04-02 passes.
3. Check path emits no events; TEST-PS-089-04-04 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md). Labels below are PROVISIONAL (default, unapproved) where marked.
- PENDING CTR-SCH-001: `blocklist.*` event schemas.
- OPEN (CTR-FED-001): distribution format. Default: signed events (PROVISIONAL, D01).
