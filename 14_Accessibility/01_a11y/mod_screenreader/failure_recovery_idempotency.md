# PS-110-06 — failure, recovery, idempotency and offline
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_screenreader. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-110-06.R01 | If the live region is absent, the app moves focus to the status element instead of dropping the message. | MVP |
| PS-110-06.R02 | Offline, the client renders the last published template revision; no network call is needed to announce. | MVP |
| PS-110-06.R03 | A template fetch failure never blocks rendering; the client uses the bundled default text. | MVP |

## Data / schema
Bundled catalog version stamp in the app build.

## Commands / queries / events
Publish retries reuse the same key ([PS-110-04](commands_queries_events.md)).

## States & transitions
Dispatch states in [PS-110-03](workflow_state_machine.md).

## Validation & errors
Mismatched catalog version falls back to the bundled text; no error shown to the user.

## Authorization
Not applicable to offline reads.

## Failure, idempotency, concurrency, offline
| Scenario | Behavior |
|---|---|
| Live region missing | Focus moved to status element (R01) |
| Template fetch fails | Bundled text used (R03) |
| Two publishers edit one template | Second publish gets stale-revision error; must refetch |
| Announcement during route change | Queued for 1 s then dropped if view changed |

## Privacy, retention, abuse
No announcement logs. See [PS-110-07](privacy_retention_abuse.md).

## Observability & budgets
Count of fallback uses per session.

## Tests
- TEST-PS-110-06-01 integration: missing region triggers focus fallback.
- TEST-PS-110-06-02 offline: announcement renders with network disabled.
- TEST-PS-110-06-03 fault: template endpoint returns 503; bundled text used.

## Acceptance criteria
1. No state-change message is dropped without a fallback.
2. Offline announcements work for 100% of bundled templates.
3. Stale publish is refused and never overwrites.

## Assumptions & open decisions
- ASSUMPTION: bundled templates cover all event keys shipped at release.
- No Dxx decision directly affects this process.
