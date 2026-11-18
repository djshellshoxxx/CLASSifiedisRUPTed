# PS-052-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_pseudonyms. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, idempotency R03), CTR-ERR-001 (codes), CTR-SCH-001 (schema IDs), CTR-CAP-001 (actions), CTR-ID-001 (`prf`, `acc`).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-052-04.R01 | Every state-changing command takes `idempotency_key` (26-char ULID, client generated) and `expected_revision` (int, except on create). | MVP |
| PS-052-04.R02 | Command response p95 ≤ 300 ms server-side; response includes `prf_id`, `revision`, `event_id`. | MVP |
| PS-052-04.R03 | Queries return only fields visible to the caller (CTR-CAP-001 R10). A public query never returns `account_id`. | MVP |
| PS-052-04.R04 | Event envelopes follow CTR-EVT-001; `aggregate_type = pseudonym`; `actor_ref` is `acc_` ID. No handle or label in event payloads except `pseudonym.created` and `pseudonym.handle_changed`, which carry handle only. | MVP |
| PS-052-04.R05 | Schema IDs: `pseudonym.created`, `pseudonym.handle_changed`, `pseudonym.label_changed`, `pseudonym.retired`, each versioned 1.0.0. | MVP |
| PS-052-04.R06 | Bulk create, batch label edits. | Future |

## Data / schema
Command payloads:

| Command | Payload fields | Idempotency scope | Error codes |
|---|---|---|---|
| `CreatePseudonym` | `handle`, `label?`, `idempotency_key` | (actor, command, key) | `PSEUD.HANDLE_INVALID`, `HANDLE_RESERVED`, `HANDLE_TAKEN`, `LABEL_INVALID`, `LABEL_CONTAINS_CONTACT`, `LIMIT_REACHED`, `SYS.UNAUTHENTICATED` |
| `ChangeHandle` | `prf_id`, `handle`, `expected_revision` | same | `HANDLE_*`, `RETIRED_IMMUTABLE`, `EVT.REVISION_CONFLICT`, `SYS.NOT_FOUND` |
| `UpdateLabel` | `prf_id`, `label`, `expected_revision` | same | `LABEL_*`, `RETIRED_IMMUTABLE`, `EVT.REVISION_CONFLICT` |
| `RetirePseudonym` | `prf_id`, `expected_revision` | same | `HAS_OPEN_PARTICIPATION`, `RETIRED_IMMUTABLE` |

Queries: `ListOwnPseudonyms()` (owner; all fields); `GetPublicPseudonym(prf_id)` (handle, label, state, revision).

Schema versions: each command and event payload is `1.0.0`; additive optional fields are MINOR (CTR-SCH-001 R05).

## States & transitions
Event emission follows [workflow_state_machine.md](workflow_state_machine.md). Events: `pseudonym.created` (state → active), `pseudonym.handle_changed`, `pseudonym.label_changed`, `pseudonym.retired`.

## Validation & errors
Field-level rules in [validation_rules.md](validation_rules.md). Error responses follow CTR-ERR-001 (`code`, `retryable`, `category`, `message_key`, `request_id`).

## Authorization
Caller must be the `acc_` owner (`pseudonym.create`, `pseudonym.update`, `pseudonym.retire`, `pseudonym.read`). Full matrix in [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
- Same key and same request digest return the original result with no new event (CTR-EVT-001 R03).
- Same key and different digest → `EVT.IDEMPOTENCY_KEY_REUSED`.
- Offline create may use a client-generated `prf_` ID (CTR-ID-001); it is queued and acknowledged by the relay (D08 PROVISIONAL). Retryable codes are retried; non-retryable codes move the item to "not applied" (CTR-ERR-001).

## Privacy, retention, abuse
Event payloads carry no `account_id`; `actor_ref` identifies the owner to the audit stream only (aud_ retention RET-AUD). Events are PSEUDONYMOUS class; never federated in MVP.

## Observability & budgets
Per-command counters `pseud_cmd_total{command,result}` and latency histograms. No labels with handle or `prf_` values as metric dimensions (cardinality and linkage risk).

## Tests
- TEST-PS-052-04-01 (contract): each command and event payload validates against registered schema.
- TEST-PS-052-04-02 (integration): duplicate `CreatePseudonym` with same key returns same `prf_id`; one event.
- TEST-PS-052-04-03 (negative): reused key with different handle returns `EVT.IDEMPOTENCY_KEY_REUSED`.
- TEST-PS-052-04-04 (contract): `GetPublicPseudonym` response has no `account_id` field (absent, not null).

## Acceptance criteria
1. All four commands and two queries implemented with the listed payloads and error codes.
2. Idempotency and revision rules verified by contract tests.
3. Public query never exposes `account_id`.
4. Event envelopes pass the CTR-EVT-001 lint (no names, emails, device IDs).

## Assumptions & open decisions
- ASSUMPTION: `aggregate_type = pseudonym` is registered in CTR-SCH-001 before implementation.
- PROVISIONAL (D08 default, unapproved): offline queue until relay acknowledgment.
- PROVISIONAL (D10 default, unapproved): key handling is out of scope; commands rely on authenticated session.
