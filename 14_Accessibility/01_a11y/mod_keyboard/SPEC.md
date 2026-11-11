# F14.S01.M01 — Keyboard operability

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F14.S01](../SPEC.md). **Process IDs:** PS-109-01…PS-109-10. **Code:** `apps/pwa/src/a11y/keyboard`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

UI library and CI rules that make every interaction in the PWA operable from the keyboard and by a single pointer: visible focus that is never obscured (WCAG 2.2 criterion 2.4.11), skip link, focus management on route change and in dialogs, no keyboard traps, a single-pointer alternative for every dragging interaction (2.5.7) and touch targets of at least 44 by 44 CSS px (the project minimum, above the 24 px of criterion 2.5.8). It runs entirely in the browser and never reads vault data: the PWA shell reads the user's preferences from F15.S04.M03 LocalSettings and passes them in as parameters. The PWA sends no telemetry, so findings come from tests and local development warnings only.

## Responsibilities

- Provide focus-visible styling tokens (outline at least 2 px, contrast at least 3:1 against adjacent colours) and scroll-padding tokens so sticky headers and bottom navigation never obscure the focused element (2.4.11).
- Provide the skip link, route-change focus management (focus the new view heading and set the document title) and an accessible dialog helper built on the native dialog element with focus trap, Escape to close and focus restore.
- Provide keyboard primitives such as roving tabindex lists, menus and tabs following WAI-ARIA Authoring Practices, plus the rule that single-character shortcuts are absent or can be turned off or remapped (2.1.4).
- Provide reorder, pan and slider helpers that expose button-based alternatives for every drag gesture (2.5.7), such as photo reorder with move earlier and move later buttons.
- Provide a target-size token --target-min of 44px, lint rules that fail the build on tabindex greater than 0, click handlers on non-interactive elements and interactive primitives not sized with the token, and an end-to-end measurement of the computed hit area of every interactive element.

## Not responsible for

- Screen reader names, landmarks and live regions (F14.S01.M02).
- The conformance gate, axe runs, the waiver file schema and the manual checklist (F14.S01.M03).
- Message strings and direction handling (F14.S02.M01).
- Storing user preferences such as the reduced-motion override (F15.S04.M03 LocalSettings; the PWA shell passes the value to the primitives).
- Sanitising rich user content and setting the Content-Security-Policy of the PWA (rendering components and the PWA shell under the F16.S03.M01 threat model); the primitives rely on both.
- Future: user-configurable keyboard shortcut maps and a command palette; MVP has no single-character shortcuts and therefore no shortcut setting.

## User stories

- As a keyboard user, I can reach and operate every control in tab order, see where focus is and never lose it behind a sticky bar.
- As a user who cannot drag, I can reorder my listing photos with buttons.
- As a screen magnifier user, I always see the focused element inside the visible viewport.
- As a keyboard user, when I open a dialog focus moves into it, Tab stays inside, Escape closes it and focus returns to the control that opened it.

## Edge cases

- Sticky bottom navigation 64 px high covers the focused button; scroll-padding-bottom of 72 px brings it into view.
- A dialog opens from a dialog; focus returns to the first dialog's trigger when the second closes, then to the page trigger when the first closes.
- A route change happens while the previous view had focus on a removed element; focus moves to the new view heading, not to the body.
- A component renders interactive content inside a canvas map; a keyboard-accessible list of the same locations and pan buttons are provided.
- A toast appears with an action button; it is reachable by keyboard, does not steal focus and stays at least 10 s or until dismissed.
- Forced colors mode is on; focus outline uses the system Highlight colour instead of the token.
- Virtual keyboard opens on a phone and covers a field; the field scrolls into view using visual viewport insets.
- A received listing description from another vault contains '<input autofocus>' and an inline script calling focus(); the description renders as text, no autofocus attribute reaches the DOM, the CSP blocks the script and focus stays where the user left it.

## UX and accessibility

- Skip link 'Skip to main content' visible on focus at the top of every page.
- Dialogs, menus, tabs, reorder lists and sliders used across the app follow the shared primitives.
- Developer-only overlay (development build) that outlines elements failing the target size or focus rules and shows the rule code.

**States:** focus-visible; dialog-open; dialog-closed; route-changed; reduced-motion; forced-colors

**Accessibility:** Every focusable element has a visible focus indicator of at least 2 px with 3:1 contrast, also in dark mode and forced colors.; Targets are at least 44×44 CSS px, with at least 8 px spacing when smaller inline text links are unavoidable.; Animations honour prefers-reduced-motion or the reduced-motion value the PWA shell passes in from F15.S04.M03 LocalSettings, and focus moves never depend on animation completion.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-109-01 | [Domain schema](domain_schema.md) | 3 |
| PS-109-02 | [Validation rules](validation_rules.md) | 3 |
| PS-109-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-109-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-109-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-109-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-109-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-109-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-109-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-109-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/pwa/src/a11y/keyboard/index.ts`.

## Acceptance criteria

- All automated tests pass in CI; manual test T14 is recorded as passed in the release checklist (F14.S01.M03 V05).
- Every core journey is completable with the keyboard only on the two mobile profiles with an external keyboard.
- No interactive element is smaller than 44 by 44 CSS px except documented inline links.
