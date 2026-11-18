# PS-115-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_install. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-115-03.R01 | Install state is derived each load from `display-mode` media query and the deferred prompt event. | MVP |
| PS-115-03.R02 | Dismissed prompt is not re-shown for 30 days (ASSUMPTION). | MVP |
| PS-115-03.R03 | Update waiting is shown as a notice; the user chooses when to reload. | MVP |
| PS-115-03.R04 | Clear-data is blocked while pending writes exist, unless the user confirms loss with the count shown. | MVP |

## Data / schema
Inputs: `matchMedia('(display-mode: standalone)')`, `beforeinstallprompt` (held in memory), `appinstalled`, service worker `waiting` state, `install.dismissed_at`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| not_installed | `beforeinstallprompt` captured | none | install_available | prompt held, not shown |
| install_available | user activates "Install app" | prompt held | installed (on accept) or install_available (on dismiss) | dismiss sets `install.dismissed_at` |
| install_available | dismissed | none | install_available (cooldown) | no prompt for 30 days |
| not_installed (iOS Safari) | user opens instructions | none | not_installed | show steps; no prompt API |
| any | `appinstalled` | none | installed | local only |
| installed | app opened in browser tab | none | installed | none |
| any | new service worker waiting | none | update_waiting | show reload notice |
| update_waiting | user accepts reload | no unsent drafts (or confirmed) | (new build active) | reload |
| any | "clear data" confirmed | R04 | not_installed or install_available | purge via mod_cache |

## Validation & errors
`INSTALL.PROMPT_UNAVAILABLE` shown as manual instructions path.

## Authorization
Not applicable.

## Failure, idempotency, concurrency, offline
Derived states are idempotent. Offline: install works from cache shell; update waiting only when online.

## Privacy, retention, abuse
State never sent to server (PS-115-07).

## Observability & budgets
None (local only in MVP).

## Tests
- TEST-PS-115-03-01 (unit): each transition row covered.
- TEST-PS-115-03-02 (e2e): install flow in Chromium with simulated prompt event.
- TEST-PS-115-03-03 (integration): update notice shown; reload blocked while draft exists.
- TEST-PS-115-03-04 (integration): clear data blocked when pending queue has items.

## Acceptance criteria
1. No automatic prompt in any fixture.
2. Update reload never discards a draft silently.
3. Clear-data guard verified.

## Assumptions & open decisions
- ASSUMPTION: 30-day cooldown.
- D08 PROVISIONAL (D08 default, unapproved) for pending-queue guard.
