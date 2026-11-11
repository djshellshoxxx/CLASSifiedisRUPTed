# F14.S01.M03 — WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F14.S01](../SPEC.md). **Process IDs:** PS-111-01…PS-111-10. **Code:** `tests/a11y`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The WCAG 2.2 Level AA conformance gate. It runs axe-core through @axe-core/playwright 4.14.0 on every route and every state that route declares applicable in CI (zero serious or critical findings allowed), with a pairwise theme, viewport and locale subset on each pull request and the full matrix nightly and on every release commit. It checks colour tokens for contrast (4.5:1 for text, 3:1 for UI components and focus rings) in light, dark and forced-colors themes, and keeps a manual checklist for criteria that tools cannot decide, notably 2.4.11 focus not obscured, 2.5.7 dragging movements, 2.5.8 target size (project minimum 44 px, WCAG minimum 24 px) and 3.3.8 accessible authentication. There are no accounts (ADR-0016): the authentication steps are vault unlock with a memorized passphrase (F16.S02.M01), recovery-kit restore (F07.S01.M03) and backup passphrase entry (F16.S02.M01), which are cognitive function tests that pass 3.3.8 only through its assistance-mechanism exception, so an automated check verifies that password managers and paste work and that the kit can be imported by file or QR. Automated checks find some issues only, so a release also needs the manual pass. The gate has no runtime component and the PWA sends no telemetry.

## Responsibilities

- Maintain the route and state inventory (tests/a11y/routes.yaml), in which every route declares its applicable UX states and a reason and reviewer for each excluded state, and fail CI when a route in the app's route registry or one of its applicable states has no a11y test.
- Run axe-core 4.x rules tagged wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa and best-practice on every route in each applicable state (loading, empty, error, offline-pending, conflict and success by default); pull requests run the pairwise subset light + 320 px + en and dark + desktop + ar-XB, and the nightly and release runs cover light and dark, 320 px and desktop, and en and RTL (ar-XB pseudolocale).
- Compute contrast for every colour token pair from the design tokens and fail below 4.5:1 for text and 3:1 for UI components, focus rings and graphical objects.
- Maintain the manual checklist per release with an owner, date, device and result for each non-automatable criterion, including 2.4.11, 2.5.7, 2.5.8, 3.3.7 redundant entry, 3.3.8 accessible authentication for the vault unlock, recovery-kit restore and backup export and import passphrase screens, 3.2.6 consistent help, 1.4.10 reflow and 1.4.12 text spacing, plus the recorded manual test runs of F14.S01.M01 T14 and F14.S01.M02 T11.
- Manage waivers in tests/a11y/waivers.yaml, each with rule, exactly one target (route, file glob or component), reason, owner and an expiry of at most 90 days, read by this gate and by the lint runners of F14.S01.M01 and F14.S01.M02, and publish an accessibility statement draft from the results.
- Run the authentication-assistance check (V07) on the vault unlock, recovery-kit restore and backup passphrase screens so the 3.3.8 assistance-mechanism exception cannot silently regress.

## Not responsible for

- Implementation of keyboard behaviour (F14.S01.M01), screen reader structure (F14.S01.M02) and localization (F14.S02).
- Implementation of the vault unlock and backup passphrase screens (F16.S02.M01) and of the recovery-kit restore screen (F07.S01.M03); this module only checks them.
- General CI pipeline, release gating mechanics and test infrastructure (F17).
- Legal accessibility statements and jurisdiction rules (F18); this module supplies the evidence.
- Future: automated visual regression of focus indicators and assistive technology farm testing; MVP uses manual device passes.

## User stories

- As a maintainer, I see a failing CI job naming the route, state, rule and element when a change introduces a serious accessibility issue.
- As a release manager, I can open the accessibility report and see automated results and the signed-off manual checklist for this release.
- As a designer, I get a failing check when a new colour token pair does not reach the required contrast.
- As a user with low vision, I can rely on every screen meeting contrast and reflow criteria in dark mode and at 200 percent zoom.
- As a user who relies on a password manager, I can always unlock my vault with autofill or paste and restore from my recovery kit file or QR without retyping 24 words.

## Edge cases

- A new route is added without an a11y test; CI fails with I18N_A11Y_ROUTE_UNCOVERED.
- An axe rule has a false positive on a third-party widget; a waiver with a 90-day expiry is added and CI warns 14 days before it expires.
- Axe reports moderate and minor findings only; the build passes but the findings are listed in the report.
- A state cannot be reached in CI because it needs a relay; the test seeds the state through the vault fixtures instead of skipping it.
- A static help route has no asynchronous data; routes.yaml declares only success and loading as applicable and lists empty, error, offline-pending and conflict as excluded with a reason and reviewer, so no waiver is needed.
- Contrast of a semi-transparent token depends on the background; the check blends it against each documented background.
- Pseudolocale ar-XB expands strings by 40 percent; the gate checks no horizontal scroll at 320 px (1.4.10).
- Vault unlock asks for a memorized passphrase, which is a cognitive function test under 3.3.8; V07 and the checklist confirm the assistance-mechanism exception holds (autocomplete=current-password, paste and password-manager autofill not blocked, show/hide toggle) and that recovery offers kit import by file or QR, not retyping only.
- A fixture passphrase field cancels the paste event; V07 fails with I18N_A11Y_AUTH_ASSIST.

## UX and accessibility



Tooling module with no end-user screens. Its output is the CI report tests/a11y/report.html and report.json (route, state, theme, viewport, locale, rule id, impact, selector, WCAG success criterion), validated against tests/a11y/report.schema.json, and the release checklist tests/a11y/checklist.md.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F14.S01.M01, F14.S01.M02, F14.S02.M01, F16.S02.M01, F07.S01.M03, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-111-01 | [Domain schema](domain_schema.md) | 4 |
| PS-111-02 | [Validation rules](validation_rules.md) | 4 |
| PS-111-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-111-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-111-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-111-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-111-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-111-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-111-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-111-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `tests/a11y/index.ts`.

## Acceptance criteria

- All automated tests pass in CI; manual test T11 is recorded as passed in the release checklist (V05), together with F14.S01.M01 T14 and F14.S01.M02 T11.
- Zero serious or critical axe violations across all routes, applicable states, themes and viewports in the full matrix of the release commit.
- Every colour token pair meets the contrast thresholds in all themes.
