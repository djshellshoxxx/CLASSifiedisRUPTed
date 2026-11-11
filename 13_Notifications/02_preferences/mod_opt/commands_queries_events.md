# PS-107-04 — Commands, queries and events: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-04.R01** Opt-in, opt-out and apply_relay_change are vault commands; opt-in and opt-out produce signed statements registered at the relay with notify.channel.register; unsubscribe is a public relay command that redeems a token, the expiry sweep is a relay internal command, and list_changes is a signed relay query.
- **PS-107-04.R02** Each vault command emits its event in the same IndexedDB transaction as the state change, and register, unsubscribe, RelayWithdrawalPort and the expiry sweep emit relay-local notify.channel.opted_in or notify.channel.opted_out in the same SQLite transaction (EVT-8 relay side), which the relay instances of push, email, quiet hours, preferences and the gate consume.
- **PS-107-04.R03** The module consumes privacy consent events matched by purpose and scope.relayId, never by consent ID (which changes when F10 supersedes a grant), and privacy.deletion.requested (pause only) and privacy.deletion.completed.
- **PS-107-04.R04** Statements are registered with F11.S01.M01 (N2) - channel_consent_statement and channel_withdrawal with signer role principal and audience the relay named in payload relayId, and channel_withdrawal_receipt with signer role relay (key chain pinned through F11.S03.M01), accepted only for consents registered at that same relay.
- **PS-107-04.R05** The relay ports UnsubscribeTokenPort.urlFor(consentId) and RelayWithdrawalPort.withdraw(consentId, via) are provided in-process to F13.S01.M02 for List-Unsubscribe headers and verified complaints.
- **PS-107-04.R06** The module registers ExportSectionPort (section notify.channel_consents), DeletionPort (sign, pseudonymize and purge steps) and RetentionPurgePort (kind notify.channel_consent) with F10 (N6), classifies every field with F10.S02.M02, calls privacy.consent.check, and routes limits through RateLimitPort of F12.S03.M03 (N18).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.channel.opt_in` | notify.channel.opt_in | [vault command; calls privacy.consent.check {purpose: notify_push\|notify_email, relayId}; produces classrup.notify.channel_consent_statement/v1 sealed to the relay's published key and queues notify.channel.register] { channel: push\|email, relayId, privacyConsentId, privacyPurpose } | { consentId, status: granted, expiresAt, statementCid, syncState: prepared } | VALIDATION_FAILED, NOTIFY_CHANNEL_UNSUPPORTED, PRECONDITION_FAILED, RATE_LIMITED | notify.channel.opted_in | yes (Idempotency-Key) |
| `notify.channel.opt_out` | notify.channel.opt_out | [vault command; produces classrup.notify.channel_withdrawal/v1 naming the grant cid and queues notify.channel.register] { consentId, expectedRevision } | { consentId, status: withdrawn, revision, withdrawalCid, syncState: prepared } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | notify.channel.opted_out | yes (Idempotency-Key) |
| `notify.channel.apply_relay_change` | notify.channel.apply_relay_change | [vault command; ingests one classrup.notify.channel_withdrawal_receipt/v1 fetched with notify.channel.list_changes] { relayId, receipt } | { consentId, status: withdrawn\|expired, via, applied: boolean } | VALIDATION_FAILED, NOTIFY_CHANNEL_RECEIPT_INVALID, NOT_FOUND | notify.channel.opted_out | yes (Idempotency-Key) |
| `notify.channel.register` | notify.channel.register | [relay command; request signed by an active device key of userDid; body is a sealed classrup.notify.channel_consent_statement/v1 or classrup.notify.channel_withdrawal/v1 envelope] { statement } | { consentId, status, relayRegisteredAt, acceptance: { cid, outcome: applied\|duplicate, sig } } | VALIDATION_FAILED, NOTIFY_CHANNEL_UNSUPPORTED, UNAUTHENTICATED, RATE_LIMITED, FEATURE_DISABLED | notify.channel.opted_in, notify.channel.opted_out | yes (Idempotency-Key) |
| `notify.channel.unsubscribe` | notify.channel.unsubscribe | [relay command, public by token; HTTP POST with List-Unsubscribe=One-Click per RFC 8058 to /u/<consentId>.<token>] { consentId, token } | { channel, status: withdrawn } | NOTIFY_UNSUBSCRIBE_TOKEN_INVALID, RATE_LIMITED | notify.channel.opted_out | yes (Idempotency-Key) |
| `notify.channel.expire_sweep` | notify.channel.expire | [relay internal sweep every 5 minutes] { now, batchSize ≤ 1000 } | { expired, receipts } | DEPENDENCY_UNAVAILABLE | notify.channel.opted_out | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.channel.get_mine` | notify.channel.read_own | [vault query] { channel? } | { items: ChannelConsent[] with paused derived from privacy.deletion.assert_not_pending } |  |
| `notify.channel.list_changes` | notify.channel.read_changes | [relay query signed by an active device key of the user] { sinceSeq } | { items: classrup.notify.channel_withdrawal_receipt/v1[] (≤ 100), nextSeq } | UNAUTHENTICATED, RATE_LIMITED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.channel.opted_in` | P2 | { consentId, userDid, relayId, channel, privacyPurpose, expiresAt, side: vault\|relay } — vault-local from opt_in; relay-local from register of a grant |
| `notify.channel.opted_out` | P2 | { consentId, userDid, relayId, channel, via: settings\|unsubscribe_link\|privacy_withdrawal\|account_deletion\|relay_policy\|expired, side: vault\|relay } — vault-local from opt_out and apply_relay_change; relay-local from register of a withdrawal, unsubscribe, RelayWithdrawalPort and expire_sweep |

### Events consumed

| Type | Effect |
|---|---|
| `privacy.consent.withdrawn` | vault instance: when purpose is notify_push or notify_email, withdraw the granted channel consent whose channel matches the purpose and whose relayId equals scope.relayId with via privacy_withdrawal and queue the relay withdrawal; matching uses purpose and scope, never consentId; an already withdrawn consent is a no-op |
| `privacy.consent.granted` | vault instance: when purpose is notify_push or notify_email, enable the opt-in control for scope.relayId and re-link a granted channel consent of the same purpose and relay to the new consentId when F10 superseded the previous grant; the registered statement is not re-sent because the relay never interprets the F10 consent ID |
| `privacy.deletion.requested` | vault instance: reversible pause only - consents show paused while privacy.deletion.assert_not_pending reports a pending deletion; nothing is withdrawn, signed or sent to relays, so a cancelled request restores the granted view without any undo; withdrawals are signed in the DeletionPort sign step at execution |
| `privacy.deletion.completed` | vault instance: notification only; confirm that the sign step queued withdrawals for every relay and the purge or pseudonymize step ran; nothing is signed on this event |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| NOTIFY_CHANNEL_UNSUPPORTED | 422 | no | channel is not push or email or the relay does not offer it |
| NOTIFY_UNSUBSCRIBE_TOKEN_INVALID | 404 | no | unsubscribe token does not verify for any consent registered at this relay |
| NOTIFY_CHANNEL_RECEIPT_INVALID | 422 | no | a withdrawal receipt is not signed by the key chain of the relay where the named consent was registered or names another statement |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Execution sites (ADR-0016): opt_in, opt_out, apply_relay_change and get_mine run in the vault; register, unsubscribe, expire_sweep and list_changes run on the relay. Statements (N2, registered with F11.S01.M01; CTR-FED-001 envelopes, per-author seq and prev, sealed to the relay's published key because they are P2 for that relay only): classrup.notify.channel_consent_statement/v1 - signer role principal (ext.signerKey active in the author's portable document, F07.S02.M01, and in F16.S02.M02 at receipt), audience the relay named in payload relayId, payload exactly {consentId, channel, relayId, relayKeyId, privacyConsentId, privacyPurpose, grantedAt, expiresAt}, maxAge 400 d; classrup.notify.channel_withdrawal/v1 - signer role principal, same audience, payload {consentId, targetCid, channel, relayId, via: settings|privacy_withdrawal|account_deletion, withdrawnAt}, maxAge 400 d; classrup.notify.channel_withdrawal_receipt/v1 - signer role relay (author is the relay key of relayId, pinned through F11.S03.M01 and the F15.S02.M01 key chain), audience the consenting principal, payload {consentId, targetCid, channel, relayId, via: unsubscribe_link|relay_policy|expired, effectiveAt, changeSeq}, accepted only for a consent registered at that same relay, maxAge 400 d. The acceptance signature returned by register is the relay key over the statement cid, issued only after signature, consent and chain checks; HTTP 2xx before it is transport_acknowledged. Relay ports: UnsubscribeTokenPort.urlFor(consentId) -> {url, token} with token = base64url(HMAC-SHA256( relayUnsubscribeKey, consentId || channel)), keys rotated yearly and retained 400 days; RelayWithdrawalPort.withdraw( consentId, via: unsubscribe_link|relay_policy) -> {changeSeq}, used by F13.S01.M02 for verified complaints and by operators. A verified complaint counts as a one-click unsubscribe (via unsubscribe_link). Privacy ports (N6): ExportSectionPort section notify.channel_consents with schemas classrup.notify.channel_consent/v1 and the signed statements and receipts; DeletionPort plan {willDelete: records when keepEvidence is false, willPseudonymize: userDid in retained records, blockers: none} with step sign (sign classrup.notify.channel_withdrawal/v1 with via account_deletion for every granted consent and queue it in the F15.S01.M01 sync outbox before revoke_keys and destroy_keys), step pseudonymize and step purge; RetentionPurgePort kind notify.channel_consent, class RET-EVIDENCE, anchorField withdrawnAtClaim. Every field is classified with F10.S02.M02.

### Example

```
vault command notify.channel.opt_in  { "channel": "push", "relayId": "relay:k3n7v2q8…", "privacyConsentId": "0192f3b0-0000-7000-8000-000000000001", "privacyPurpose": "notify_push" }
-> privacy.consent.check { purpose: notify_push, relayId: relay:k3n7v2q8… } granted
-> { "consentId": "0192f3b0-1111-7000-8000-000000000001", "status": "granted", "expiresAt": "2027-11-04T10:00:00.000Z", "statementCid": "sha256-9f2c…", "syncState": "prepared" }
relay command notify.channel.register { "statement": <sealed classrup.notify.channel_consent_statement/v1> }
-> { "consentId": "0192f3b0-1111-…", "status": "granted", "relayRegisteredAt": "2026-11-04T10:00:01.200Z", "acceptance": { "cid": "sha256-9f2c…", "outcome": "applied", "sig": "…" } }   vault syncState -> peer_accepted; relay-local notify.channel.opted_in
POST https://relay.example/u/0192f3b0-2222-7000-8000-000000000001.mN3qTz…   (List-Unsubscribe=One-Click)
200 { "channel": "email", "status": "withdrawn" }   relay-local notify.channel.opted_out { via: unsubscribe_link }; receipt changeSeq 7
vault: notify.channel.list_changes { sinceSeq: 6 } -> [receipt 7] -> notify.channel.apply_relay_change -> vault-local notify.channel.opted_out { via: unsubscribe_link }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T04 | contract | PS-107-04.R01, PS-107-04.R02, PS-107-09.R02, PS-107-01.R04 | each command and query executes in its environment | outputs, statements, receipts and event payloads validate against registry schemas; statement schemas differ from the record schemas; relay events in the SQLite transaction of the change |
| TEST-PS-107-09.T05 | integration | PS-107-04.R03, PS-107-02.R04 | privacy.consent.withdrawn for notify_email at R; privacy.consent.granted superseding PC1 then withdrawn | only email at R withdrawn with via privacy_withdrawal; push consent re-linked to the new F10 ID and withdrawn when the new grant is withdrawn |
| TEST-PS-107-09.T09 | integration | PS-107-09.R03, PS-107-04.R02 | dispatch with no consent, withdrawn consent and expired consent; then an email unsubscribe link at R | relay sends nothing in each case; after the link no address ciphertext remains at R within 24 h and no push subscription of U remains after a push withdrawal |
| TEST-PS-107-09.T14 | abuse | PS-107-04.R04, PS-107-02.R01, PS-107-07.R04 | withdrawal receipt signed by relay B for a consent at R; receipt signed by a user device key; consent statement whose audience key is not R's key; R rotated to k2 and signs with k2 within 7 days and with k1 after 8 days | B's and the device-signed receipts refused NOTIFY_CHANNEL_RECEIPT_INVALID; wrong audience refused VALIDATION_FAILED; k2 accepted; stale k1 refused |
| TEST-PS-107-09.T15 | integration | PS-107-02.R05, PS-107-04.R05 | enable push before the registration is accepted; then after acceptance; email module renders a List-Unsubscribe URL and a complaint arrives | push enable refused PRECONDITION_FAILED then accepted; UnsubscribeTokenPort URL verifies; complaint withdraws through RelayWithdrawalPort with via unsubscribe_link |
| TEST-PS-107-09.T16 | integration | PS-107-03.R05, PS-107-04.R06 | deletion requested, cancel on day 13; a second request executed; DeletionPort plan, export section and retention purge with F10 doubles | during grace consents show paused and nothing reaches relays; cancel restores granted with no event; at execution withdrawals with via account_deletion are queued to every relay before destroy_keys; section exported; records pseudonymized when kept |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, F07.S02.M01, F11.S01.M01, F11.S03.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
