# F15.S01.M03 — PWA install

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S01](../SPEC.md). **Process IDs:** PS-115-01…PS-115-10. **Code:** `apps/pwa/src/platform/install`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The installable PWA is the product (ADR-0016): after install the vault, drafting, local search and export work with no server. This module owns the web app manifest, the install prompt experience, and the update-available flow in which a waiting service worker is activated only after the user consents with a live gesture, and only when the waiting build's release manifest verifies under the release key pinned in the running build. It states the limit plainly: whoever controls the static origin controls the code at the next cold start, so consent protects live tabs only, and the real controls are the signed release manifest check, a loud warning for an unverified build, and reproducible builds with published checksums. Install is also the moment to ask the browser for persistent storage and to explain that data lives on this device, so the user knows to export. Nothing here contacts a relay, collects analytics or depends on a relay.

## Responsibilities

- Generate and validate the manifest (vite-plugin-pwa 2.0.0, Vite 8.3.5) with id, name, short_name, start_url, scope, display standalone, icons 192, 512 and maskable 512, theme and background colors, shortcuts (at most 4) and lang.
- Capture beforeinstallprompt and show a custom install card only after the user has completed a meaningful action, at most once per session, with dismissal back-off (30 days, then never after 3 dismissals); show Add to Home Screen instructions on iOS Safari.
- Run the update-available flow with registerType prompt, hourly and on-foreground update checks, verification of the waiting build's signed release manifest, a banner with Update now and Later, and SKIP_WAITING (with the waiting worker's one-time nonce) only after a live user gesture and a safe point (no unsaved draft, outbox idle).
- [object Object]
- After install or first successful unlock, request persistent storage through F15.S01.M01 and show a short explanation that data stays on this device and should be exported regularly (every 30 days, or every 7 days when persistent storage is denied).

## Not responsible for

- Service worker routing, cache versioning, nonce issuing and the kill switch (F15.S01.M02 mod_cache).
- Vault storage status panel, export-overdue threshold and sync outbox (F15.S01.M01 mod_offline).
- Static host configuration and headers (deployment docs; ADR-0016 allows any static host), and holding the release signing key (release process of the maintainers, offline key).
- Future: push notification permission prompt flow (owned by the notify feature); Future: store listing for app stores via Trusted Web Activity.

## User stories

- As a member, I can install ClassRup to my home screen and open it with no connection, with my vault intact.
- As a member, I am told clearly when a new version is ready and I choose when to restart; my open drafts are never lost.
- As a member, I am warned loudly when the app's host offers a build that is not signed by the release key, and told not to close or update the app.
- As an iPhone user, I get step-by-step instructions to add the app to my Home Screen because the browser has no install button for web apps.

## Edge cases

- The browser never fires beforeinstallprompt (iOS, Firefox desktop, already installed); the card is replaced by manual instructions or hidden when display-mode standalone is detected.
- The user dismisses the install card three times; it never appears again, but Install remains available in Settings.
- An update is waiting while a form has unsaved text or the outbox has an entry in sending; the Update now button first saves the draft to the vault and waits up to 10 s for the sending entry, otherwise offers Later.
- Two tabs are open and one accepts the update; the other tab shows "Updated in another tab, reload" after controllerchange instead of reloading mid-edit.
- The manifest or icons fail the build checks (missing 512 icon, start_url outside scope); the build fails with a stable code instead of shipping a non-installable app.
- The user declines persistent storage or the browser denies it; the app continues, shows the non-persistent warning in the storage panel, and F15.S01.M01 lowers the export-overdue threshold to 7 days so the reminder appears weekly.
- The waiting build's release manifest is missing, unsigned or signed by another key; Update is hidden and the unverified-build warning is shown; if every tab is then closed the browser activates that build at the next cold start anyway, which the warning text says.
- A page script calls applyUpdate() or posts SKIP_WAITING without a live user gesture; applyUpdate() refuses and the worker ignores a message without the waiting worker's nonce.
- After a kill-switch unregistration by F15.S01.M02 with no known-good build, the installed app needs the network once for its next start; the vault in IndexedDB is untouched.

## UX and accessibility

- Install card: dismissible card on the home screen with title 'Install ClassRup', one sentence 'Works offline and keeps your data on this device', buttons Install and Not now.
- iOS instructions sheet: three steps with Share icon, Add to Home Screen and Add, with illustrations that have text alternatives.
- Update banner: 'A new version is ready' with Update now and Later, shown above the bottom navigation and not covering form fields.
- Unverified build warning: 'The app host offers a version that is not signed by the ClassRup release key. Do not close this app or update; export your vault and report it.' with Export now and Learn more; no Update button.
- Settings > App: install state, version (buildId and releaseSeq), release checksum, Check for updates, and the persistent storage explanation.

**States:** not-installable; installable; ios-instructions; installed; update-available; update-unverified; updating; update-deferred; updated-elsewhere

**Accessibility:** Install card and update banner use role=region with aria-label and announce through aria-live polite; the unverified-build warning uses role=alert; none of them traps focus.; Buttons are at least 44x44 px, labelled by text, and Later/Not now are reachable by keyboard before the page content flow continues.; iOS instruction images have alt text and the steps are real ordered list text.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F15.S01.M01, F15.S01.M02, CTR-UX-001, CTR-OBS-001, CTR-PRV-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-115-01 | [Domain schema](domain_schema.md) | 3 |
| PS-115-02 | [Validation rules](validation_rules.md) | 4 |
| PS-115-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-115-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-115-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-115-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-115-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-115-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-115-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-115-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/pwa/src/platform/install/index.ts`.

## Acceptance criteria

- All tests T01-T19 pass in CI.
- The built app is installable (Lighthouse) and starts offline after install with the vault intact.
- A new version never replaces the running one in a live tab without a user gesture and never loses a draft, and an unsigned build is never offered for update.
- No network request other than same-origin static assets occurs during install and update flows.
