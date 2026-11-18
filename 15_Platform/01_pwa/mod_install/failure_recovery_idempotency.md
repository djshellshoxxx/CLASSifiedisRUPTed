# PS-115-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_install. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-115-06.R01 | If the prompt event is missing or fails, show manual instructions; no error page. | MVP |
| PS-115-06.R02 | If service worker update fails, keep the current build and retry on next load. | MVP |
| PS-115-06.R03 | If storage is blocked (private browsing), the app runs; install-dismissal cooldown is not persisted. | MVP |
| PS-115-06.R04 | Update reload preserves drafts by saving them to the pending queue before reload (D08 PROVISIONAL). | MVP |

## Data / schema
None beyond `install.dismissed_at`.

## Commands / queries / events
All operations idempotent (PS-115-04.R03).

## States & transitions
See workflow_state_machine.

## Validation & errors
Runtime codes use message keys so the client shows localized text.

## Authorization
Not applicable.

## Failure, idempotency, concurrency, offline
- Two tabs: install state is per browser; update applies in all tabs after reload.
- Browser update blocked by policy: app remains on current build; no loop of reload prompts.

## Privacy, retention, abuse
Failure logs are local only and contain codes.

## Observability & budgets
Local counters only.

## Tests
- TEST-PS-115-06-01 (integration): missing prompt shows instructions.
- TEST-PS-115-06-02 (integration): update failure keeps current build.
- TEST-PS-115-06-03 (integration): private mode runs without persisting cooldown.
- TEST-PS-115-06-04 (integration): draft saved to queue before update reload.

## Acceptance criteria
1. Each failure path has a test.
2. No reload loop in fixtures.
3. Draft preservation verified.

## Assumptions & open decisions
- D08 PROVISIONAL (D08 default, unapproved).
