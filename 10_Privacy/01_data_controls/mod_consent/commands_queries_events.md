# PS-076-04 — Commands, queries and events: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-04.R01** Grant and withdraw are vault commands; for relay-scoped purposes they also produce the signed statements classrup.privacy.consent/v1 and classrup.privacy.consent_withdrawal/v1; check and list are vault queries; there is no relay command in this module.
- **PS-076-04.R02** Grant and withdraw emit events into the vault outbox in the same IndexedDB transaction as the state change.
- **PS-076-04.R03** Other modules must call privacy.consent.check before processing for a purpose and treat any failure as not granted.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `privacy.consent.grant` | privacy.consent.grant | [vault command, produces signed statement classrup.privacy.consent/v1 when scope.relayId is set] { purpose, scope?: {relayId?, recordKinds?}, policyId, policyVersion, policyHash, locale } | { consentId, revision: 1, status: granted, statementCid?, peerSync? } | VALIDATION_FAILED, PRIVACY_POLICY_STALE, FEATURE_DISABLED, RATE_LIMITED | privacy.consent.granted | yes (Idempotency-Key) |
| `privacy.consent.withdraw` | privacy.consent.withdraw | [vault command, produces signed statement classrup.privacy.consent_withdrawal/v1 when relay-scoped] { consentId, expectedRevision } | { consentId, revision, status: withdrawn, statementCid?, peerSync? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RATE_LIMITED | privacy.consent.withdrawn | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `privacy.consent.check` | privacy.consent.check | { purpose, relayId?, recordKind? } | { granted: boolean, consentId?, policyVersion?, reason?: none\|withdrawn\|lapsed\|scope } |  |
| `privacy.consent.list_mine` | privacy.consent.read | { purpose?, status?, cursor?, limit ≤ 100 } | { items: PrivacyConsent[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `privacy.consent.granted` | P3 | { consentId, purpose, scope, policyId, policyVersion } |
| `privacy.consent.withdrawn` | P3 | { consentId, purpose, scope, reason: user\|unsubscribe\|account_deletion\|policy_changed } |

### Events consumed

| Type | Effect |
|---|---|
| `notify.channel.opted_out` | withdraw the granted consent for the matching notify purpose with source unsubscribe |
| `privacy.deletion.requested` | withdraw all granted consents with source deletion; cancelling the deletion does not restore them |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PRIVACY_POLICY_STALE | 409 | no | the policy hash does not match the current policy text; reload and read the new text |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command privacy.consent.grant
{ "purpose": "federation_publish", "scope": { "relayId": "relay.example.org" }, "policyId": "privacy.federation.v3",
  "policyVersion": 3, "policyHash": "9c1185a5c5e9fc54612808977ee8f548b2258d31…", "locale": "en" }
=> { "consentId": "0192f3b0-…", "revision": 1, "status": "granted", "statementCid": "sha256-e01c…", "peerSync": "prepared" }
query privacy.consent.check { "purpose": "federation_publish", "relayId": "relay.example.org" } => { "granted": true, "policyVersion": 3 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T07 | contract | PS-076-04.R01, PS-076-04.R02, PS-076-09.R02 | execute each command and query | outputs, statements and events validate against registry schemas |
| TEST-PS-076-09.T08 | integration | PS-076-04.R03, PS-076-02.R03 | consumer without consent tries processing; error injected into check | processing blocked in both cases |
| TEST-PS-076-09.T09 | integration | PS-076-04.R03, PS-076-03.R01 | notify.channel.opted_out and privacy.deletion.requested delivered | matching consents withdrawn with the right source; replay is a no-op |

## Dependencies

Module depends on: F07.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
