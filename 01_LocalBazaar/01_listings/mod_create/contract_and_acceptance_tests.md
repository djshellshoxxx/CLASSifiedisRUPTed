# PS-002-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_create. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001, CTR-SCH-001, CTR-PRV-001 (all test suites are cross-checked against these).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-002-09.R01 | Every request, response, event and error produced by create validates against its registered schema or registry entry. | MVP |
| PS-002-09.R02 | Every error code emitted is in CTR-ERR-001 or in this module's list (`LST.FIELD_INVALID`, `LST.TYPE_DISABLED`, `LST.ACCOUNT_NOT_ELIGIBLE`, `LST.DRAFT_LIMIT_REACHED`), with matching category and HTTP status. | MVP |
| PS-002-09.R03 | Acceptance scenarios run on a 360 px mobile viewport, keyboard-only, and offline with reconnect. | MVP |
| PS-002-09.R04 | The create form meets WCAG 2.1 AA for error identification and input labels (ASSUMPTION: target). | MVP |

## Data / schema
Contract fixtures: one valid and one invalid per schema in PS-002-04 and PS-002-02, plus one per CTR-EVT-001 and CTR-ERR-001 example violation.

## Commands / queries / events
Covers `listing.create` and `listing.created` end to end.

## States & transitions
Covered by TEST-PS-002-03-01 (PS-002-03).

## Validation & errors
Module error codes use the `LST` token because CTR-ERR-001 R02 requires an uppercase module token. Message keys: `err.lst.field_invalid`, `err.lst.type_disabled`, `err.lst.account_not_eligible`, `err.lst.draft_limit_reached`. A missing catalog key falls back to `err.sys.internal`.

## Authorization
Each acceptance flow is run for owner, non-owner and operator principals.

## Failure, idempotency, concurrency, offline
Offline and reconnect flows reuse PS-002-06 fixtures.

## Privacy, retention, abuse
Fixtures use synthetic data only. No real personal data in test corpora.

## Observability & budgets
Contract suite runtime ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-002-09-01 (contract): `listing.created` validates against the CTR-EVT-001 envelope schema.
- TEST-PS-002-09-02 (contract): every error in fixtures is in the registry with correct retryable, category and HTTP status (CTR-ERR-001 TEST-02, TEST-03).
- TEST-PS-002-09-03 (e2e, mobile): create a sell draft on 360 px; the draft is absent from search and other users' views until mod_publish runs.
- TEST-PS-002-09-04 (a11y): keyboard-only create; each `details[].field` maps to a labelled control; errors are announced to screen readers; no horizontal scroll at 360 px.
- TEST-PS-002-09-05 (offline): create offline shows `pending_local`; after reconnect exactly one draft exists.

## Acceptance criteria
1. All contract fixtures pass in CI.
2. TEST-PS-002-09-03 to -05 pass on the supported mobile and desktop browsers.
3. No test depends on a real account, real location or real currency rate.
4. TEST-PS-002-09-01 to -05 pass in CI.

## Assumptions & open decisions
- OPEN: named contract owners (F15, F16, F10) are UNASSIGNED in CONTRACTS, so the contracts are not yet reviewed.
- ASSUMPTION: WCAG 2.1 AA as the accessibility target; F14 owns the final locale list (CTR-ERR-001 OPEN).
- PROVISIONAL (D08 default, unapproved): offline tests follow the local queue model.
