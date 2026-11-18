# PS-109-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_keyboard. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-109-02.R01 | Reject any chord with a modifier outside {ctrl, alt, shift, meta} or more than two keys. | MVP |
| PS-109-02.R02 | Reject chords on the reserved list (below) with `KBD.RESERVED_KEY` in 100% of tested cases. | MVP |
| PS-109-02.R03 | Reject a second binding of the same chord in the same scope with `KBD.SHORTCUT_CONFLICT`. | MVP |

## Data / schema
Reserved list (static, versioned with the catalog): Tab, Shift+Tab, Enter and Space on native controls, Escape while a focus trap is active, screen reader modifier keys (Insert, CapsLock, Ctrl+Option), and browser/OS chords (Ctrl+W, Ctrl+T, Ctrl+Q, Alt+F4, Cmd+Q, Cmd+W).
Key allowlist: `KeyboardEvent.code` values only; layout-dependent `key` values are not stored.

## Commands / queries / events
Validation runs before every `kbd.binding.set` ([PS-109-04](commands_queries_events.md)).

## States & transitions
Not applicable (validation is stateless).

## Validation & errors
| Rule | Field | Code | Retryable | Message key | Diagnostic (privacy-safe) |
|---|---|---|---|---|---|
| Invalid modifier or key count | /chord | KBD.INVALID_BINDING | false | err.kbd.invalid_binding | rule enum only |
| Reserved chord | /chord | KBD.RESERVED_KEY | false | err.kbd.reserved_key | reserved-list id |
| Duplicate chord in scope | /chord | KBD.SHORTCUT_CONFLICT | false | err.kbd.shortcut_conflict | conflicting action_id |
| expected_revision ≠ stored | /expected_revision | KBD.PREFERENCE_STALE | false | err.kbd.preference_stale | none |

Input values are never echoed (CTR-ERR-001 R07). Client shows the message key with the rule text from its catalog.

## Authorization
Validation does not change authorization outcomes; see [PS-109-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Client validates offline with the same catalog version; server re-validates on sync.

## Privacy, retention, abuse
Validation logs contain the error code and request_id only. No chord value is logged.

## Observability & budgets
Counter per code. Validation p95 ≤ 5 ms server-side (ASSUMPTION).

## Tests
- TEST-PS-109-02-01 unit: every reserved-list entry rejected.
- TEST-PS-109-02-02 property: any chord with 3+ keys or unknown modifier is rejected.
- TEST-PS-109-02-03 integration: conflict detected for two actions in one scope; allowed across scopes.

## Acceptance criteria
1. All four codes return the documented retryable value and message key.
2. No error response contains the submitted chord.
3. Reserved list matches the catalog version used by the client.

## Assumptions & open decisions
- ASSUMPTION: reserved list is complete for the browsers and OS versions supported at release; verification per platform is PENDING.
- No Dxx decision directly affects validation.
