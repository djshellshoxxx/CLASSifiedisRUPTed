# F14.S01.M02 — Screen reader support

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F14.S01](../SPEC.md). **Process IDs:** PS-110-01…PS-110-10. **Code:** `apps/pwa/src/a11y/screenreader`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

UI library and CI rules that give every screen a semantic structure for screen readers: one set of landmarks per page, programmatic labels and error associations on every form control, a shared bounded live-region announcer for asynchronous state, and spoken accessible names for money, distance, time and sync-state values. Spoken money is composed from the same parts as the visual price (F14.S02.M02 formatMoneyParts with the F09.S03.M01 CurrencyDef), spoken distances use the F06.S02.M01 bucket enum, and spoken sync states cover local_committed plus every F15.S01.M01 OutboxEntry.state with the same catalog keys as the visual chip, so spoken and visual text never disagree and never claim more certainty than the reached state (CTR-IDM-001 IDM-7). It uses the message catalogs of F14.S02.M01, runs in the browser, reads no vault data and sends no telemetry.

## Responsibilities

- Provide page shell components with exactly one banner, one main, one navigation per purpose with a unique accessible name and one contentinfo landmark, and a heading outline that starts at one h1 and never skips levels.
- Provide form components that tie label, hint and error to the control with for, aria-describedby and aria-invalid, and move focus to the first invalid field after a failed submit while announcing the error count.
- Provide a single live-region announcer (aria-live polite for status, assertive only for blocking errors) with de-duplication, a rate limit of one announcement per 2 s per region (CTR-UX-001 UX-2), a queue of at most 3 messages per region and overflow coalescing into one summary.
- Provide spoken-name helpers for Money (composed from F14.S02.M02 formatMoneyParts and currencyName with the F09.S03.M01 CurrencyDef), F06.S02.M01 distance buckets, relative times and every sync state (local_committed plus the F15.S01.M01 OutboxEntry.state values) that read naturally in every shipped locale.
- Provide a <Photo> component that requires alt and decorative props, renders author alt text of at most 140 characters, empty alt for decoration and 'Photo n of m, no description' for received photos without alt text, and rules for icon-only buttons (visible text or aria-label).
- Announce language changes; the PageShell listens for the F14.S02.M01 localechange event and announces the new language once, in that language, through the polite status region.

## Not responsible for

- Keyboard behaviour and focus visibility (F14.S01.M01).
- The conformance gate, axe runs, the waiver file schema and the release checklist (F14.S01.M03).
- Formatting of money and numbers for display (F14.S02.M02) and message catalogs (F14.S02.M01); this module only composes them into spoken names.
- Storing alt text and refusing to publish photos without it (the owning record carries it, F01.S01.M01 listing media and F08.S01.M03 attachments; the publish rule belongs to F01.S01.M03).
- Sync state bookkeeping and the visual sync chip (F15.S01.M01); this module only speaks the state it is given.
- Future: optional audio descriptions for user videos and automatic alt-text suggestions; MVP requires author-written alt text.

## User stories

- As a screen reader user, I can jump between landmarks and headings to find the listing list, the filters and the main content.
- As a screen reader user, I hear "Price 45 euros" and "less than 5 kilometres away" rather than symbols and raw numbers.
- As a screen reader user, I am told when my offer was saved on this device, when it was delivered to the relay I chose (by name) and when the peer confirmed it, without stealing focus.
- As a seller using a screen reader, the listing editor's photo field asks me for alt text or to mark the photo decorative, and publishing (F01.S01.M03) refuses a photo with neither.

## Edge cases

- Two navigation landmarks exist (main menu and filters); each has a unique aria-label.
- A hostile peer causes 1 000 distinct incoming-offer notices within 1 s; the region queue holds at most 3, overflow collapses them into one '{count} updates' summary under the caller's coalesce key, and at most 4 announcements are made in total.
- Money with a large value of 123456789012 minor units in a locale with grouping; the spoken name says the full amount with the currency name, not a truncated figure.
- BTC 12345 minor units is spoken as 0.00012345 with the registry name Bitcoin; a code missing from the registry is spoken as 'amount unavailable, unknown currency XYZ', never as raw minor-unit digits.
- An approximate converted price is shown; the spoken name includes "approximately", the same provenance wording as the visual label (quote from, manual rate by, unverified source or pinned rate agreed by all parties), the quote time (UX-4) and 'expired quote' or 'revoked quote' when the visual label shows it.
- Error text arrives after the field lost focus; the error is associated by aria-describedby and announced once.
- A received listing photo has no alt text and is not marked decorative; the component renders 'Photo 2 of 5, no description' locally; only on the user's own listings does the editor flag the photo for the author.
- The locale is right to left; landmarks and reading order follow the DOM order, which matches the visual order.
- A statement reaches transport_acknowledged through a direct peer connection rather than a relay; the spoken text names the direct transport and still says the peer has not confirmed.

## UX and accessibility

- Every screen uses the shared page shell with landmarks and a single h1.
- Form screens show inline errors tied to fields and an error summary at the top of the form with links to each field.
- Photo alt field component used by the listing editor and the attachment composer: alt text input with a counter (max 140) and a 'Decorative photo' checkbox; the owning module stores both values.

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

F14.S02.M01, F14.S02.M02, F09.S03.M01, F09.S03.M03, F06.S02.M01, F15.S01.M01, CTR-UX-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-110-01 | [Domain schema](domain_schema.md) | 4 |
| PS-110-02 | [Validation rules](validation_rules.md) | 4 |
| PS-110-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-110-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-110-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-110-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-110-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-110-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-110-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-110-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/pwa/src/a11y/screenreader/index.ts`.

## Acceptance criteria

- All automated tests pass in CI; manual test T11 is recorded as passed in the release checklist (F14.S01.M03 V05).
- Every screen has valid landmarks, labelled controls and spoken names for money, distance, time and sync state (axe and lint).
- Manual VoiceOver and TalkBack runs of the core flows find no blocking issue.
