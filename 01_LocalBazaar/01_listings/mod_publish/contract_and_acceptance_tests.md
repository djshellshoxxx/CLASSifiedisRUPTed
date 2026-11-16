# PS-004-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_publish. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (TEST-01 to TEST-04), CTR-ERR-001 (TEST-01 to TEST-05), CTR-CAP-001 (TEST-02, -03), CTR-SCH-001 (consumer-driven tests, TD-03). **Pending:** PENDING CTR-MOD-001 (consumer contract for `cas.cleared`, `cas.rejected`), PENDING CTR-LST-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-004-09.R01 | Producer contract: `lst.publish` request, response, error and the three events validate against fixtures. | MVP |
| PS-004-09.R02 | Consumer contract: this module accepts `cas.cleared` and `cas.rejected` from every supported F12 version (PENDING CTR-MOD-001). | MVP |
| PS-004-09.R03 | Every PUB code and every T1–T9 transition has at least one automated test. | MVP |
| PS-004-09.R04 | Acceptance suite runs in CI on every change; failure blocks merge. | MVP |

## Tests
| ID | Type | Scenario | Expected |
|---|---|---|---|
| TEST-PS-004-09-01 | contract | Request, response, error and event fixtures | Valid pass; one invalid fixture per violation fails |
| TEST-PS-004-09-02 | concurrency | 50 parallel `lst.publish` on revision N | 1 published, 49 EVT.REVISION_CONFLICT |
| TEST-PS-004-09-03 | idempotency | Same key and digest; same key, different body | Same `event_id`, no second event; EVT.IDEMPOTENCY_KEY_REUSED |
| TEST-PS-004-09-04 | negative integration | Other owner's draft vs nonexistent ID | Identical SYS.NOT_FOUND except request_id |
| TEST-PS-004-09-05 | privacy | Email, phone, street in title or description | held_review with `personal_data_suspected`; no matched text stored |
| TEST-PS-004-09-06 | state | `lst.publish` on held, published, archived | PUB.HOLD_ACTIVE, PUB.INVALID_STATE, PUB.INVALID_STATE |
| TEST-PS-004-09-07 | offline | Queued publish replayed after hold | "Not applied" with `err.pub.hold_active`; no state change |
| TEST-PS-004-09-08 | fault | Risk service delayed 500 ms | held_review with `risk_review`; never published |
| TEST-PS-004-09-09 | a11y | Keyboard-only publish; screen-reader status; colour removed | Focus reaches control; one polite announcement; state label present; contrast ≥ 4.5:1 |
| TEST-PS-004-09-10 | e2e | Draft → publish → discovery | Listing discoverable within 60 s in seeded env |

## Assumptions & open decisions
- PROVISIONAL (D01 default, unapproved): federated `listing.published` fixtures follow the signed-envelope rules (CTR-FED-001).
- PROVISIONAL (D08 default, unapproved): offline fixture TEST-PS-004-09-07 follows the pending-queue rule.
- PENDING CTR-MOD-001 and PENDING CTR-LST-001 fixtures are stubs until owners publish schemas; no test is marked passing against a stub.

## Fixtures
Fixtures are JSON files under the module test directory, one per row of the request, response, event and error examples in PS-004-04. Each fixture declares its expected code or event.

## Acceptance criteria
1. TEST-PS-004-09-01 to -10 pass in CI.
2. Every PUB code and every T1–T9 row is covered by at least one test (coverage matrix published with the build).
3. Consumer contract tests pass against F12 fixtures once PENDING CTR-MOD-001 is resolved.
4. Test failures block merge; no test is skipped in the release branch.
