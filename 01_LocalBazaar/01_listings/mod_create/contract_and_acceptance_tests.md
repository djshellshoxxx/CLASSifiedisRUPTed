# PS-002-09 — Contract and acceptance tests: Listing creation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M01 Listing creation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/create` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-002-09.R01** Every requirement is covered by at least one automated test.
- **PS-002-09.R02** Contract tests validate command results and event payloads against the schema registry.
- **PS-002-09.R03** Location and privacy rules have negative tests that fail the build when weakened.
- **PS-002-09.R04** The create wizard and drafts list pass automated accessibility checks with zero serious or critical issues and keyboard-only region selection.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault with principal P1 (did:key), fixed clock 2026-11-04T10:00:00Z, policy pack with 3 categories (one retired), blob store with one clean jpeg and one jpeg with GPS EXIF.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-002-09.T01 | unit | PS-002-01.R01, PS-002-02.R01 | create a valid sell draft | Listing stored with status draft, revision 1; unknown field rejected |
| TEST-PS-002-09.T02 | unit | PS-002-02.R02, PS-002-02.R03 | violate each rule V01-V12 in turn | the documented error code is returned and nothing is stored |
| TEST-PS-002-09.T03 | property | PS-002-03.R01, PS-002-03.R02 | random sequences of apply_status calls | only declared transitions succeed, including expired -> closed and published -> published on renew; others return CONFLICT_STATE |
| TEST-PS-002-09.T04 | integration | PS-002-03.R03, PS-002-07.R02 | delete draft | tombstone with id, type, deletedAt exists; content and blob keys purged after 30 days (clock advance) |
| TEST-PS-002-09.T05 | contract | PS-002-04.R01, PS-002-09.R02 | each command runs | outputs and bazaar.listing.created/deleted payloads validate against registry schemas; no command enqueues a statement |
| TEST-PS-002-09.T06 | integration | PS-002-04.R03, PS-002-05.R01 | query another principal's listing id | NOT_FOUND; list_mine returns only own listings |
| TEST-PS-002-09.T07 | abuse | PS-002-03.R02, PS-002-05.R02, PS-002-05.R03 | UI-context dispatch of apply_status and a network spy during create | FORBIDDEN for non-sibling callers; zero network requests |
| TEST-PS-002-09.T08 | integration | PS-002-06.R01, PS-002-06.R02 | replay create with same key (same and different body) and two tabs editing | original result replayed; IDEMPOTENCY_KEY_REUSED; second tab CONFLICT_REVISION |
| TEST-PS-002-09.T09 | chaos | PS-002-04.R02, PS-002-06.R03 | abort the IndexedDB transaction after the outbox write | neither the listing nor the outbox event persists |
| TEST-PS-002-09.T10 | abuse | PS-002-07.R01, PS-002-07.R03, PS-002-09.R03 | create with lat/lon, region of 6 characters and GPS jpeg | all rejected; log scan finds no P3 values |
| TEST-PS-002-09.T11 | load | PS-002-08.R02, PS-002-08.R03 | 2 000 listings on Moto G profile | create p95 <= 50 ms, list p95 <= 100 ms, purge sweep <= 500 ms |
| TEST-PS-002-09.T12 | unit | PS-002-08.R01 | run commands with diagnostics on | counters increment locally and no network request is made |
| TEST-PS-002-09.T13 | unit | PS-002-09.R01 | traceability tool run | every PS-002 requirement maps to a passing test |
| TEST-PS-002-09.T14 | integration | PS-002-10.R01, PS-002-10.R02, PS-002-10.R03 | export, import into a fresh vault, then import a record with foreign ownerId | owned listings round-trip identical; foreign record kept read-only |
| TEST-PS-002-09.T15 | a11y | PS-002-09.R04 | axe run on wizard and drafts list | zero serious or critical issues; keyboard-only region selection works |
| TEST-PS-002-09.T16 | unit | PS-002-01.R03 | apply_edit with a patch containing kind or ownerId, and apply_status attempting to change kind | VALIDATION_FAILED; stored kind and ownerId unchanged; revision not incremented |
| TEST-PS-002-09.T17 | integration | PS-002-01.R02 | create, edit and delete drafts with a network spy, then inspect the sync outbox | zero network requests; no outbox entry has a destination or payload derived from a draft; stored record validates as classrup.bazaar.listing_record/v1, never as the projection schema |
| TEST-PS-002-09.T18 | property | PS-002-03.R04, PS-002-03.R01 | random apply_status calls including reason relay_notice and a relay removal processed by F01.S01.M03 | relay_notice refused with VALIDATION_FAILED; Listing.status unchanged by any relay removal |
| TEST-PS-002-09.T19 | integration | PS-002-07.R04 | export section, deletion plan and retention purge through the F10 ports | section bazaar.listings lists every own listing with field classes; deletion plan tombstones and purges all; CI lint fails on an injected unannotated field |

## Acceptance criteria

- All tests T01-T19 pass in CI.
- No draft or listing payload leaves the device from this module (network spy test).
- No stored Listing field can hold coordinates or an address, region cells never exceed 5 characters, and no relay notice changes Listing.status.

## Dependencies

Module depends on: F18.S01.M03, F15.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FLG-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
