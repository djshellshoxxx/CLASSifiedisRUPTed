# PS-110-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_screenreader. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-COM-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-110-03.R01 | A template is in exactly one of `draft`, `published`, `deprecated`. | MVP |
| PS-110-03.R02 | At most one announcement per live region per 1 s window; duplicates within the window are dropped. | MVP |
| PS-110-03.R03 | A claim state announcement uses only the CTR-COM-001 catalog label for that state. | MVP |

## Data / schema
Template `status` and `revision` ([PS-110-01](domain_schema.md)).

## Commands / queries / events
Transitions driven by `scr.template.publish` and `scr.template.deprecate`.

## States & transitions
| from | event | guard | to | side effect |
|---|---|---|---|---|
| (none) | create | validation passes | draft | revision=1 |
| draft | publish | PS-110-02 passes | published | event `announcement_template.published` |
| published | edit | — | draft (new revision) | published revision remains active |
| published | deprecate | no active event_key depends on it, or replacement published | deprecated | event; clients keep last render |
| draft | discard | — | (removed) | no event |

Live region dispatch:
| from | event | guard | to | side effect |
|---|---|---|---|---|
| idle | announce | no message in last 1 s | announcing | text written to region |
| announcing | announce (same text) | within 1 s | announcing | dropped |
| announcing | announce (new text) | — | announcing | replaces text |

## Validation & errors
See [PS-110-02](validation_rules.md).

## Authorization
Publish and deprecate: a11y change-control role only ([PS-110-05](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
See [PS-110-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Announcement text is not persisted client-side beyond the live region.

## Observability & budgets
Dispatch latency p95 ≤ 100 ms (ASSUMPTION).

## Tests
- TEST-PS-110-03-01 unit: each row of both tables.
- TEST-PS-110-03-02 unit: duplicate within 1 s dropped; after 1 s accepted.
- TEST-PS-110-03-03 integration: claim label for CLAIMED never contains "paid", "payment received" or "settled".

## Acceptance criteria
1. No undefined (state, event) pair in template tables.
2. Duplicate suppression holds in the unit test.
3. Claim-state announcements match the CTR-COM-001 label catalog in 100% of fixtures.

## Assumptions & open decisions
- ASSUMPTION: 1 s duplicate window.
- No Dxx decision directly affects this state machine.
