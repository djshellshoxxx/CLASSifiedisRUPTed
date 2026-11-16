# F10.S01.M03 — Data export

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F10.S01](../SPEC.md). **Process IDs:** PS-078-01…PS-078-10. **Code:** `packages/privacy/src/data_controls/export`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Builds the user's complete data export from their vault. The orchestrator asks every module that owns user data for its export section, streams them into a single classrup-export/v1 JSON Lines bundle, writes a manifest as the first line with counts and a SHA-256 per section, and signs the manifest with the user's device Ed25519 key. The finished bundle is stored encrypted in the browser's private file storage and can be downloaded for 7 days, after which it is deleted and its key shredded. The vault export is the primary backup (IOX-6), and nothing leaves the device unless the user saves the file somewhere.

## Responsibilities

- [object Object]
- Discover export sections through the ExportSectionPort registry (one section per owning module, IOX-5) and fail the build in CI when a module that owns user data has none.
- [object Object]
- Sign the manifest with the principal's device key and verify it before declaring the job ready.
- Store the bundle encrypted with a per-job key, serve it for 7 days, and delete it and shred the key at expiry or on user cancel.
- Include all P0 to P3 data the user owns and exclude other users' P2 and higher content except the user's own copies of shared messages and consents (IOX-1).

## Not responsible for

- Defining each module's section content; the module that owns a record owns its section (IOX-5).
- Importing bundles; the vault restore flow validates, dry-runs and commits (IOX-2).
- Relay backups (F15.S03.M02) and deletion (F10.S01.M04).
- Future: scheduled automatic exports to a user-selected encrypted location and partial exports by module selection.

## User stories

- As a user, I request my data and get one file I can keep as a backup, with a signature that proves it was not altered.
- As a user, I can choose to include my photos and see the size before I start.
- As a user about to delete my account, I am offered an export first and I can download it for 7 days.

## Edge cases

- A module fails to produce its section after 3 retries; the whole job fails with PRIVACY_EXPORT_SECTION_FAILED naming the module, never a silent partial bundle.
- The bundle would exceed 2 GiB; the job asks the user to exclude media or export in two parts by media date and refuses to start otherwise.
- The device key used for signing is revoked mid-job; the job restarts the signature step with the current key and records the key ID.
- The user closes the PWA during collection; the job resumes from the last completed section on next open, within 24 h, otherwise it fails with EXPIRED.
- The download is requested on day 8; the bundle is gone, the job is expired, and a new request is required.
- Storage quota is insufficient for the encrypted bundle; the job fails early with PRIVACY_EXPORT_QUOTA and reports the bytes needed.
- The user requests a fourth export within 24 hours; refused with RATE_LIMITED.

## UX and accessibility

- Export screen: explanation of what is included and what is not, include media toggle with estimated size, Request export button requiring a fresh unlock.
- Progress list: one row per module section with state and counts, overall bytes written, Cancel button.
- Ready card: file name, size, expiry date and time, Download button, signature fingerprint with Copy, and the sentence 'This file is not encrypted for transport; store it safely.'

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

F07.S01.M01, F10.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-078-01 | [Domain schema](domain_schema.md) | 3 |
| PS-078-02 | [Validation rules](validation_rules.md) | 3 |
| PS-078-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-078-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-078-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-078-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-078-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-078-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-078-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-078-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/privacy/src/data_controls/export/index.ts`.

## Acceptance criteria

- All tests T01 to T17 pass in CI.
- A bundle from a seeded vault imports into a fresh vault with identical record counts and a verifying signature.
- No bundle contains P4 secrets or other users' private content.
- A ready bundle is unreachable after 7 days and its key is gone.
