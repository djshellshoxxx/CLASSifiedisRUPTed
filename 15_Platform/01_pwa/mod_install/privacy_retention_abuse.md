# PS-115-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_install. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-115-07.R01 | Install and update state never leaves the device; no analytics in MVP (ASSUMPTION). | MVP |
| PS-115-07.R02 | No third-party install attribution or SDK. | MVP |
| PS-115-07.R03 | Manifest is static and same-origin; no user-controlled name or icon. | MVP |
| PS-115-07.R04 | Device detection uses feature checks, not device fingerprints. | MVP |
| PS-115-07.R05 | Dismissal cooldown is stored as one timestamp; no profile link. | MVP |

## Data / schema
| Field | Class | Retention |
|---|---|---|
| install.dismissed_at | device-local, non-personal | until cleared |

## Commands / queries / events
None.

## States & transitions
Clear-data removes the cooldown key.

## Validation & errors
Not applicable.

## Authorization
See authorization_capabilities.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
- Abuse: fake install buttons on phishing sites; the real prompt comes only from the browser, and the app's name is fixed.
- Abuse: prompt fatigue; cooldown R02 of workflow file.
- Shared device: clear-data removes caches and cooldown.

## Observability & budgets
None.

## Tests
- TEST-PS-115-07-01 (contract): network trace has no install-related requests.
- TEST-PS-115-07-02 (unit): no third-party script in install path.
- TEST-PS-115-07-03 (unit): manifest identical across user sessions (hash check).
- TEST-PS-115-07-04 (integration): clear-data removes cooldown key.

## Acceptance criteria
1. Network scan passes.
2. Manifest hash constant across sessions.
3. Privacy Lead review pending.

## Assumptions & open decisions
- ASSUMPTION: no install analytics in MVP.
- D07 PROVISIONAL (D07 default, unapproved) for local data lifetime.
