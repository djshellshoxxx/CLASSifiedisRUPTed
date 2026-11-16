# F13.S02.M01 — Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S02](../SPEC.md). **Process IDs:** PS-108-01…PS-108-10. **Code:** `packages/notify/src/preferences/quiet`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The dispatch gate for outbound notification channels and the owner of deferral. For every alert that would leave the in-app inbox (a local operating-system alert while the app runs, a push through the user's relay, or an email through a relay that offers it) the gate checks channel consent, the category-by-channel matrix and the quiet-hours schedule. Outside quiet hours it sends at once; inside quiet hours it stores a content-free DeferredNotification (reference and template key only) and releases it at the end of the window with up to 5 minutes of random jitter and digest collapsing. The urgent security class bypasses quiet hours but never bypasses consent. The gate runs in the vault for local alerts and on the relay for push and email.

## Responsibilities

- Own the DeferredNotification record (channel, category, template key, reference, release time, status) in the vault for local alerts and at the relay for push and email.
- Implement the single decision procedure consent, category preference, urgency, quiet hours, then send or defer or drop, identically in the vault and on the relay.
- Release deferred items at the end of the quiet window with jitter of 0 to 300 s, collapse items with the same collapse key and replace more than 5 pending items for one user by one digest alert.
- Re-evaluate deferred items when the schedule, a channel consent or a preference changes, and cancel items the user already read in the app.
- Enforce the urgent security class rule, namely only category security may be urgent and urgent alerts skip quiet hours and the digest, and are still subject to consent and the security category switch for that channel.

## Not responsible for

- Schedule definition and DST evaluation (F13.S02.M02 provides isQuiet and nextQuietEnd).
- Channel consent (F13.S02.M03), matrix (F13.S02.M04), subscriptions and the Web Push protocol (F13.S01.M01), email transport (F13.S01.M02), inbox rows (F13.S01.M03).
- Deciding what an event means for notification content; the routing table is in F13.S01.M03.
- Do-not-disturb of the operating system; the gate cannot override device-level focus modes.
- Future: per-category quiet windows, adaptive digest timing, delivery-time optimization.

## User stories

- As a member, I do not get a push at 03:00 about a new offer and I see a single summary when my quiet hours end.
- As a member, I still get a push when a new device key is added to my account at 03:00.
- As a member, I do not get an email for a category I switched off.
- As a member, I see in the app inbox everything that was held back, because the inbox is never deferred.

## Edge cases

- Quiet window ends at 07:00 and 2 000 users have deferred items; releases are spread over 0 to 300 s of jitter to avoid a thundering herd on the push service.
- User changes quiet hours while items are deferred; release times are recomputed from the new schedule at once, and items now outside quiet hours are released within 60 s.
- User reads the notification in the app while its push is deferred; the deferred item is cancelled and no push is sent.
- Channel consent is withdrawn while items are deferred; all deferred items for that channel are dropped with reason no_consent.
- A deferred item reaches 24 hours of age because the schedule was changed to be always quiet; it is dropped with reason expired and remains visible in the in-app inbox.
- Urgent security alert while no push consent exists; nothing is pushed and the in-app notification and, if the user enabled email and it is verified, email are used.
- Release time falls in a new quiet window of the next day because of consecutive windows; the item moves to the end of the later window but never beyond 24 hours.
- Relay clock differs from the user's clock by 40 seconds; the relay uses its own clock with the user's schedule and the difference is tolerated within the 60 s re-evaluation tolerance.

## UX and accessibility

- Inbox shows all notifications with a small icon Held until quiet hours end on items whose push or email was deferred.
- Quiet hours screen (F13.S02.M02) links to a Held notifications list showing counts per category, not contents.
- Digest alert text such as 5 new notifications waiting, opens the inbox.

**States:** loading; none-held; held; releasing; released; dropped; cancelled; offline

**Accessibility:** Held indicator has text alternative Held until 07:00 and is not conveyed by icon alone.; Digest alerts use plain text titles that screen readers announce without markup.; The held list is a table with category and count headers.

## Owned data

- `DeferredNotification` (classrup.notify.deferred/v1, P2, RET-EPHEMERAL)

## Interfaces

- Commands: `notify.notification.dispatch`, `notify.notification.release`
- Queries: `notify.notification.list_deferred`
- Emits: `notify.notification.deferred`, `notify.notification.released`
- Consumes: `notify.notification.created`, `notify.notification.read`, `notify.quiet_hours.changed`, `notify.channel.opted_out`, `notify.preference.changed`

## Dependencies

F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-108-01 | [Domain schema](domain_schema.md) | 3 |
| PS-108-02 | [Validation rules](validation_rules.md) | 3 |
| PS-108-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-108-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-108-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-108-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-108-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-108-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-108-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-108-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/preferences/quiet/index.ts`.

## Acceptance criteria

- All tests T01 to T14 pass in CI.
- No send occurs on any path without a granted unexpired channel consent.
- Urgent bypass works only for category security and is visible in metrics.
- Released times match the golden DST fixtures to within the 300 s jitter.
