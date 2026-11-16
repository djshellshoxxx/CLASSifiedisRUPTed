# PS-102-04 — Commands, queries and events: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-04.R01** All commands are relay commands; add and remove are signed by a registered device key and driven from the vault UI, verify is a public token link, send and report_bounce are relay internal.
- **PS-102-04.R02** Each send and bounce emits its event in the same SQLite transaction as the status change.
- **PS-102-04.R03** The module consumes consent, deletion and opt-out events to stop sending and remove data.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.email.add` | notify.email.add | [relay command, signed by a registered device key] { address, locale } | { emailAddressId, status: unverified, maskedAddress, verifyExpiresAt } | VALIDATION_FAILED, NOTIFY_EMAIL_ADDRESS_INVALID, PRECONDITION_FAILED, RATE_LIMITED, FEATURE_DISABLED, UNAUTHENTICATED |  | yes (Idempotency-Key) |
| `notify.email.verify` | notify.email.verify | [relay command, public by token via HTTPS GET landing page that issues a POST] { token } | { emailAddressId, status: verified } | EXPIRED, NOT_FOUND, RATE_LIMITED |  | yes (Idempotency-Key) |
| `notify.email.remove` | notify.email.remove | [relay command, signed by a registered device key] { emailAddressId, expectedRevision } | { emailAddressId, status: removed } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `notify.email.send` | notify.email.send | [relay internal command called by the F13.S02.M01 gate] { userDid, templateKey, category, locale } | { deliveryId, status: queued\|sent } | VALIDATION_FAILED, PRECONDITION_FAILED, NOTIFY_EMAIL_NOT_DELIVERABLE, RATE_LIMITED, FEATURE_DISABLED, DEPENDENCY_UNAVAILABLE | notify.email.sent | yes (Idempotency-Key) |
| `notify.email.report_bounce` | notify.email.report_bounce | [relay internal command from the transport adapter] { transportMessageId, kind: hard\|soft\|complaint, diagnosticCode? } | { deliveryId, status: bounced, addressStatus } | NOT_FOUND, VALIDATION_FAILED | notify.email.bounced | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.email.get_mine` | notify.email.read_own | [relay query signed by a device key] {} | { emailAddressId?, maskedAddress?, status, lastDeliveryAt? } | UNAUTHENTICATED, FEATURE_DISABLED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.email.sent` | P2 | { deliveryId, userDid, templateKey, category, attempt } |
| `notify.email.bounced` | P2 | { deliveryId, userDid, kind, addressStatus } |

### Events consumed

| Type | Effect |
|---|---|
| `notify.channel.opted_out` | when the channel is email, cancel queued deliveries and remove the address within 24 hours |
| `notify.channel.opted_in` | when the channel is email, enable the add command for the user at this relay |
| `privacy.deletion.requested` | remove the address and cancel queued deliveries within 24 hours |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| NOTIFY_EMAIL_ADDRESS_INVALID | 422 | no | address syntax is invalid or the domain is blocked |
| NOTIFY_EMAIL_NOT_DELIVERABLE | 409 | no | address is not verified, is bouncing, or the daily cap of 20 emails was reached |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
POST /api/v1/relay/notify.email.add
Idempotency-Key: 0192f3b6-0000-7000-8000-000000000001
{ "address": "alex@example.org", "locale": "en" }
201 { "emailAddressId": "0192f3b6-1111-7000-8000-000000000001", "status": "unverified", "maskedAddress": "a***@example.org", "verifyExpiresAt": "2026-11-05T10:00:00.000Z" }
outgoing email (template notify.tpl.offers.made)
Subject: You have a new notification on ClassRup
List-Unsubscribe: <https://relay.example/u/…>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
Body: Open the ClassRup app to see it. https://app.example/
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T03 | contract | PS-102-01.R03, PS-102-04.R02 | send a template email through the fake SMTP server | subject and body are generic, contain app origin link only, headers List-Unsubscribe and List-Unsubscribe-Post present, DKIM-signed by the adapter, no user content |
| TEST-PS-102-09.T05 | contract | PS-102-04.R01, PS-102-04.R02, PS-102-09.R02 | each command and query executes | outputs and event payloads validate against registry schemas |
| TEST-PS-102-09.T06 | integration | PS-102-04.R03 | channel opted out, deletion requested | queued deliveries cancelled, address removed within 24 h |
| TEST-PS-102-09.T14 | a11y | PS-102-04.R01 | settings screen and verification page with screen reader and without JavaScript | labelled input, page works, zero serious axe issues |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
