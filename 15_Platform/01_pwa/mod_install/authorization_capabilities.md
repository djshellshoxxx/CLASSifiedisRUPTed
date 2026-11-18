# PS-115-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_install. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-115-05.R01 | Installing the app grants no permissions. Push, location and camera permissions are requested only by their own modules and never inside the install flow. | MVP |
| PS-115-05.R02 | Install prompt cannot be triggered by page scripts without a user gesture (browser rule; module never calls it without one). | MVP |
| PS-115-05.R03 | Clear-data is available only to the signed-in user or on the sign-out screen; it deletes no server data. | MVP |

## Data / schema
No capability records. Access is by user gesture and origin.

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Not applicable.

## Authorization
Local only; server authorization is not involved.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
Clear-data never deletes server-side records; the UI says so.

## Observability & budgets
None.

## Tests
- TEST-PS-115-05-01 (e2e): install flow does not request notification permission.
- TEST-PS-115-05-02 (unit): prompt call only from click handler.
- TEST-PS-115-05-03 (e2e): clear-data UI states that account data on the server is unaffected.
- TEST-PS-115-05-04 (security): page script cannot invoke install prompt without gesture (test harness).

## Acceptance criteria
1. No permission request in install path.
2. Gesture rule verified.
3. Copy verified.

## Assumptions & open decisions
- ASSUMPTION: clear-data available on sign-out screen.
- No Dxx applies.
