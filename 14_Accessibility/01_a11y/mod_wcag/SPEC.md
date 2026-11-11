# F14.S01.M03 — WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F14.S01](../SPEC.md). **Process IDs:** PS-111-01…PS-111-10. **Code:** `tests/a11y`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The WCAG 2.2 Level AA conformance gate. It runs axe-core through @axe-core/playwright 4.14.0 on every route and every documented state in CI (zero serious or critical findings allowed), checks colour tokens for contrast (4.5:1 for text, 3:1 for UI components and focus rings) in light, dark and forced-colors themes, and keeps a manual checklist for criteria that tools cannot decide, notably 2.4.11 focus not obscured, 2.5.7 dragging movements, 2.5.8 target size (project minimum 44 px, WCAG minimum 24 px) and 3.3.8 accessible authentication (key-based and passkey-style login with no cognitive test). Automated checks find some issues only, so a release also needs the manual pass. The gate has no runtime component and the PWA sends no telemetry.

## Responsibilities

- Maintain the route and state inventory (tests/a11y/routes.yaml) and fail CI when a route in the app's route registry has no a11y test.
- Run axe-core 4.x rules tagged wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa and best-practice on every route in states loading, empty, error, offline-pending, conflict and success, in light, dark, 320 px width and RTL (ar-XB pseudolocale).
- Compute contrast for every colour token pair from the design tokens and fail below 4.5:1 for text and 3:1 for UI components, focus rings and graphical objects.
- Maintain the manual checklist per release with an owner, date, device and result for each non-automatable criterion, including 2.4.11, 2.5.7, 2.5.8, 3.3.7 redundant entry, 3.3.8 accessible authentication, 3.2.6 consistent help, 1.4.10 reflow and 1.4.12 text spacing.
- Manage waivers in tests/a11y/waivers.yaml, each with rule, route, reason, owner and an expiry of at most 90 days, and publish an accessibility statement draft from the results.

## Not responsible for

- Implementation of keyboard behaviour (F14.S01.M01), screen reader structure (F14.S01.M02) and localization (F14.S02).
- General CI pipeline, release gating mechanics and test infrastructure (F17).
- Legal accessibility statements and jurisdiction rules (F18); this module supplies the evidence.
- Future: automated visual regression of focus indicators and assistive technology farm testing; MVP uses manual device passes.

## User stories

- As a maintainer, I see a failing CI job naming the route, state, rule and element when a change introduces a serious accessibility issue.
- As a release manager, I can open the accessibility report and see automated results and the signed-off manual checklist for this release.
- As a designer, I get a failing check when a new colour token pair does not reach the required contrast.
- As a user with low vision, I can rely on every screen meeting contrast and reflow criteria in dark mode and at 200 percent zoom.

## Edge cases

- A new route is added without an a11y test; CI fails with I18N_A11Y_ROUTE_UNCOVERED.
- An axe rule has a false positive on a third-party widget; a waiver with a 90-day expiry is added and CI warns 14 days before it expires.
- Axe reports moderate and minor findings only; the build passes but the findings are listed in the report.
- A state cannot be reached in CI because it needs a relay; the test seeds the state through the vault fixtures instead of skipping it.
- Contrast of a semi-transparent token depends on the background; the check blends it against each documented background.
- Pseudolocale ar-XB expands strings by 40 percent; the gate checks no horizontal scroll at 320 px (1.4.10).
- Login uses a passkey-style flow; the manual checklist records that no cognitive function test (memorization, transcription, puzzle) is required (3.3.8).

## UX and accessibility



Tooling module with no end-user screens. Its output is the CI report tests/a11y/report.html and report.json (route, state, theme, rule, impact, selector) and the release checklist tests/a11y/checklist.md.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F14.S01.M01, F14.S01.M02, F14.S02.M01, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-111-01 | [Domain schema](domain_schema.md) | 3 |
| PS-111-02 | [Validation rules](validation_rules.md) | 3 |
| PS-111-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-111-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-111-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-111-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-111-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-111-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-111-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-111-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `tests/a11y/index.ts`.

## Acceptance criteria

- All tests T01–T14 pass in CI and the manual checklist for the release is complete.
- Zero serious or critical axe violations across all routes, states, themes and viewports.
- Every colour token pair meets the contrast thresholds in all themes.
