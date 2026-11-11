# PS-102-04 — Commands, queries and events: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-04.R01** The vault exposes enable, disable and sync_status commands and a local view; the relay exposes the sealed add, remove and get_mine requests signed by an active device key, the public token verify link, and the internal send and report_bounce commands.
- **PS-102-04.R02** Each relay send, bounce and cancellation is recorded and emits its relay-local event in the same SQLite transaction as the status change, and the vault-local notify.email.bounced is emitted in the IndexedDB transaction that updates the email target.
- **PS-102-04.R03** The relay instance consumes relay-local channel consent events to erase addresses and cancel deliveries; the vault instance consumes vault-local channel consent events, privacy.deletion.requested (pause only) and privacy.deletion.completed.
- **PS-102-04.R04** Unsubscribe URLs come from UnsubscribeTokenPort.urlFor(consentId) of F13.S02.M03 at render time, so every email carries a working token without storing it, and a verified complaint calls RelayWithdrawalPort.withdraw(consentId, unsubscribe_link) of the same module.
- **PS-102-04.R05** The module registers ExportSectionPort (section notify.email), DeletionPort (purge step) and RetentionPurgePort (kinds notify.email_target and notify.email_delivery) with F10 (N6), annotates every field with its F10.S02.M02 class, calls privacy.consent.check for notify_email before enable, and routes every limit through RateLimitPort of F12.S03.M03 (N18).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.email.enable` | notify.email.enable | [vault command; requires privacy.consent.check {purpose: notify_email, relayId} granted and the local email ChannelConsent registered; stores the email target, seals {address, locale} to the relay's published key and calls notify.email.add] { relayId, address, locale } | { emailTargetId, emailAddressId?, status: pending\|unverified, maskedAddress, verifyExpiresAt? } | VALIDATION_FAILED, NOTIFY_EMAIL_ADDRESS_INVALID, PRECONDITION_FAILED, RATE_LIMITED, FEATURE_DISABLED, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `notify.email.disable` | notify.email.disable | [vault command; marks the email target removed, queues notify.email.remove in the F15.S01.M01 sync outbox and deletes the address from the vault within 24 h] { emailTargetId, expectedRevision } | { emailTargetId, status: removed, revision, relaySync: prepared\|transport_acknowledged\|done } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `notify.email.sync_status` | notify.email.sync_status | [vault command run at app open, every 6 h while open and on service-worker wake; calls notify.email.get_mine and updates the email target] { relayId } | { emailTargetId, status, changed: boolean } | NOT_FOUND, DEPENDENCY_UNAVAILABLE | notify.email.bounced | yes (Idempotency-Key) |
| `notify.email.add` | notify.email.add | [relay command; request signed by an active device key of userDid (classrup/relay-request/v1); body sealed to the relay's published key] { consentId, sealed: { address, locale } } | { emailAddressId, status: unverified, maskedAddress, verifyExpiresAt } | VALIDATION_FAILED, NOTIFY_EMAIL_ADDRESS_INVALID, PRECONDITION_FAILED, RATE_LIMITED, FEATURE_DISABLED, UNAUTHENTICATED |  | yes (Idempotency-Key) |
| `notify.email.verify` | notify.email.verify | [relay command, public by token via HTTPS GET landing page that issues a POST] { token } | { emailAddressId, status: verified } | EXPIRED, NOT_FOUND, RATE_LIMITED |  | yes (Idempotency-Key) |
| `notify.email.remove` | notify.email.remove | [relay command; request signed by an active device key of the address owner] { emailAddressId } | { emailAddressId, status: removed } | NOT_FOUND, UNAUTHENTICATED, RATE_LIMITED |  | yes (Idempotency-Key) |
| `notify.email.send` | notify.email.send | [relay internal command called only by the F13.S02.M01 gate; locale comes from the EmailAddress copy] { userDid, kind: notice\|security_notice\|activity\|digest, dispatchRef } | { deliveryId, status: queued\|sent } | VALIDATION_FAILED, PRECONDITION_FAILED, NOTIFY_EMAIL_NOT_DELIVERABLE, RATE_LIMITED, FEATURE_DISABLED, DEPENDENCY_UNAVAILABLE | notify.email.sent | yes (Idempotency-Key) |
| `notify.email.report_bounce` | notify.email.report_bounce | [relay internal command from the transport adapter after authentication] { transportMessageId, verpTag?, kind: hard\|soft\|complaint, source: dsn\|provider_webhook\|feedback_loop, providerSignature?, diagnosticCode? } | { deliveryId, deliveryStatus, addressStatus } | NOT_FOUND, VALIDATION_FAILED, NOTIFY_EMAIL_REPORT_UNVERIFIED | notify.email.bounced | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.email.get_mine` | notify.email.read_own | [relay query signed by an active device key of the user] {} | { emailAddressId?, maskedAddress?, status, lastDeliveryAt? } | UNAUTHENTICATED, FEATURE_DISABLED, RATE_LIMITED |
| `notify.email.get_local` | notify.email.read_local | [vault query] { relayId? } | { items: [{ emailTargetId, relayHost, maskedAddress, status, lastStatusSyncAt?, paused: boolean }] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.email.sent` | P2 | { deliveryId, userDid, kind, attempt } — relay-local |
| `notify.email.bounced` | P2 | { emailAddressId, userDid, relayId, kind: hard\|soft\|complaint\|unknown, addressStatus, deliveryId? (relay-local only), origin: relay\|vault } — relay-local from report_bounce; vault-local from sync_status when the mirrored status becomes bouncing |

### Events consumed

| Type | Effect |
|---|---|
| `notify.channel.opted_out` | relay instance (relay-local event from notify.channel.register, notify.channel.unsubscribe, RelayWithdrawalPort or the expiry sweep): when channel is email, cancel queued deliveries, mark the address removed and erase the ciphertext at once and at the latest within 24 hours; vault instance (vault-local event): mark the email target for relayId removed and delete the address within 24 hours |
| `notify.channel.opted_in` | relay instance: allow add for userDid at this relay once the consent is registered; vault instance: offer Add address for relayId |
| `privacy.deletion.requested` | vault instance: reversible pause only - show the email channel as paused; nothing is erased and nothing is sent to the relay; the pause is derived from privacy.deletion.assert_not_pending, so a cancelled request resumes without any undo |
| `privacy.deletion.completed` | vault instance: notification only; confirm that the DeletionPort purge step removed every email target; nothing is signed and no relay is called |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| NOTIFY_EMAIL_ADDRESS_INVALID | 422 | no | address syntax is invalid or the domain is blocked |
| NOTIFY_EMAIL_NOT_DELIVERABLE | 409 | no | address is not verified, is bouncing, or the daily cap of 20 emails was reached |
| NOTIFY_EMAIL_REPORT_UNVERIFIED | 422 | no | a bounce or complaint report lacks a valid VERP tag and Message-ID match, a configured feedback-loop source or a provider signature |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Execution sites (ADR-0016): enable, disable, sync_status and get_local run in the vault; add, verify, remove, get_mine, send and report_bounce run on the relay. No statement is produced; relay requests are signed with a device key (classrup/relay-request/v1) and checked against F16.S02.M02 key status, with principal resolution through F07.S02.M01. Unsubscribe headers use UnsubscribeTokenPort.urlFor(consentId) and verified complaints use RelayWithdrawalPort.withdraw(consentId, unsubscribe_link), both in-process relay ports of F13.S02.M03. The VERP return path is bounce+<deliveryId>.<verpTag>@<relay mail domain>. paused in get_local is derived from privacy.deletion.assert_not_pending of F10.S01.M04 and stores nothing. Privacy ports (N6): ExportSectionPort section notify.email with schema classrup.notify.email_target/v1 (the user's own P3 address); DeletionPort plan {willDelete: email targets, willPseudonymize: none, blockers: none} and step purge, which deletes the vault targets (relay copies are erased when the F13.S02.M03 sign-step withdrawal is registered at each relay); RetentionPurgePort kinds notify.email_target (RET-STANDARD, anchorField endedAt, purge after 24 h) and notify.email_delivery (relay, RET-SHORT, anchorField queuedAt). Every field is classified with F10.S02.M02.

### Example

```
vault command notify.email.enable { "relayId": "relay:k3n7v2…", "address": "alex@example.org", "locale": "en" }
-> privacy.consent.check { purpose: notify_email, relayId } granted; email channel consent registered
POST /api/v1/relay/notify.email.add   (signed classrup/relay-request/v1 by device key …#d2)
Idempotency-Key: 0192f3b6-0000-7000-8000-000000000001
{ "consentId": "0192f3b0-2222-7000-8000-000000000001", "sealed": "<HPKE box of {address, locale}>" }
201 { "emailAddressId": "0192f3b6-1111-7000-8000-000000000001", "status": "unverified", "maskedAddress": "a***@example.org", "verifyExpiresAt": "2026-11-05T10:00:00.000Z" }
outgoing email (kind notice, template notify.tpl.email.notice)
Subject: You have a new notification on ClassRup
Return-Path: bounce+0192f3b6-3333-7000-8000-000000000001.Qx8dK2mPz0aR4tYu@mail.relay.example
List-Unsubscribe: <https://relay.example/u/0192f3b0-2222-7000-8000-000000000001.mN3…>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
Body: Open the ClassRup app to see it. https://app.example/
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T03 | contract | PS-102-01.R03, PS-102-04.R04, PS-102-09.R02 | send every template kind through the fake SMTP server | subject and body generic with the app origin link only; List-Unsubscribe URL from UnsubscribeTokenPort works on POST; List-Unsubscribe-Post and VERP Return-Path present; DKIM-signed; no user content |
| TEST-PS-102-09.T05 | contract | PS-102-04.R01, PS-102-04.R02, PS-102-09.R02 | each command and query executes in its environment | outputs and event payloads validate against registry schemas; relay events in the SQLite transaction and the vault event in the IndexedDB transaction of the change |
| TEST-PS-102-09.T06 | integration | PS-102-04.R03, PS-102-03.R03 | relay-local notify.channel.opted_out for email to the relay instance; vault-local opted_out, privacy.deletion.requested and privacy.deletion.completed to the vault instance | relay cancels queued deliveries and erases ciphertext; vault target removed; deletion request only shows paused and erases nothing; completed signs nothing |
| TEST-PS-102-09.T18 | integration | PS-102-04.R05, PS-102-01.R04 | DeletionPort plan and purge, export section and retention purge with F10 registry doubles; enable with privacy.consent.check not granted | purge deletes the vault targets; section notify.email exported; delivery rows purged after 30 days; enable refused PRECONDITION_FAILED before anything is sealed |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
