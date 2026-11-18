# PS-109-07 — privacy, retention and abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_keyboard. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-109-07.R01 | Keystroke values are never sent to any server, analytics tool or log. | MVP |
| PS-109-07.R02 | Shortcut handlers do not capture keys while a text input, textarea or contenteditable element has focus. | MVP |
| PS-109-07.R03 | Account-scope bindings are never federated (CTR-FED-001 item-level `federate=false`). | MVP |

## Data / schema
Account scope: PSEUDONYMOUS. Device scope: stays in the device store; not personal data on the server.

## Commands / queries / events
No additional commands. Analytics events carry counts only.

## States & transitions
Not applicable.

## Validation & errors
Keys used by assistive technology are rejected by [PS-109-02](validation_rules.md).

## Authorization
See [PS-109-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable beyond [PS-109-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
| Data | Class | Retention default | Deletion |
|---|---|---|---|
| Account bindings | PSEUDONYMOUS | until reset or account deletion | propagates within 24 h (CTR-PRV-001 R06) |
| Device bindings | local only | 365 days idle (ASSUMPTION) | cleared on app data reset |
| Conflict and reset counters | aggregate | 90 days | no identifiers |

Abuse: a third-party script cannot read bindings (same-origin storage only). Binding UI must not shadow screen reader commands. Retention default is PROVISIONAL (D07 default, unapproved).

## Observability & budgets
Only aggregate counters ([PS-109-08](observability_performance.md)).

## Tests
- TEST-PS-109-07-01 unit: handler ignores keydown when an input is focused.
- TEST-PS-109-07-02 static: no logger call receives a `key` or `chord` field (lint rule).
- TEST-PS-109-07-03 integration: account bindings absent from federation export.

## Acceptance criteria
1. Zero keystroke values in logs, telemetry and network payloads in the test suite.
2. Shortcut handlers inactive in 100% of tested text-entry contexts.
3. Deletion of an account removes account bindings within 24 h in test.

## Assumptions & open decisions
- ASSUMPTION: 365-day device retention default.
- D07 (retention): PROVISIONAL (D07 default, unapproved).
