# PS-107-04 — Commands, queries and events: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-04.R01** Opt-in and opt-out are vault commands that produce signed statements and register them at the relay through relay commands; unsubscribe is a public relay command that redeems a token.
- **PS-107-04.R02** Each vault command emits its event in the same IndexedDB transaction as the state change, and relay-side changes are sent back to the vault as relay-signed statements.
- **PS-107-04.R03** The module consumes privacy consent and deletion events from the vault to keep consent aligned with privacy choices.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.channel.opt_in` | notify.channel.opt_in | [vault command; produces signed statement classrup.notify.channel_consent/v1] { channel: push\|email, relayId, privacyConsentId? } | { consentId, status: granted, expiresAt, syncState: local_committed } | VALIDATION_FAILED, NOTIFY_CHANNEL_UNSUPPORTED, PRECONDITION_FAILED, RATE_LIMITED, FORBIDDEN | notify.channel.opted_in | yes (Idempotency-Key) |
| `notify.channel.opt_out` | notify.channel.opt_out | [vault command; produces signed statement classrup.notify.channel_consent/v1 with status withdrawn] { consentId, expectedRevision } | { consentId, status: withdrawn, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | notify.channel.opted_out | yes (Idempotency-Key) |
| `notify.channel.register` | notify.channel.register | [relay command, relay access token] { statement (signed consent or withdrawal) } | { consentId, status, relayRegisteredAt, relayReceiptSig } | VALIDATION_FAILED, NOTIFY_CHANNEL_UNSUPPORTED, UNAUTHENTICATED, RATE_LIMITED, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `notify.channel.unsubscribe` | notify.channel.unsubscribe | [relay command, public by token; HTTP POST with List-Unsubscribe=One-Click per RFC 8058] { token } | { channel, status: withdrawn } | NOTIFY_UNSUBSCRIBE_TOKEN_INVALID, NOT_FOUND, RATE_LIMITED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.channel.get_mine` | notify.channel.read_own | [vault query] { channel? } | { items: ChannelConsent[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.channel.opted_in` | P2 | { consentId, userDid, relayId, channel, expiresAt } |
| `notify.channel.opted_out` | P2 | { consentId, userDid, relayId, channel, via } |

### Events consumed

| Type | Effect |
|---|---|
| `privacy.consent.withdrawn` | withdraw granted channel consents linked to that privacy consent and queue relay withdrawals |
| `privacy.consent.granted` | enable the opt-in controls when the notifications purpose is granted |
| `privacy.deletion.requested` | withdraw all channel consents with via account_deletion and queue relay withdrawals |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| NOTIFY_CHANNEL_UNSUPPORTED | 422 | no | channel is not push or email or the relay does not offer it |
| NOTIFY_UNSUBSCRIBE_TOKEN_INVALID | 404 | no | unsubscribe token unknown, expired or already revoked |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command notify.channel.opt_in  { "channel": "push", "relayId": "relay.example", "privacyConsentId": "0192f3b0-0000-7000-8000-000000000001" }
-> { "consentId": "0192f3b0-1111-7000-8000-000000000001", "status": "granted", "expiresAt": "2027-11-04T10:00:00.000Z", "syncState": "local_committed" }
POST https://relay.example/u/Zm9vYmFy…   (List-Unsubscribe=One-Click)
200 { "channel": "email", "status": "withdrawn" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T04 | contract | PS-107-04.R01, PS-107-04.R02, PS-107-09.R02 | each command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-107-09.T05 | integration | PS-107-04.R03 | privacy.consent.withdrawn and privacy.deletion.requested delivered | linked channels withdrawn locally and relay withdrawal queued |
| TEST-PS-107-09.T13 | a11y | PS-107-04.R01 | settings and unsubscribe page with screen reader and keyboard | switches labelled, page works without JavaScript, zero serious axe issues |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
