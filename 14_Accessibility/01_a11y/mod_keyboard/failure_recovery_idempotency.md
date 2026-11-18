# PS-109-06 — failure, recovery, idempotency and offline
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_keyboard. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-109-06.R01 | A local binding change applies immediately, before server ack, and is shown as "saving" until ack. | MVP |
| PS-109-06.R02 | Account-scope changes queued offline are retried with the policy in [PS-116](../../../15_Platform/01_pwa/mod_offline/failure_recovery_idempotency.md); after 8 failed attempts the user sees "not saved to account". | MVP |
| PS-109-06.R03 | A corrupt local binding record is discarded and defaults load; no crash, no data sent. | MVP |

## Data / schema
Local store: IndexedDB object store `kbb_local` keyed by action_id. Version field per record.

## Commands / queries / events
Retries reuse the same `idempotency_key` ([PS-109-04](commands_queries_events.md)).

## States & transitions
Binding `set` → `reset_pending` while queued; → `set` on ack ([PS-109-03](workflow_state_machine.md)).

## Validation & errors
Client re-validates corrupt records; failure codes not surfaced except KBD.PREFERENCE_STALE.

## Authorization
Queued commands re-authorized at server commit.

## Failure, idempotency, concurrency, offline
| Scenario | Behavior |
|---|---|
| Network error | Retry with exponential backoff, base 2 s, cap 15 min, jitter ±20% |
| Timeout 10 s | Treat as unknown; retry with same key |
| Stale revision | KBD.PREFERENCE_STALE; server value applied; user notified once |
| IndexedDB write fails | Keep in-memory binding for session; show error; defaults after reload |
| Two devices change same action | Last committed revision wins; other device receives event on sync |

## Privacy, retention, abuse
Queued entries hold action_id and chord only; purged on sign-out.

## Observability & budgets
Counters: retries, stale responses, local write failures. No chord values.

## Tests
- TEST-PS-109-06-01 integration: duplicate delivery of set returns one committed change.
- TEST-PS-109-06-02 offline: change while offline, reconnect, ack within one retry cycle.
- TEST-PS-109-06-03 fault injection: corrupt local record loads defaults.

## Acceptance criteria
1. No change is lost silently: each change ends in `set`, `default` or a visible error.
2. Retry count never exceeds 8 per queued change.
3. Corrupt-record path shows no error page.

## Assumptions & open decisions
- ASSUMPTION: server-wins for conflicting account-scope bindings.
- No Dxx decision directly affects this process.
