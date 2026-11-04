# F13.S01.M02 — Email delivery

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F13.S01](../SPEC.md). **Process IDs:** PS-102-01…PS-102-10. **Code:** `packages/notify/src/delivery/email`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Optional email notifications, available only through a relay whose operator offers email and only after the user gave explicit channel consent (F13.S02.M03). The relay holds the verified email address as a P3 secret (encrypted at rest) and sends minimal templated emails through an EmailTransportPort (SMTP adapter or a dev log adapter): a generic subject, a generic body with a link that opens the app, no listing, message or amount content, and RFC 8058 one-click unsubscribe headers. Verification uses a 128-bit token valid for 24 hours. If no relay offers email, the feature stays off and in-app and push notifications are unaffected.

## Responsibilities

- Own the EmailAddress record (address, status, verification token hash) and the EmailDelivery record (template, status, attempts) at the relay.
- Add, verify and remove addresses through signed requests from the user's registered device and a public verification link.
- Send templated emails through EmailTransportPort with List-Unsubscribe and List-Unsubscribe-Post headers, SPF, DKIM and DMARC alignment required of the operator, and retries on temporary failures.
- Process bounces and complaints so that a hard bounce or 3 soft bounces in 7 days mark the address bouncing and stop sends.
- Emit notify.email.sent and notify.email.bounced without addresses in payloads.

## Not responsible for

- Deciding when and whether to send (F13.S02.M01) and consent and unsubscribe tokens (F13.S02.M03).
- Message content; templates are generic and localized by key, and no user content is ever placed in an email.
- Operating mail servers; the operator supplies the SMTP relay or provider configuration.
- Marketing or bulk email; none is sent by the platform.
- Future: DKIM key rotation tooling, S/MIME or OpenPGP-encrypted emails, per-category digest emails.

## User stories

- As a member, I can add my email on a relay that offers email, verify it by link, and receive only generic alerts that tell me to open the app.
- As a member, I can unsubscribe from any email with one click.
- As a member, I can remove my address and know the relay deletes it within 24 hours.
- As a relay operator, I can run with the log adapter in development and an SMTP adapter in production.

## Edge cases

- Verification link clicked after 24 hours; the relay returns EXPIRED and the app offers to send a new link, limited to 5 per day.
- Verification link clicked twice; the second click returns success without change.
- Address already used by another user at the same relay; the new request is accepted but verification mail is not sent twice to the same address within 1 hour and the verified owner sees nothing, so addresses cannot be enumerated.
- Mailbox full or temporary 4xx; delivery retries 3 times over 6 hours, then fails without marking the address bouncing.
- Hard bounce 5.1.1; address becomes bouncing at once and the in-app inbox shows that email delivery stopped.
- Spam complaint feedback; treated as unsubscribe and the consent is withdrawn through the opt module.
- Relay has no EmailTransportPort configured; every email command returns FEATURE_DISABLED and the app hides the email option for that relay.
- Address contains an internationalized domain; it is normalized to punycode for sending and stored in normalized form.

## UX and accessibility

- Email settings: relay name, address field, status (Not verified, Verified, Delivery stopped), Send verification link, Remove address, explanation of what is sent.
- Verification landing page served by the relay: Email verified or link expired, with an Open app button; works without JavaScript.
- Example email preview showing the generic subject and body.

**States:** loading; not-offered; no-address; unverified; verified; bouncing; removed; sending-verification; offline

**Accessibility:** Address input has a visible label, autocomplete=email and inputmode=email, and errors are announced politely.; Verification page uses semantic headings and works without JavaScript.; Emails have a plain-text part, lang attribute and sufficient contrast in the HTML part.

## Owned data

- `EmailAddress` (classrup.notify.email_address/v1, P3, RET-STANDARD)
- `EmailDelivery` (classrup.notify.email_delivery/v1, P2, RET-SHORT)

## Interfaces

- Commands: `notify.email.add`, `notify.email.verify`, `notify.email.remove`, `notify.email.send`, `notify.email.report_bounce`
- Queries: `notify.email.get_mine`
- Emits: `notify.email.sent`, `notify.email.bounced`
- Consumes: `notify.channel.opted_out`, `notify.channel.opted_in`, `privacy.deletion.requested`

## Dependencies

F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-102-01 | [Domain schema](domain_schema.md) | 3 |
| PS-102-02 | [Validation rules](validation_rules.md) | 3 |
| PS-102-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-102-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-102-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-102-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-102-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-102-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-102-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-102-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/notify/src/delivery/email/index.ts`.

## Acceptance criteria

- All tests T01 to T14 pass in CI.
- No email is sent without verified address and granted consent, and each email carries one-click unsubscribe headers.
- Emails contain no listing, message, name or amount content in any test.
- Addresses never appear in logs, events, exports or query results.
