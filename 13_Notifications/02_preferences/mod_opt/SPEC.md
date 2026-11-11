# F13.S02.M03 — Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S02](../SPEC.md). **Process IDs:** PS-107-01…PS-107-10. **Code:** `packages/notify/src/preferences/opt`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Per-channel consent for push and email notifications. The user's vault records a channel consent (granted, withdrawn or expired) that is always linked to the F10 privacy consent of the matching purpose (push to notify_push, email to notify_email) for the same relay. When a user-selected relay is to send push or email, the vault signs a channel consent statement addressed to that relay's self-certifying key-derived relayId and registers it there; the relay sends nothing on a channel without a registered, granted, unexpired consent and relies only on that registration, because privacy.consent.check is vault in-process only. Registration, unsubscribe and the expiry sweep emit relay-local events so the relay erases its copies. One-click unsubscribe tokens (RFC 8058) are derived per consent and verified without storage; withdrawals made at the relay come back to the vault as relay-signed withdrawal receipts. In-app notifications need no consent because they never leave the device. Category choices live in F13.S02.M04, schedules in F13.S02.M02, deferral in F13.S02.M01.

## Responsibilities

- Own the vault ChannelConsent record (classrup.notify.channel_consent/v1) and the relay registration record (classrup.notify.channel_consent_registration/v1) per user, relay and channel with granted, withdrawn and expired states.
- Produce classrup.notify.channel_consent_statement/v1 and classrup.notify.channel_withdrawal/v1 in the vault and accept them at the relay named in them, verifying signer key status, audience key, chain position and channel.
- Require the F10 link - call privacy.consent.check at opt-in, match privacy.consent.withdrawn by purpose and scope.relayId, and re-link on privacy.consent.granted for the same purpose and scope.
- Derive and verify one-click unsubscribe tokens at the relay, serve UnsubscribeTokenPort and RelayWithdrawalPort to F13.S01.M02, and sign classrup.notify.channel_withdrawal_receipt/v1 with the relay key for every withdrawal made at the relay.
- Serve notify.channel.list_changes so vaults fetch relay receipts, and apply them in the vault with notify.channel.apply_relay_change.
- Expire each consent 365 days after grant at the relay and prompt the user to reconfirm the channel only, leaving the linked F10 consent as it is.

## Not responsible for

- Browser permission prompts and subscriptions (F13.S01.M01) and verified email addresses (F13.S01.M02).
- Per-category preferences (F13.S02.M04) and quiet-hours schedules (F13.S02.M02, F13.S02.M01).
- Privacy consent records themselves (F10.S01.M01), which this module reads through privacy.consent.check and its events.
- Relay identity, key chain and key pinning (F15.S02.M01 relay identity, F11.S03.M01 pinned relay keys) and key status (F16.S02.M02).
- Marketing messages; the platform sends transactional notifications only, and no promotional channel exists in the MVP.
- Blocks (N7) do not apply because consents involve only the user and the selected relay.
- Future: SMS and messaging-app channels, per-category consent granularity at the relay, consent receipts as W3C Verifiable Credentials.

## User stories

- As a member, I can switch on push notifications for my chosen relay and see which relay will send them.
- As a member, I can opt in to email via a relay that offers email and withdraw with one click from any email.
- As a member, I can withdraw a channel in settings and know the relay will stop sending to it and erase what it holds.
- As a member, I am asked to reconfirm a channel once a year.

## Edge cases

- Relay does not offer email; the email opt-in control is disabled with an explanation and no consent record is created for that relay.
- Unsubscribe token used twice; the second call returns the same withdrawn result without change.
- Unsubscribe token that was never issued or is malformed; the relay returns NOTIFY_UNSUBSCRIBE_TOKEN_INVALID (404) with no detail.
- User withdraws in the app while offline; the vault records withdrawn at once, the withdrawal waits in the sync outbox, and the UI shows sending may continue until the relay registers it.
- The recipient clicks an unsubscribe link while the vault shows granted; on the next sync the vault fetches the relay-signed withdrawal receipt with notify.channel.list_changes and applies it with via unsubscribe_link, and F10 withdraws notify_email for that relay.
- A withdrawal receipt signed by relay B names a consent registered at relay A; it is refused with NOTIFY_CHANNEL_RECEIPT_INVALID and nothing changes.
- privacy.consent.withdrawn arrives for notify_email scoped to relay A; only the email channel consent at relay A becomes withdrawn with via privacy_withdrawal, and push at relay A and email at relay B stay granted.
- F10 supersedes the notify_push grant with a new policy version; the channel consent is re-linked to the new consent ID on privacy.consent.granted and a later withdrawal of the new grant still withdraws the channel.
- Consent expires while the app is closed; the relay stops sending on the expiry date, signs a receipt with via expired, and the vault applies it on next sync.
- The relay's hostname is transferred to a new operator with a different key; the vault refuses to register there because the relay key no longer matches the relayId of the consent.
- Deletion is requested; consents show paused during the 14-day grace and nothing is sent to relays; cancelling on day 13 restores the granted view; at execution the sign step queues withdrawals to every relay before the keys are destroyed.

## UX and accessibility

- Channels settings: rows for Push and Email each with relay name and key fingerprint, status text (Not enabled, Enabled on relay X, Withdrawn, Needs reconfirmation, Paused while deletion is pending), toggle, and last changed time.
- Opt-in sheet: what is sent (a content-free alert or a short generic email), which relay sends it and what that relay learns (browser push endpoint or email address), Enable and Cancel.
- Unsubscribe confirmation page served by the relay: Unsubscribed text, channel name, Undo link that opens the app.

**States:** loading; not-enabled; granted; withdrawn; expired-reconfirm; paused; relay-unavailable; offline-pending

**Accessibility:** Toggles are native switches with labels that include the channel and relay name and status changes are announced politely.; Unsubscribe page works without JavaScript and without login, with heading structure and sufficient contrast.; Opt-in and cancel are buttons of at least 44 by 44 px.

## Owned data

- `ChannelConsent` (classrup.notify.channel_consent/v1, P2, RET-EVIDENCE)
- `ChannelConsent` (classrup.notify.channel_consent_registration/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `notify.channel.opt_in`, `notify.channel.opt_out`, `notify.channel.apply_relay_change`, `notify.channel.register`, `notify.channel.unsubscribe`, `notify.channel.expire_sweep`
- Queries: `notify.channel.get_mine`, `notify.channel.list_changes`
- Emits: `notify.channel.opted_in`, `notify.channel.opted_out`
- Consumes: `privacy.consent.withdrawn`, `privacy.consent.granted`, `privacy.deletion.requested`, `privacy.deletion.completed`

## Dependencies

F10.S01.M01, F07.S01.M01, F07.S02.M01, F11.S01.M01, F11.S03.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-107-01 | [Domain schema](domain_schema.md) | 5 |
| PS-107-02 | [Validation rules](validation_rules.md) | 5 |
| PS-107-03 | [Workflow state machine](workflow_state_machine.md) | 6 |
| PS-107-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-107-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-107-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-107-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-107-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-107-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-107-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/preferences/opt/index.ts`.

## Acceptance criteria

- All tests T01 to T20 pass in CI.
- No push or email is ever sent without a granted, unexpired, registered consent.
- Unsubscribe works with one click and no login, cannot grant consent, and reaches the vault as a relay-signed receipt.
