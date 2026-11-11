# PS-076-04 — Commands, queries and events: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-04.R01** Grant and withdraw are vault commands; for federation_publish they also produce classrup.privacy.consent_statement/v1 and classrup.privacy.consent_withdrawal/v1; check and list are vault queries; privacy.consent.relay_register is the relay command that accepts and acknowledges those statements, and privacy.consent.relay_check is an in-process relay query.
- **PS-076-04.R02** Grant and withdraw emit events into the vault outbox in the same IndexedDB transaction as the state change.
- **PS-076-04.R03** Other modules must call privacy.consent.check before processing for a purpose and treat any failure as not granted.
- **PS-076-04.R04** Each statement declares signer role and audience for the N2 registry; both are signed by the principal and addressed to one named relay, sealed to that relay's published key because they are P2 for that relay only (PRV-5), and notify_email and notify_push produce no statement here because the F13.S02.M03 channel consent carries consentId and purpose.
- **PS-076-04.R05** The privacy ports of this module are defined in the note, including the DeletionPort step that withdraws every consent and signs the federation withdrawals before F07.S01.M01 destroys the keys.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `privacy.consent.grant` | privacy.consent.grant | [vault command; produces signed statement classrup.privacy.consent_statement/v1 for federation_publish only] { purpose, scope?: {relayId?, recordKinds?}, policyId, policyVersion, policyHash, locale } | { consentId, revision: 1, status: granted, statementCid?, peerSync? } | VALIDATION_FAILED, PRIVACY_POLICY_STALE, FEATURE_DISABLED, RATE_LIMITED | privacy.consent.granted | yes (Idempotency-Key) |
| `privacy.consent.withdraw` | privacy.consent.withdraw | [vault command; produces signed statement classrup.privacy.consent_withdrawal/v1 for federation_publish] { consentId, expectedRevision } | { consentId, revision, status: withdrawn, withdrawalCid?, peerSync? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | privacy.consent.withdrawn | yes (Idempotency-Key) |
| `privacy.consent.relay_register` | privacy.consent.relay_register | [relay command; request signed by a device key of the author] { statement: sealed classrup.privacy.consent_statement/v1 or classrup.privacy.consent_withdrawal/v1 envelope } | { cid, status: registered\|withdrawn\|duplicate, relayReceivedAt, relayAckSig (relay signature over the statement cid, evidence for peer_accepted) } | VALIDATION_FAILED, PRIVACY_CONSENT_STATEMENT_INVALID, RATE_LIMITED, FEATURE_DISABLED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `privacy.consent.check` | privacy.consent.check | { purpose, relayId?, recordKind? } | { granted: boolean, consentId?, policyVersion?, reason?: none\|withdrawn\|lapsed\|scope } |  |
| `privacy.consent.list_mine` | privacy.consent.read | { purpose?, status?, cursor?, limit ≤ 100 } | { items: PrivacyConsent[], nextCursor? } |  |
| `privacy.consent.relay_check` | privacy.consent.relay_check | [relay in-process query] { authorDid, recordKind? } | { granted: boolean, grantCid?, policyVersion? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `privacy.consent.granted` | P3 | { consentId, purpose, scope, policyId, policyVersion } |
| `privacy.consent.withdrawn` | P3 | { consentId, purpose, scope, reason: user\|unsubscribe\|account_deletion\|policy_changed } |

### Events consumed

| Type | Effect |
|---|---|
| `notify.channel.opted_out` | only when via is unsubscribe_link or settings - withdraw the granted consent whose purpose matches the channel (email to notify_email, push to notify_push) and whose scope.relayId equals relayId, with source unsubscribe or ui; via expired, account_deletion, privacy_withdrawal or relay_policy is ignored, and an already withdrawn consent is a no-op |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PRIVACY_POLICY_STALE | 409 | no | the policy hash does not match the current policy text; reload and read the new text |
| PRIVACY_CONSENT_STATEMENT_INVALID | 422 | no | a consent or withdrawal statement failed the signer, audience, allowlist, chain or replay checks at the relay |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements (N2, registered with F11.S01.M01 roleFor). classrup.privacy.consent_statement/v1 - signer role principal, that is a registered, non-revoked device key of the did that owns vaultId, which is the envelope author; audience the relay named in payload relayId, sealed to that relay's published key; payload exactly {consentId, purpose: federation_publish, relayId, recordKinds, policyId, policyVersion, policyHash, grantedAt}; per-author seq and prev. classrup.privacy.consent_withdrawal/v1 - same signer role and audience; payload exactly {consentId, targetCid (cid of the grant it revokes), purpose, relayId, withdrawnAt, reason: user|unsubscribe|account_deletion|policy_changed}. notify_email and notify_push send no F10 statement; F13.S02.M03 classrup.notify.channel_consent/v1 references consentId and purpose, and its 365-day channel expiry asks the user to reconfirm the channel only, while the purpose consent here has no time expiry. analytics_share and location_precise are local gates without a statement. Relay side - the relay keeps verified statements per (author did, relayId) and answers privacy.consent.relay_check for its federation handlers. Privacy ports (N6) - ExportSectionPort section privacy.consents with schemas classrup.privacy.consent/v1, classrup.privacy.consent_statement/v1 and classrup.privacy.consent_withdrawal/v1; DeletionPort plan {willDelete: consent rows when keepEvidence is false, willPseudonymize: none because rows carry vaultId, not the did, blockers: none} and step sign (withdraw every granted consent with source deletion and sign the federation withdrawals) which runs before the F07.S01.M01 destroy_keys step; RetentionPurgePort kind privacy.consent, class RET-EVIDENCE, anchorField withdrawnAt. Every field is classified with F10.S02.M02.

### Example

```
vault command privacy.consent.grant
{ "purpose": "federation_publish", "scope": { "relayId": "relay.example.org" }, "policyId": "privacy.federation.v3",
  "policyVersion": 3, "policyHash": "9c1185a5c5e9fc54612808977ee8f548b2258d31…", "locale": "en" }
=> { "consentId": "0192f3b0-…", "revision": 1, "status": "granted", "statementCid": "sha256-e01c…", "peerSync": "prepared" }
relay command privacy.consent.relay_register { "statement": <sealed classrup.privacy.consent_statement/v1> }
=> { "cid": "sha256-e01c…", "status": "registered", "relayReceivedAt": "2026-11-04T10:00:02.120Z", "relayAckSig": "…" }   vault peerSync -> peer_accepted
query privacy.consent.check { "purpose": "federation_publish", "relayId": "relay.example.org" } => { "granted": true, "policyVersion": 3 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T07 | contract | PS-076-04.R01, PS-076-04.R02, PS-076-09.R02 | execute each command and query, including relay_register and relay_check on a relay double | outputs, statements and events validate against registry schemas; events are in the same transaction as the state change |
| TEST-PS-076-09.T08 | integration | PS-076-04.R03, PS-076-02.R03 | consumer without consent tries processing; error injected into check | processing blocked in both cases |
| TEST-PS-076-09.T09 | integration | PS-076-04.R03, PS-076-03.R01 | notify.channel.opted_out delivered with via unsubscribe_link, settings, expired, account_deletion, privacy_withdrawal and relay_policy, for a matching and a non-matching relay | withdrawn only for unsubscribe_link (source unsubscribe) and settings (source ui) on the matching purpose and relay; every other case ignored; an already withdrawn consent and a replay are no-ops |
| TEST-PS-076-09.T19 | abuse | PS-076-02.R05, PS-076-04.R04 | relay_register with a replayed grant after its withdrawal, a grant addressed to another relay, a statement signed by a revoked key, a withdrawal naming another author's grant, an extra payload field, and a withdrawal that arrives before its grant | each refused with PRIVACY_CONSENT_STATEMENT_INVALID and the late grant refused; a valid statement is registered and its relay-signed acknowledgement moves the vault to peer_accepted |
| TEST-PS-076-09.T20 | integration | PS-076-04.R04, PS-076-01.R01 | cross-module contract with F13.S02.M03 and F06.S02.M02 doubles: grant notify_email for relay A, F13 opt-in, F13 channel expiry after 365 days; grant location_precise | the channel consent carries consentId and purpose; no F10 statement is sent for notify_*; channel expiry leaves the F10 consent granted; the location_precise grant shares nothing until an explicit per-share action |
| TEST-PS-076-09.T21 | integration | PS-076-04.R05 | deletion DeletionPort plan and execute, retention purge port and export section with stub registries; cancel during grace | plan lists consent rows; cancel leaves every consent unchanged and queues no relay statement; execute withdraws all with source deletion and signs the federation withdrawals before the destroy_keys step; purge removes rows 2 years after withdrawal; section privacy.consents exported |

## Dependencies

Module depends on: F07.S01.M01, F11.S01.M01, F15.S01.M01, F16.S02.M02, F12.S03.M03, F10.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
