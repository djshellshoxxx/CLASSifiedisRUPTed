# PS-029-09 — contract and acceptance tests

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-029-09. **Owner:** [03_Services/01_service_catalog/mod_skills](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_skills (module ID F03.S01.M01). **Consumers:** shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); module-level notifications, evidence, moderation and observability per [module SPEC](SPEC.md).

## Purpose and scope
Defines the contract tests (producer and consumer side) and the acceptance tests that prove the other PS-029 specifications are implemented as written. Test IDs follow `TEST-PS-029-NN-Tnn`, where `NN` is the process file number. This file owns the cross-file suite `TEST-PS-029-09-Tnn`. No test has been run; this is a test specification only.

Exclusions: UI visual regression, device-farm matrix, and performance load generation (see observability file for budgets). Those are verification gates in later phases.

## Requirements
- PS-029-09.R01: Business outcome: any consumer or client built against this module can prove compatibility with the published command, query and event contracts, and reviewers can prove each acceptance criterion. Actors: module developers, consuming teams (notifications, moderation, evidence), reviewers. Exclusions as above.
- PS-029-09.R02: Case coverage: contract breaks (removed field, changed type, unknown enum); consumer on unknown schema version; error shape change; event replay; offline replay; idempotent replay; cross-participant access attempt; blocked participant; feature flag off; sweep race; import with invalid record.
- PS-029-09.R03: Accessibility and budgets: acceptance tests for the PWA flows include automated accessibility checks (no critical violations on the create, publish, pause and retire screens) and keyboard-only completion. Budgets are verified by the tests in the observability file.
- PS-029-09.R04: Every acceptance test links to a requirement ID in the other PS-029 files. A test without a requirement link is not accepted.
- PS-029-09.R05: Contract tests run on every change to the schemas in this directory. A breaking change without a `v2` identifier fails the build.
- PS-029-09.R06: Test fixtures use synthetic IDs only (ULIDs generated for tests) and approved test region codes. No real participant data is used.

## Fixtures
- Participants: `FX-P1` (owner), `FX-P2` (other), `FX-MOD1` (moderator with case), `FX-OP1` (operator), `FX-BLK` (blocked by F16), `FX-CLOSED` (closed account). IDs are generated per test run.
- Taxonomy: version 3 with `repair.bicycle` and `education.language` active, `legacy.typewriter` inactive.
- Regions: `AA-R07` active, `AA-R08` active, `AA-R99` inactive.
- Clock: controllable time source for expiry (180 days), draft inactivity (90 days) and retention (30, 180, 365 days).
- Feature flag: `skills.enabled` on for `AA-R07` only (A-skills-23).

## Contract tests
| Test ID | Contract | Pass criterion |
|---|---|---|
| TEST-PS-029-09-T01 | Command envelope (`idempotency_key`, `schema_version`, `expected_revision`) | All state-changing commands reject a missing or malformed field with no write |
| TEST-PS-029-09-T02 | Event envelope fields (CTR-EVT-001) | Every event type validates against the envelope and its payload schema |
| TEST-PS-029-09-T03 | Error envelope (CTR-ERR-001) | Every `SKILLS_*` code in the four validation, workflow, authorization and failure files appears in the error catalog with status and retryable flag matching the file |
| TEST-PS-029-09-T04 | Schema compatibility | Adding an optional field passes; removing a field, renaming it or changing its type fails without a `v2` identifier |
| TEST-PS-029-09-T05 | Unknown consumer version | A consumer receiving `schema_version: 2` rejects the message and does not guess |
| TEST-PS-029-09-T06 | Consumer dedupe | Same `event_id` delivered twice yields one side effect in a reference consumer |
| TEST-PS-029-09-T07 | Public projection | Search results validate against the public view schema and contain no excluded key |
| TEST-PS-029-09-T08 | Capability denial shape | Denied requests for an existing and a missing ID produce identical status and body shape |

## Acceptance tests (journeys)
| Test ID | Journey | Pass criterion |
|---|---|---|
| TEST-PS-029-09-T09 | Publish a new skill offer end to end | Draft created, updated, published; appears in region search; `SkillOfferPublished` emitted once |
| TEST-PS-029-09-T10 | Edit a published offer | Update accepted, revision +1, changed field names only in event; invalid edit rejected with the offer unchanged |
| TEST-PS-029-09-T11 | Expire and restore | Published offer moves to expired at expiry; renew restores it to published with a new `expires_at`; resume after expiry is rejected |
| TEST-PS-029-09-T12 | Duplicate offer | Second publish of the same owner, category and title returns `SKILLS_DUPLICATE_OFFER`; no second published record |
| TEST-PS-029-09-T13 | Concurrent edit | Two clients edit at the same revision; one applies, the other gets `SKILLS_REVISION_CONFLICT` and reread succeeds |
| TEST-PS-029-09-T14 | Blocked participant | Writes rejected with `SKILLS_PARTICIPANT_BLOCKED`; offers hidden from search; unblock restores visibility without state change |
| TEST-PS-029-09-T15 | Region without permission | Region selected from the approved catalog with no precise location captured; no coordinates appear in any stored or sent field |
| TEST-PS-029-09-T16 | No network | Edits queue locally; on reconnect each queued command replays once in FIFO order; a stale queued publish is not sent until reviewed |
| TEST-PS-029-09-T17 | Relay outage | Writes return `SKILLS_TEMPORARILY_UNAVAILABLE`; no partial rows; retries after recovery succeed |
| TEST-PS-029-09-T18 | Account recovery | Participant restored with the same `participant_id` sees the same offers; a new participant ID sees none (D10 default) |
| TEST-PS-029-09-T19 | Export and portability | Owner export contains own offers and transition summaries; another participant's data is absent |
| TEST-PS-029-09-T20 | Deletion | Closure of an account retires its offers and purges content after 30 days; tombstone remains |
| TEST-PS-029-09-T21 | Appeal of contact-data block | Blocked description resubmitted after moderation review is accepted only with the moderation case reference |
| TEST-PS-029-09-T22 | Feature flag off | Writes return `SKILLS_FEATURE_DISABLED`; reads of own offers still work; search returns no results for the region |

## Property tests
- Property P1: For any sequence of commands, the final state is reachable by the transition table in [workflow](workflow_state_machine.md) and revision equals the number of applied transitions plus updates.
- Property P2: For any two replays of the same command with the same key, the transition count is at most 1.
- Property P3: For any normalized title, the stored value is NFC, trimmed and has no control characters.

## Assumptions
- A-skills-23: Feature flag `skills.enabled` is off by default in every region until the release gate. Tests use it explicitly.

## Open decisions
- Choice of test framework and contract tooling is an implementation decision for a later phase.
- Whether automated accessibility checks are a release blocker or advisory (depends on the PWA accessibility policy, not defined here).

## Testing
- TEST-PS-029-09-T23: All tests T01 to T22 and properties P1 to P3 exist with a requirement link. Pass when the traceability check finds every test linked and no orphan requirement IDs in the PS-029 files.
- TEST-PS-029-09-T24: Breaking change injected into the event schema fails the build. Pass when the build fails with a compatibility error.
