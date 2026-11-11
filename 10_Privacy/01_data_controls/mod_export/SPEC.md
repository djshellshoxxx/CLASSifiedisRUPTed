# F10.S01.M03 — Data export

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F10.S01](../SPEC.md). **Process IDs:** PS-078-01…PS-078-10. **Code:** `packages/privacy/src/data_controls/export`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Builds the user's complete data export from their vault. The orchestrator asks every module that owns user data for its export section through the ExportSectionPort defined here, passes every record through redactForExport of the F10.S02.M02 classification model, streams them into a classrup-export/v1 JSON Lines bundle, writes a manifest as the first line with counts, a SHA-256 and an exportedAt time per section, and signs the manifest with the user's device Ed25519 key. Vaults whose media exceed the 2 GiB bundle limit export a linked multi-part set split by media date. The finished bundle is stored encrypted in the browser's private file storage and can be downloaded for 7 days, after which it is deleted and its key shredded. The vault export is the primary backup (IOX-6), and nothing leaves the device unless the user saves the file somewhere.

## Responsibilities

- Own ExportJob - request, collect, ready, expired, failed and cancelled with per-section progress.
- Define the ExportSectionPort contract and discover export sections through the kernel port registry at vault composition (inverted registration, so modules that cannot list this module in depends_on without a cycle, such as F07.S01.M01, F15.S01.M01, F15.S04.M03, F18.S01.M01 and F18.S02.M01, register without an edge), with at least one section per module that owns user data and every section name owned by exactly one module (IOX-5), failing the build in CI when a module that owns user data has none.
- Produce the bundle as JSON Lines - manifest first {format, exportedAt, accountId, did, modules[], counts, sha256 per section, sectionExportedAt per section, part?}, then {schema, record} lines, with media as chunked blob records.
- Sign the manifest with the principal's device key and verify it before declaring the job ready.
- Store the bundle encrypted with a per-job key, serve it for 7 days, and delete it and shred the key at expiry, on user cancel or in the deletion shred step.
- Include all P0 to P3 data the user owns and exclude other users' P2 and higher content except the user's own copies of shared messages and consents (IOX-1), by calling redactForExport (F10.S02.M02) on every record, which also drops every P4 and unclassified path.
- Split an export whose media would exceed 2 GiB into a linked set of up to 8 parts by media date.

## Not responsible for

- Defining each module's section content; the module that owns a record owns its section (IOX-5).
- Importing bundles; the vault restore flow validates, dry-runs and commits (IOX-2), including multi-part sets.
- Relay backups (F15.S03.M02) and deletion (F10.S01.M04), which calls this module's DeletionPort directly.
- Consent records (F10.S01.M01), which contribute the section privacy.consents through ExportSectionPort and are never called by this module.
- Future: scheduled automatic exports to a user-selected encrypted location and partial exports by module selection.

## User stories

- As a user, I request my data and get one file I can keep as a backup, with a signature that proves it was not altered.
- As a user, I can choose to include my photos and see the size before I start.
- As a user about to delete my account, I am offered an export first and I can download it for 7 days.
- As a user with more than 2 GiB of photos, I export my data as a small set of linked files split by photo date, each verifiable on its own.

## Edge cases

- A module fails to produce its section after 3 retries; the whole job fails with PRIVACY_EXPORT_SECTION_FAILED naming the module, never a silent partial bundle.
- The bundle would exceed 2 GiB; the job refuses a single-file request with PRIVACY_EXPORT_QUOTA and offers to exclude media or to export a multi-part set split by media date, where part 1 holds every non-media section plus the media of its date range and later parts hold only media of their ranges.
- The device key used for signing is revoked mid-job; the job restarts the signature step with the current key and records the key ID.
- The user closes the PWA during collection; the 30-minute active-time clock pauses, and the job resumes from the last completed section on next open if that is within 24 h of its last activity, otherwise it fails with errorCode EXPIRED.
- A job stays in requested because the PWA was closed before collection started; after 24 h it fails with errorCode EXPIRED so a new request is possible.
- The download is requested on day 8; the bundle is gone, the job is expired, and a new request is required.
- Storage quota is insufficient for the encrypted bundle; the job fails early with PRIVACY_EXPORT_QUOTA and reports the bytes needed.
- The user requests a fourth export within 24 hours; refused with RATE_LIMITED.
- A second request with a new command ID while a job is collecting; refused with PRECONDITION_FAILED and params.activeJobId, while the same command ID replays the stored result.
- Two modules register the same section name, for example two registrants of federation.records; vault composition fails and CI names both modules, so no bundle ever mixes their lines.
- A module registered through the kernel port registry without a depends_on edge (F15.S01.M01 platform.outbox) is missing at composition; the build-time conformance check fails, and at runtime the job fails with PRIVACY_EXPORT_SECTION_FAILED naming the missing module instead of producing a bundle without its section.
- The governance modules F18.S01.M01 and F18.S02.M01 register their sections from the vault composition root because a depends_on edge to this module would close the cycle F10.S01.M03 -> F10.S01.M02 -> F18.S01.M01 -> F18.S02.M01; the bundle still carries governance.profile_selection with the owner's age declaration and the governance comment, trusted-publisher and pending-statement sections.

## UX and accessibility

- Export screen: explanation of what is included and what is not, include media toggle with estimated size, a multi-part choice with date ranges when media exceed 2 GiB, Request export button requiring a fresh unlock.
- Progress list: one row per module section with state and counts, overall bytes written, Cancel button.
- Ready card: file name, size, expiry date and time, part n of m for multi-part sets, Download button, signature fingerprint with Copy, and the sentence 'This file is not encrypted for transport; store it safely.'
- Export notice: after every started export a persistent in-app notice 'An export of your data was created on <time>' with a link to the export list, shown on every screen until dismissed.

**States:** idle; needs-unlock; collecting; ready; expired; failed; cancelled; quota-error

**Accessibility:** Progress is exposed as a labelled progressbar with percentage text and polite announcements at 25 percent steps.; Section states use text and icon, not color alone.; Request, Cancel and Download buttons are at least 44 by 44 px with distinct accessible names.

## Owned data

- `ExportJob` (classrup.privacy.export_job/v1, P3, RET-SHORT)

## Interfaces

- Commands: `privacy.export.request`, `privacy.export.cancel`, `privacy.export.open_download`
- Queries: `privacy.export.get`, `privacy.export.list_mine`
- Emits: `privacy.export.ready`, `privacy.export.failed`, `privacy.export.expired`
- Consumes: `privacy.deletion.requested`, `privacy.deletion.completed`, `identity.device_key.revoked`

## Dependencies

F07.S01.M01, F10.S02.M02, F10.S01.M02, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-078-01 | [Domain schema](domain_schema.md) | 4 |
| PS-078-02 | [Validation rules](validation_rules.md) | 3 |
| PS-078-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-078-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-078-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-078-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-078-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-078-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-078-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-078-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/privacy/src/data_controls/export/index.ts`.

## Acceptance criteria

- All tests T01 to T24 pass in CI.
- A bundle from a seeded vault imports into a fresh vault with identical record counts and a verifying signature.
- No bundle contains P4 secrets, unclassified fields or other users' private content.
- A ready bundle is unreachable after 7 days and its key is gone.
- A vault with more than 2 GiB of media can produce a complete, linked multi-part export.
