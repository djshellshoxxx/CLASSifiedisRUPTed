# F13.S01.M02 — Email delivery

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S01](../SPEC.md). **Process IDs:** PS-102-01…PS-102-10. **Code:** `packages/notify/src/delivery/email`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Optional email notifications, available only through a relay whose operator offers email and only after the user gave explicit channel consent (F13.S02.M03). The user's vault holds the authoritative email target (the cleartext address as P3, locale, relay and a status mirror). The relay holds a disclosed service copy of the address, sent sealed to the relay key under the notify_email channel consent, encrypted at rest, P2 for that one relay and erased when the withdrawal is registered there. The relay sends minimal emails from a fixed template registry through an EmailTransportPort (SMTP adapter or a dev log adapter): a generic subject, a generic body with a link that opens the app, no listing, message or amount content, RFC 8058 one-click unsubscribe headers from UnsubscribeTokenPort of F13.S02.M03 and a VERP return path. Bounce and complaint reports are accepted only when authenticated. Verification uses a 128-bit token valid for 24 hours. If no relay offers email, the feature stays off and in-app and push notifications are unaffected.

## Responsibilities

- Own the vault email target (classrup.notify.email_target/v1), the relay EmailAddress service copy (classrup.notify.email_address/v1) and the relay EmailDelivery record (classrup.notify.email_delivery/v1); the vault record is authoritative and the relay copy is rebuilt from it.
- Run the vault commands enable, disable and sync_status that check privacy.consent.check for notify_email and the registered channel consent, seal the address to the relay key, and mirror relay status into the vault.
- Add, verify and remove addresses at the relay through sealed requests signed with the F11.S01.M03 RFC 9421 profile (tag classrup/relay-request/v1) by an active device key, and a public verification link.
- Send emails from the fixed email template registry through EmailTransportPort with List-Unsubscribe and List-Unsubscribe-Post headers from UnsubscribeTokenPort, a VERP return path per delivery, SPF, DKIM and DMARC alignment required of the operator, and retries on temporary failures.
- Accept only authenticated bounce and complaint reports, mark an address bouncing only on the documented bounce thresholds, and turn a verified complaint into a registered withdrawal through F13.S02.M03.
- Emit relay-local notify.email.sent and notify.email.bounced, and the vault-local notify.email.bounced when the vault learns that delivery stopped, without addresses in any payload.

## Not responsible for

- Deciding when and whether to send (F13.S02.M01) and channel consent, its registration and unsubscribe tokens (F13.S02.M03).
- Message content; templates are generic and localized by key with F14.S02.M01, and no user content is ever placed in an email.
- Operating mail servers; the operator supplies the SMTP relay or provider configuration, feedback-loop sources and webhook keys.
- Marketing or bulk email; none is sent by the platform.
- Blocks (N7) do not apply because this module never acts on counterparty statements.
- Future: DKIM key rotation tooling, S/MIME or OpenPGP-encrypted emails, per-category digest emails.

## User stories

- As a member, I can add my email on a relay that offers email, verify it by link, and receive only generic alerts that tell me to open the app.
- As a member, I can unsubscribe from any email with one click.
- As a member, I can remove my address and know the relay erases its copy within 24 hours while my own vault keeps the record until I delete it.
- As a member, I see in the app when email delivery to my address stopped.
- As a relay operator, I can run with the log adapter in development and an SMTP adapter in production.

## Edge cases

- Verification link clicked after 24 hours; the relay returns EXPIRED and the app offers to send a new link within the per-user and per-address limits.
- Verification link clicked twice; the second click returns success without change.
- Address already used by another user at the same relay; the request is accepted with the same response, verification limits are counted per (user, address), and neither user can exhaust the other's quota or learn that the address exists.
- Mailbox full or temporary 4xx; delivery retries 3 times over 6 hours, then fails without marking the address bouncing.
- One authenticated hard bounce 5.1.1; the counter increments; a second within 72 hours, or one signed provider hard-bounce event, marks the address bouncing, and on its next sync the vault emits notify.email.bounced and the inbox shows that email delivery stopped.
- A bounce arrives for a delivery that already settled after 72 hours; the delivery row stays settled but the address counters and the verified to bouncing transition still apply.
- A forged DSN quoting a guessed Message-ID arrives at the relay's plain bounce address, or an ARF report from an unknown source; both are refused with NOTIFY_EMAIL_REPORT_UNVERIFIED and change nothing.
- Spam complaint from a configured feedback-loop source; treated as a one-click unsubscribe, the consent withdrawal is registered through F13.S02.M03 with via unsubscribe_link and queued deliveries are cancelled.
- One DID loops add, remove and add for many addresses, or 50 fresh DIDs from one /24 add addresses; per-user and per-IP-prefix limits refuse further verification mail and the relay-wide cap alerts the operator.
- Relay has no EmailTransportPort configured; every email command returns FEATURE_DISABLED and the app hides the email option for that relay.
- Address contains an internationalized domain; it is normalized to punycode for sending and stored in normalized form.

## UX and accessibility

- Email settings: relay name, address field, status (Not verified, Verified, Delivery stopped, Paused while deletion is pending), Send verification link, Remove address, and the statement that the relay operator can read the address it sends to.
- Verification landing page served by the relay: Email verified or link expired, with an Open app button; works without JavaScript.
- Example email preview showing the generic subject and body.

**States:** loading; not-offered; no-address; unverified; verified; bouncing; removed; paused; sending-verification; offline

**Accessibility:** Address input has a visible label, autocomplete=email and inputmode=email, and errors are announced politely.; Verification page uses semantic headings and works without JavaScript.; Emails have a plain-text part, lang attribute and sufficient contrast in the HTML part.

## Owned data

- `EmailAddress` (classrup.notify.email_address/v1, P2, RET-STANDARD)
- `EmailAddress` (classrup.notify.email_target/v1, P3, RET-STANDARD)
- `EmailDelivery` (classrup.notify.email_delivery/v1, P2, RET-SHORT)

## Interfaces

- Commands: `notify.email.enable`, `notify.email.disable`, `notify.email.sync_status`, `notify.email.add`, `notify.email.verify`, `notify.email.remove`, `notify.email.send`, `notify.email.report_bounce`
- Queries: `notify.email.get_mine`, `notify.email.get_local`
- Emits: `notify.email.sent`, `notify.email.bounced`
- Consumes: `notify.channel.opted_out`, `notify.channel.opted_in`, `privacy.deletion.requested`, `privacy.deletion.completed`

## Dependencies

F13.S02.M03, F16.S02.M02, F11.S01.M03, F07.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M03, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-102-01 | [Domain schema](domain_schema.md) | 5 |
| PS-102-02 | [Validation rules](validation_rules.md) | 4 |
| PS-102-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-102-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-102-05 | [Authorization and capabilities](authorization_capabilities.md) | 4 |
| PS-102-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-102-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-102-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-102-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-102-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/delivery/email/index.ts`.

## Acceptance criteria

- All tests T01 to T21 pass in CI.
- No email is sent without a verified address and a granted registered consent, and each email carries one-click unsubscribe headers and a VERP return path.
- Emails contain no listing, message, name or amount content in any test.
- Addresses never appear in logs, events, relay exports or query results, and no unauthenticated report changes an address or a consent.
