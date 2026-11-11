# F18.S01.M01 — Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F18.S01](../SPEC.md). **Process IDs:** PS-145-01…PS-145-10. **Code:** `packages/governance/src/policy/jurisdictions`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Configurable jurisdiction profiles: retention overrides, self-declared age gates, required notices and restricted categories for a region or community. A profile is configuration chosen by a user or by a relay operator, not legal advice and not a legal determination. Profiles are authored by a publisher, released as signed statements (classrup.governance.jurisdiction_profile/v1), verified and stored in each vault, and selected locally. The vault applies the selected profile when publishing and when computing retention; a relay applies its own profile to what it hosts. A profile can never weaken the privacy floors of CTR-PRV-001 (public location at most L2, exact addresses never public).

## Responsibilities

- [object Object]
- Author, version and release profiles in a publisher vault; activation of a profile that changes retention or restrictions needs an approved policy decision (F18.S02.M01) except for the first profile of a publisher.
- Verify and store profiles in any vault, let the user select the active profile per vault, and resolve the effective profile for a region for other modules (publish checks, retention, age gate).
- Reject profile content that would weaken privacy floors or set evidence retention below 180 days or above 3 650 days.

## Not responsible for

- Providing legal advice or determining what is lawful in a place; profiles are a tool the user or operator configures.
- Prohibited-item rules (F18.S01.M02) and the taxonomy (F18.S01.M03); profiles reference category ids only.
- Executing retention and deletion (F10.S01.M02, F10.S01.M04); this module supplies the effective numbers.
- Verifying age or identity; the age gate is a self-declaration shown before relevant actions.
- Future: automatic jurisdiction suggestion from device locale and per-category age rules.

## User stories

- As a user, I pick the jurisdiction profile that fits where I live and see exactly what it changes (notices, retention, restricted categories).
- As a relay operator, I publish a profile for my community and users can adopt it.
- As a seller, I am shown the notices that apply to my category before I publish, and I confirm them.

## Edge cases

- A profile tries to lower evidence retention below 180 days; rejected with GOVERNANCE_PROFILE_BOUNDS.
- A profile tries to allow public location finer than L2; rejected with GOVERNANCE_PROFILE_PRIVACY_FLOOR.
- A profile lists a category id that does not exist in the active taxonomy; the profile is stored with a warning and the entry is ignored until the category exists.
- User selects a profile whose publisher they do not trust; the profile is stored as pending and not applied.
- Two profiles are both selected for overlapping regions; the stricter value wins for each field and the UI shows which profile set it.
- The user is below the minimum age declared by the profile; actions that need the age gate are disabled with an explanation, and the declaration is local only.
- The active profile is retired by its publisher; the vault keeps using the last version until the user selects another and shows a banner.

## UX and accessibility

- Profile chooser: list of trusted and pending profiles with publisher fingerprint, version, age, and a Compare view of what changes.
- Notice sheet shown at publish: required notices as plain-language text with a checkbox per notice and a link to the full text.
- Operator editor: form for countries, retention overrides with allowed ranges, notices (message keys), minimum age, restricted categories; release button.

**States:** loading; empty; pending-trust; active; retired-banner; conflict-merge; offline-cached

**Accessibility:** Compare view is a table with headers; changes are indicated by text such as Stricter or Looser, not colour alone.; Notice checkboxes have visible labels and the sheet is a dialog with focus trap; buttons are at least 44x44 px.; Age declaration uses a date-free control (a yes/no statement) to avoid cognitive-function tests.

## Owned data

- `JurisdictionProfile` (classrup.governance.jurisdiction_profile/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `governance.jurisdiction_profile.draft`, `governance.jurisdiction_profile.release`, `governance.jurisdiction_profile.retire`, `governance.jurisdiction_profile.receive`, `governance.jurisdiction_profile.select`
- Queries: `governance.jurisdiction_profile.get`, `governance.jurisdiction_profile.list`, `governance.jurisdiction_profile.resolve`
- Emits: `governance.jurisdiction_profile.activated`
- Consumes: `governance.category.changed`

## Dependencies

F18.S01.M03, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-145-01 | [Domain schema](domain_schema.md) | 3 |
| PS-145-02 | [Validation rules](validation_rules.md) | 3 |
| PS-145-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-145-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-145-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-145-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-145-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-145-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-145-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-145-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/governance/src/policy/jurisdictions/index.ts`.

## Acceptance criteria

- All tests T01-T14 pass in CI.
- No profile can weaken a privacy floor, set evidence retention outside 180 to 3 650 days, or be activated without a verified decision (except a publisher's first profile).
- The age declaration and selection never leave the device.
