# F17.S03.M03 — Compatibility

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S03](../SPEC.md). **Process IDs:** PS-142-01…PS-142-10. **Code:** `tests/compat`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Compatibility tests that keep older data and clients working. Schema N-1 tests check that the current code reads records, signed statements and export bundles written by the previous release (CTR-SCH-001) and that vault IndexedDB migrations upgrade N-1 vaults without loss; signed envelopes from older releases still verify. Forward-compatible statement additions travel only in ext under CTR-SCH-001 SCH-2, and an IndexedDB version bump is handled by restore rather than by an N-1 read. API versioning checks protect relay endpoints. A browser support matrix runs smoke journeys on automated cells CI can actually run, each labelled with its real engine source and version (Chrome N and N-1 via version-pinned Chrome for Testing, Chrome beta via the Playwright channel, the Playwright Firefox build and the Playwright WebKit build as a Safari-engine proxy labelled WebKit), and records Firefox stable, real Safari and iOS Safari (last 2) and iOS 16.4+ installed-PWA Web Push as manual release checklist cells with an approver.

## Responsibilities

- Maintain fixtures of the previous release (N-1): vault snapshots, exported bundles, signed statements and relay API recordings; test that the current release reads them and that a vault upgraded from N-1 round-trips exactly.
- Check CTR-SCH-001 SCH-2 forward compatibility of signed statements: an unknown key in a statement payload outside ext is rejected with VALIDATION_FAILED; forward-compatible additions travel in ext, are preserved byte-exact so cid and signature still verify, and are capped at 4 KiB; an ext key named in the critical-extension list ext.crit that an N-1 reader does not understand makes that reader refuse the statement; unknown major schema versions are refused with UNSUPPORTED_SCHEMA_VERSION.
- Define and run the browser support matrix as cells that declare their engine source. Automated cells (nightly and release, ubuntu-24.04): Chrome N and N-1 from version-pinned Chrome for Testing downloads, Chrome beta through the Playwright chrome-beta channel, the Firefox engine as the Playwright Firefox build of the pinned release, and the WebKit engine as the Playwright WebKit build, a Safari-engine proxy labelled WebKit and never Safari; each labelled with its real engine version. Manual cells (release checklist, level manual, signed with device, OS, browser version and approver): Firefox stable N and N-1, Safari desktop last 2, iOS Safari last 2, and iOS 16.4 or later installed-PWA Web Push.
- Check relay API versioning: /api/v1 paths unchanged, additive-only changes within a major, deprecation headers present, and generated OpenAPI diff against the previous release shows no breaking change.

## Not responsible for

- Implementing migrations (F15.S02.M03 and each module).
- General e2e journeys on the pinned Chromium (F17.S01.M04).
- Policy of schema evolution (CTR-SCH-001).
- Future: automated testing on real Safari, Firefox stable and iOS devices (macOS runners are future in F17.S03.M01) and on N-2 releases.

## User stories

- As a user with an older vault, I upgrade the app and all my records, drafts and signed statements are still there and valid.
- As a relay operator, I upgrade to a new release without breaking clients on the previous minor version.
- As a product owner, I see a support matrix report telling me which engine builds passed automated smoke journeys and which real browsers were checked by hand, by whom and on which device.

## Edge cases

- A record written by N-1 lacks a field added in N; the reader supplies the documented default and the record validates.
- A signed statement from N-1 uses an older canonical form; verification still succeeds because signature covers its original JCS bytes.
- The vault upgrade is interrupted midway (tab closed); the next start resumes or rolls back and no record is lost or duplicated.
- Safari lacks a feature (for example Web Push outside installed PWAs); the app degrades with a visible message rather than failing.
- A relay API response (not a signed statement payload) carries an unknown additive field; clients ignore it per SCH-3.
- A statement from N carries an unknown key in its payload outside ext; N-1 rejects it with VALIDATION_FAILED instead of dropping the key and acting on a broader promise than was signed.
- A statement from N adds a new restriction in ext and lists it in ext.crit; an N-1 reader that does not understand it refuses the statement.
- Release N bumps the IndexedDB version for a new object store; N-1 code opening the database gets VersionError, catches it, offers restore from the pre-upgrade export kept by N, and never opens partially.
- An automated WebKit run passes; the report says WebKit (Playwright build) and the Safari cells stay pending until their manual checklist is signed.
- An export from the newer release is imported into N-1; unknown major versions are refused clearly rather than partially imported.

## UX and accessibility



Headless. Outputs are a compatibility report (reports/compat.json and compat.md) and a browser matrix table of pass, fail and unsupported per journey.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-SCH-001, CTR-ERR-001, CTR-FED-001, CTR-IOX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F15.S02.M03, F11.S01.M02, F11.S01.M03, F10.S01.M03

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-142-01 | [Domain schema](domain_schema.md) | 3 |
| PS-142-02 | [Validation rules](validation_rules.md) | 3 |
| PS-142-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-142-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-142-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-142-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-142-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-142-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-142-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-142-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `tests/compat/index.ts`.

## Acceptance criteria

- The current release reads all N-1 vaults, bundles and signed statements with zero loss and all signatures verifying.
- A planted breaking schema or API change fails the compatibility checks.
- Every automated matrix cell (Chrome N, N-1 and beta, Playwright Firefox and WebKit builds) passes smoke with its real engine labelled, and the manual Firefox stable, Safari, iOS Safari and iOS 16.4+ installed-PWA push cells have signed passing checklists; no automated run reports Safari.
- An unknown statement payload key outside ext is rejected, and ext additions are preserved byte-exact and re-verify.
- An interrupted vault upgrade loses and duplicates no record.
