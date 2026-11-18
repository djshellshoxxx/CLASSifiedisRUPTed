# PS-109-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_keyboard. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-109-03.R01 | A binding is in exactly one state: `default`, `set` or `reset_pending`. | MVP |
| PS-109-03.R02 | A focus trap is `inactive` or `active`; closing a dialog returns focus to `focus_return_target` in 100% of catalog entries. | MVP |
| PS-109-03.R03 | Every account-scope transition emits one `keyboard_binding.changed` event after server commit. | MVP |

## Data / schema
State is held in the `kbb_` record (`provenance`, `revision`). Focus trap state is in-memory per document.

## Commands / queries / events
Transitions driven by [PS-109-04](commands_queries_events.md) commands and by sync results from [PS-116](../../../15_Platform/01_pwa/mod_offline/workflow_state_machine.md).

## States & transitions
Binding:
| from | event | guard | to | side effect |
|---|---|---|---|---|
| default | set (valid, no conflict) | revision check passes (first write) | set | revision=1; event on account scope |
| set | set (valid) | expected_revision = stored | set | revision+1; event |
| set | reset | action exists | default | record deleted; event with change=reset |
| set | sync_conflict | server revision > local | set | server value wins; local notice shown |
| any | set (rejected) | validation fails | unchanged | error returned; no write |

Focus trap:
| from | event | guard | to | side effect |
|---|---|---|---|---|
| inactive | dialog_open | dialog has ≥1 focusable element | active | focus moves to first focusable |
| active | Tab / Shift+Tab | — | active | focus wraps inside dialog |
| active | Escape | escape_action = close | inactive | focus returns to focus_return_target |
| active | dialog_close | target missing | inactive | focus goes to first focusable in document order, never body |

## Validation & errors
Invalid transitions return the errors in [PS-109-02](validation_rules.md).

## Authorization
Only the owning `acc_` may trigger account-scope transitions.

## Failure, idempotency, concurrency, offline
See [PS-109-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Transition events carry action_id and revision only.

## Observability & budgets
Transition counters per state pair. Focus restore ≤ 100 ms p95 (ASSUMPTION).

## Tests
- TEST-PS-109-03-01 unit: every row of both tables is covered.
- TEST-PS-109-03-02 integration: sync_conflict keeps server value and shows notice.
- TEST-PS-109-03-03 e2e: open and close each catalog dialog by keyboard; focus returns correctly.

## Acceptance criteria
1. Transition tables are exhaustive: no (state, event) pair is undefined.
2. Focus returns to the opener in 100% of catalog dialogs under test.
3. Each committed account-scope transition emits exactly one event.

## Assumptions & open decisions
- ASSUMPTION: server-wins conflict policy for account-scope bindings; no merge.
- No Dxx decision directly affects this state machine.
