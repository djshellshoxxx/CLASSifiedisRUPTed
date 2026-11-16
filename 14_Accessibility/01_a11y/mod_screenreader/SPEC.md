# F14.S01.M02 — Screen reader support

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F14.S01](../SPEC.md). **Process IDs:** PS-110-01…PS-110-10. **Code:** `apps/pwa/src/a11y/screenreader`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

UI library and CI rules that give every screen a semantic structure for screen readers: one set of landmarks per page, programmatic labels and error associations on every form control, a shared live-region announcer for asynchronous state, and spoken accessible names for money, distance, time and sync-state values. It uses the money formatter of F14.S02.M02 and the message catalogs of F14.S02.M01 so spoken text is localized. It runs in the browser and sends no telemetry.

## Responsibilities

- Provide page shell components with exactly one banner, one main, one navigation per purpose with a unique accessible name and one contentinfo landmark, and a heading outline that starts at one h1 and never skips levels.
- Provide form components that tie label, hint and error to the control with for, aria-describedby and aria-invalid, and move focus to the first invalid field after a failed submit while announcing the error count.
- Provide a single live-region announcer (aria-live polite for status, assertive only for blocking errors) with de-duplication and a rate limit of one announcement per 2 s per region (CTR-UX-001 UX-2).
- Provide spoken-name helpers for Money, distance buckets, relative times and delivery or sync states (local committed, queued, relay received, recipient confirmed) that read naturally in every shipped locale.
- Provide rules for images and icons, namely required alt text of at most 140 characters for user photos with a prompt for authors, empty alt for decoration, and visible text or aria-label for icon-only buttons.

## Not responsible for

- Keyboard behaviour and focus visibility (F14.S01.M01).
- The conformance gate and axe runs (F14.S01.M03).
- Formatting of money and numbers for display (F14.S02.M02) and message catalogs (F14.S02.M01); this module only composes them into spoken names.
- Future: optional audio descriptions for user videos and automatic alt-text suggestions; MVP requires author-written alt text.

## User stories

- As a screen reader user, I can jump between landmarks and headings to find the listing list, the filters and the main content.
- As a screen reader user, I hear "Price 45 euros" and "less than 5 kilometres away" rather than symbols and raw numbers.
- As a screen reader user, I am told when my offer was saved on this device and when the relay received it, without stealing focus.
- As a seller using a screen reader, I am asked for alt text for each photo before publishing.

## Edge cases

- Two navigation landmarks exist (main menu and filters); each has a unique aria-label.
- A list updates ten times in two seconds; the announcer sends one summary announcement and drops duplicates.
- Money with a large value of 123456789012 minor units in a locale with grouping; the spoken name says the full amount with the currency name, not a truncated figure.
- An approximate converted price is shown; the spoken name includes "approximately" and the quote source and time (UX-4).
- Error text arrives after the field lost focus; the error is associated by aria-describedby and announced once.
- A photo has no alt text from an imported listing; the app uses "Photo 2 of 5, no description" and flags the listing for the author.
- The locale is right to left; landmarks and reading order follow the DOM order, which matches the visual order.

## UX and accessibility

- Every screen uses the shared page shell with landmarks and a single h1.
- Form screens show inline errors tied to fields and an error summary at the top of the form with links to each field.
- Photo upload dialogs have a required alt text field with a counter (max 140).

**States:** loading; empty; error; offline-pending; conflict; success

**Accessibility:** Loading states expose role=status text, not only spinners; empty states describe the next action.; Error summaries are focused after submit and each link moves focus to the field.; Tables have captions, header cells with scope and no layout tables are used.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F14.S02.M01, F14.S02.M02, CTR-UX-001, CTR-MNY-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-110-01 | [Domain schema](domain_schema.md) | 3 |
| PS-110-02 | [Validation rules](validation_rules.md) | 3 |
| PS-110-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-110-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-110-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-110-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-110-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-110-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-110-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-110-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/pwa/src/a11y/screenreader/index.ts`.

## Acceptance criteria

- All tests T01–T14 pass in CI.
- Every screen has valid landmarks, labelled controls and spoken names for money, distance and time (axe and lint).
- Manual VoiceOver and TalkBack runs of the core flows find no blocking issue.
