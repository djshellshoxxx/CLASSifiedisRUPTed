# PS-001-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (golden fixtures, R09), CTR-EVT-001 (envelope and idempotency tests), CTR-ERR-001 (code registry), CTR-CAP-001 (authorization matrix). **Owner of QA gate:** QA Lead (F17). **Decisions:** D01, D08 (defaults PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-09.R01 | Every command, query and event in PS-001-04 has contract tests against CTR-SCH-001 schema and fixtures. | MVP |
| PS-001-09.R02 | Every error code in PS-001-02 has one negative test that asserts code, category and retryable flag. | MVP |
| PS-001-09.R03 | Every row of the PS-001-03 transition table and the PS-001-05 matrix has one test. | MVP |
| PS-001-09.R04 | Property test: any sequence of archive and restore commands keeps invariants of PS-001-01 and revision +1 per accepted command. | MVP |
| PS-001-09.R05 | Offline test: queued archive replays after reconnect exactly once. | MVP |
| PS-001-09.R06 | Accessibility: archive and restore controls and confirmation pass WCAG 2.1 AA checks (Accessibility Lead, F14). | MVP |

## Tests
| Test ID | Type | Scenario |
|---|---|---|
| TEST-PS-001-09-01 | unit | Reason enum rejects free text and unknown values |
| TEST-PS-001-09-02 | unit | Revision mismatch returns `EVT.REVISION_CONFLICT` with no write |
| TEST-PS-001-09-03 | integration | Archive of PUBLISHED listing emits `listing.archived` revision +1, de-indexes ≤ 60 s |
| TEST-PS-001-09-04 | integration | Restore re-runs publish validators; failure leaves ARCHIVED and no event |
| TEST-PS-001-09-05 | integration | Owner restore of moderator archive returns `ARCHIVE.MODERATION_LOCKED` |
| TEST-PS-001-09-06 | integration | Archive blocked by open `cyc_` reference; succeeds after reference closes |
| TEST-PS-001-09-07 | property | Random command sequences keep invariants and monotonic revision |
| TEST-PS-001-09-08 | integration | Replay of same key returns original response; different digest → `EVT.IDEMPOTENCY_KEY_REUSED` |
| TEST-PS-001-09-09 | fault injection | Timeout after commit, client retry produces one event |
| TEST-PS-001-09-10 | authorization | Full PS-001-05 matrix including non-owner `SYS.NOT_FOUND` vs `SYS.FORBIDDEN` |
| TEST-PS-001-09-11 | negative/abuse | 11th transition in 24 h → `ARCHIVE.TRANSITION_RATE_LIMITED` |
| TEST-PS-001-09-12 | privacy | Serialized events and logs contain no free text, no coordinates, no case ID in owner view |
| TEST-PS-001-09-13 | e2e | Owner archives on device A; device B (offline, queued restore) reconciles to revision conflict |
| TEST-PS-001-09-14 | a11y | Screen-reader announcement on archive success and error |
| TEST-PS-001-09-15 | load | Budgets in PS-001-08 under 2× expected peak |

## Acceptance criteria
1. All 15 tests above pass in CI with fixtures under `fixtures/listing.archived/1.0.0/`.
2. Every error code in PS-001-02 is emitted by at least one test.
3. No test requires a real third-party service.
4. Security and privacy review sign-off is recorded by the owners (F10, F16). Not claimed until recorded.
