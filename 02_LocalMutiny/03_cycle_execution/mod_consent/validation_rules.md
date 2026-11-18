# PS-021-02 — Validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-021-02.R01 | A consent command is rejected with `CYC_CONSENT.SNAPSHOT_STALE` (409) when `proposal_version` is not the current version. | MVP |
| PS-021-02.R02 | `snapshot_hash` submitted by the client must equal the server-recomputed hash; mismatch → `CYC_CONSENT.SNAPSHOT_MISMATCH` (422). | MVP |
| PS-021-02.R03 | Consent is accepted only while `now < expires_at`, TTL 48 h default, configurable 1–168 h (ASSUMPTION). Otherwise `CYC_CONSENT.EXPIRED` (422). | MVP |
| PS-021-02.R04 | Actor must be a current participant of the cycle version; non-participant → `SYS.NOT_FOUND` (no existence leak). | MVP |
| PS-021-02.R05 | Any consent submitted when cycle state ≠ PROPOSED or CONSENTING → `CYC_CONSENT.CYCLE_NOT_OPEN` (409). | MVP |
| PS-021-02.R06 | Request body ≤ 4 KiB; unknown fields rejected with `SYS.REQUEST_MALFORMED` (400). | MVP |
| PS-021-02.R07 | `decision` must be exactly one of ACCEPTED, REJECTED, WITHDRAWN (case-sensitive). | MVP |

## Data / schema
Validation inputs map to fields in [domain_schema.md](domain_schema.md). Snapshot hash input: canonical JCS JSON; a lone changed decimal digit changes the hash (tested in TEST-PS-021-02-02).

## Commands / queries / events
Validation runs before state transition in [workflow_state_machine.md](workflow_state_machine.md). Errors appear in the command response, not as events.

## States & transitions
Validation is a guard on the transitions in workflow_state_machine.md; a failed guard leaves state unchanged.

## Validation & errors
| Code | Retryable | Class / HTTP | User message key | Diagnostic (privacy-safe) |
|---|---|---|---|---|
| CYC_CONSENT.SNAPSHOT_STALE | false | conflict / 409 | consent.stale_version | cycle_id, current version only |
| CYC_CONSENT.SNAPSHOT_MISMATCH | false | unprocessable_state / 422 | consent.snapshot_changed | hash prefix 8 chars |
| CYC_CONSENT.EXPIRED | false | unprocessable_state / 422 | consent.expired | expires_at |
| CYC_CONSENT.CYCLE_NOT_OPEN | false | conflict / 409 | consent.cycle_closed | cycle state |
| CYC_CONSENT.DUPLICATE_DECISION | false | conflict / 409 | consent.already_recorded | consent_id |

Diagnostics never include item descriptions, locations or other parties' IDs.

## Authorization
Validation of actor precedes all state reads (see [authorization_capabilities.md](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Validation is deterministic; the same input yields the same error code. Offline clients validate locally for UX only; the server re-validates on relay acknowledgment (D08).

## Privacy, retention, abuse
Error diagnostics follow CTR-ERR-001 privacy rules. Rate limit: 20 consent commands per principal per cycle per hour (ASSUMPTION) to limit probing of cycle state.

## Observability & budgets
Count per error code; p95 validation ≤ 5 ms excluding database.

## Tests
- TEST-PS-021-02-01 (unit): each error code reachable with a minimal input.
- TEST-PS-021-02-02 (property): hash mismatch for any single-field change.
- TEST-PS-021-02-03 (negative integration): non-participant receives SYS.NOT_FOUND, indistinguishable from unknown cycle.

## Acceptance criteria
1. Each rule R01–R07 has at least one passing and one failing test.
2. Error codes match CTR-ERR-001 retryability.
3. No validation response reveals other parties' identifiers.

## Assumptions & open decisions
- ASSUMPTION: 48 h consent TTL and 20/h rate limit.
- [DECISIONS.md](../../../DECISIONS.md) D02 — PROVISIONAL (D02 default, unapproved): snapshot is the cycle proposal in bounded search output.
