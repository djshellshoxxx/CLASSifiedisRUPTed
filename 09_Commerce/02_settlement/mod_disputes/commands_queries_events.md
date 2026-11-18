# PS-070-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_disputes (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (`clm.dispute`, `case.resolve`, R13), CTR-EVT-001 (R02, R03, R13), CTR-ERR-001, CTR-SCH-001, CTR-CAP-001 (R06, R07). **Decisions:** D04 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-070-04.R01 | Every state-changing command requires `idempotency_key` and `expected_state_version` on the claim and on the dispute. | MVP |
| PS-070-04.R02 | Raise, respond and withdraw are each one atomic write across dispute row and claim transition. | MVP |
| PS-070-04.R03 | `dispute.get` returns `statement` only to the two claim parties and the case moderator. | MVP |
| PS-070-04.R04 | Event payloads reference IDs and enums; `statement` is never in an event payload. | MVP |

## Data / schema
Commands:
- `dispute.raise(claim_id, expected_claim_state_version, reason_code, statement?, evidence_ids?) -> dispute_id, state_version`
- `dispute.respond(dispute_id, expected_state_version, statement?, evidence_ids?) -> state_version`
- `dispute.withdraw(dispute_id, expected_state_version) -> state_version`
- `case.resolve(case_id, dispute_id, outcome)` (outcome: `restore_prior` | `reverse`; `mod_` with case grant)

Queries: `dispute.get(dispute_id)`, `dispute.list(claim_id)` (participants only; max 20 per page).

## Commands / queries / events
| Command | Event(s) | Idempotency scope | Version | Error codes |
|---|---|---|---|---|
| `dispute.raise` | `dispute.raised`, `clm.disputed` | (actor, command, key) | v1 | PS-070-02 table |
| `dispute.respond` | `dispute.responded` | (actor, command, key) | v1 | `DISPUTE.RESPONSE_WINDOW_CLOSED`, `SYS.CONFLICT` |
| `dispute.withdraw` | `dispute.withdrawn`, `clm.*` restore event | (actor, command, key) | v1 | `SYS.CONFLICT`, `COM.INVALID_TRANSITION` |
| `case.resolve` | `dispute.resolved`, `clm.dispute_resolved` | (actor, command, key) | v1 | `SYS.FORBIDDEN`, `SYS.PRECONDITION_FAILED` (dual control, R07) |

Escalation is an internal `sys_` command `dispute.escalate` emitting `dispute.escalated`.

## States & transitions
Per PS-070-03; the command table above is the only write path.

## Validation & errors
Shared codes from CTR-ERR-001 and module codes from PS-070-02. `COM.*` codes from CTR-COM-001 appear unchanged.

## Authorization
Capability IDs: `dispute.raise`, `dispute.respond`, `dispute.withdraw`, `dispute.read`, `dispute.escalate`, `case.resolve` (PS-070-05).

## Failure, idempotency, concurrency, offline
Same key and same digest returns the original result (CTR-EVT-001 R03). Retry of `dispute.raise` after timeout returns the same `dispute_id`.

## Privacy, retention, abuse
Events omit `statement` (R04). Redaction replaces payload with digest (CTR-EVT-001 R08).

## Observability & budgets
Latency budget: `dispute.raise` p95 ≤ 300 ms server time; `dispute.get` p95 ≤ 150 ms.

## Tests
- TEST-PS-070-04-01 (contract): all command and event fixtures validate against CTR-SCH-001 `1.0.0`.
- TEST-PS-070-04-02 (integration): retried `dispute.raise` returns the same `dispute_id` and emits no second `clm.disputed`.
- TEST-PS-070-04-03 (contract): event payload canary scan finds no `statement` text.
- TEST-PS-070-04-04 (integration): `case.resolve` by one `ope_` alone is refused.

## Acceptance criteria
1. Every command in the table has a passing contract test.
2. Replay and conflict behaviour matches CTR-EVT-001 R02/R03.
3. No event carries free text.

## Assumptions & open decisions
- ASSUMPTION: `dispute.escalate` is internal only (no client command).
- D04 (PROVISIONAL default, unapproved).
