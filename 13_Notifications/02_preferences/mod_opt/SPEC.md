# F13.S02.M03 — Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S02](../SPEC.md). **Process IDs:** PS-107-01…PS-107-10. **Code:** `packages/notify/src/preferences/opt`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Per-channel consent for push and email notifications. The user's vault records a signed channel consent (granted or withdrawn) linked to the privacy consent of F10; when a user-selected relay is to send push or email, the vault registers the signed consent with that relay, and the relay sends nothing on a channel without a granted, unexpired consent. One-click unsubscribe tokens (RFC 8058 style) let a recipient of an email withdraw without opening the app. In-app notifications need no consent because they never leave the device. Category-level choices live in F13.S02.M04, schedules in F13.S02.M02, deferral in F13.S02.M01.

## Responsibilities

- Own the ChannelConsent record per user, relay and channel (push, email) with granted, withdrawn and expired states.
- Produce the signed statement classrup.notify.channel_consent/v1 in the vault and accept it at the relay that will send, verifying signer and channel.
- Link each consent to the F10 privacy consent ID and withdraw it when privacy.consent.withdrawn arrives for the linked purpose.
- Mint, store as hashes, and redeem one-click unsubscribe tokens at the relay for email and for push-link footers.
- Expire each consent 365 days after grant and prompt the user to reconfirm.

## Not responsible for

- Browser permission prompts and subscription objects (F13.S01.M01) and verified email addresses (F13.S01.M02).
- Per-category preferences (F13.S02.M04) and quiet-hours schedules (F13.S02.M02, F13.S02.M01).
- Privacy consent records themselves (F10.S01.M01).
- Marketing messages; the platform sends transactional notifications only, and no promotional channel exists in the MVP.
- Future: SMS and messaging-app channels, per-category consent granularity at the relay, consent receipts as W3C Verifiable Credentials.

## User stories

- As a member, I can switch on push notifications for my chosen relay and see which relay will send them.
- As a member, I can opt in to email via a relay that offers email and withdraw with one click from any email.
- As a member, I can withdraw a channel in settings and know the relay will stop sending to it.
- As a member, I am asked to reconfirm a channel once a year.

## Edge cases

- Relay does not offer email; the email opt-in control is disabled with an explanation and no consent record is created for that relay.
- Unsubscribe token used twice; the second call returns success without change (idempotent).
- Unsubscribe token for a withdrawn or unknown consent; the relay returns NOT_FOUND with no detail.
- User withdraws in the app while offline; the vault records withdrawn at once and the relay registration is queued, and the UI shows sending may continue until the relay confirms.
- The relay's unsubscribe withdrawal arrives while the vault shows granted; the vault applies the relay-signed withdrawal on next sync.
- privacy.consent.withdrawn arrives for a purpose linked to both channels; both channels become withdrawn.
- Consent expires while the app is closed; the relay stops sending on the expiry date even if the vault never prompted.

## UX and accessibility

- Channels settings: rows for Push and Email each with relay name, status text (Not enabled, Enabled on relay X, Withdrawn, Needs reconfirmation), toggle, and last changed time.
- Opt-in sheet: what is sent (a content-free alert or a short generic email), which relay sends it and what that relay learns (browser push endpoint or email address), Enable and Cancel.
- Unsubscribe confirmation page served by the relay: Unsubscribed text, channel name, Undo link that opens the app.

**States:** loading; not-enabled; granted; withdrawn; expired-reconfirm; relay-unavailable; offline-pending

**Accessibility:** Toggles are native switches with labels that include the channel and relay name and status changes are announced politely.; Unsubscribe page works without JavaScript and without login, with heading structure and sufficient contrast.; Opt-in and cancel are buttons of at least 44 by 44 px.

## Owned data

- `ChannelConsent` (classrup.notify.channel_consent/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `notify.channel.opt_in`, `notify.channel.opt_out`, `notify.channel.register`, `notify.channel.unsubscribe`
- Queries: `notify.channel.get_mine`
- Emits: `notify.channel.opted_in`, `notify.channel.opted_out`
- Consumes: `privacy.consent.withdrawn`, `privacy.consent.granted`, `privacy.deletion.requested`

## Dependencies

F10.S01.M01, F07.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-107-01 | [Domain schema](domain_schema.md) | 3 |
| PS-107-02 | [Validation rules](validation_rules.md) | 3 |
| PS-107-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-107-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-107-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-107-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-107-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-107-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-107-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-107-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/preferences/opt/index.ts`.

## Acceptance criteria

- All tests T01 to T13 pass in CI.
- No push or email is ever sent without a granted, unexpired, verified consent.
- Unsubscribe works with one click and no login and cannot grant consent.
