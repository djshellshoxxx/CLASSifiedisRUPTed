# PS-076-01 — Domain schema: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-01.R01** A PrivacyConsent stores purpose, scope (relay, verifier endpoint and record kinds), policy id, version and SHA-256 hash, locale of the text shown, grant and withdrawal times, status and source; federation_publish, notify_email and notify_push are scoped to exactly one relay named by its canonical self-certifying relayId (F15.S02.M01, 'relay:' plus 26 lowercase base32 characters of the genesis key hash, never a hostname), and chain_lookup is scoped to exactly one HTTPS verifier endpoint origin.
- **PS-076-01.R02** The history is append-only; a new grant creates a new row and supersedes the previous one rather than editing it.
- **PS-076-01.R03** Consents are P3 in the vault and retained as RET-EVIDENCE (2 years after withdrawal) as proof of what was agreed; the vault entity schema classrup.privacy.consent/v1 never leaves the vault except in the user's own export.
- **PS-076-01.R04** The relay-facing statements have their own schemas with explicit field allowlists, registered with signer role in the F11.S01.M01 statement registry (N2): classrup.privacy.consent_statement/v1 with payload exactly {consentId, purpose, relayId, recordKinds, policyId, policyVersion, policyHash, grantedAt} and classrup.privacy.consent_withdrawal/v1 with payload exactly {consentId, targetCid, purpose, relayId, withdrawnAt, reason}; the did appears only as the envelope author, with per-author seq and prev (CTR-FED-001).

## Specification

### PrivacyConsent

Schema `classrup.privacy.consent/v1` · storage **device** · privacy **P3** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| purpose | enum — federation_publish \| notify_email \| notify_push \| analytics_share \| location_precise \| chain_lookup |
| scope | object — {relayId?: string, endpoint?: string, recordKinds?: string[] up to 20}; relayId is the canonical relayId of F15.S02.M01 and required for federation_publish, notify_email and notify_push; endpoint is an HTTPS origin (scheme, host, optional port; no path, query or credentials) and required for chain_lookup |
| policyId | string — e.g. privacy.federation.v3 |
| policyVersion | int — ≥ 1 |
| policyHash | string — sha256 hex of the canonical policy text shown |
| locale | string — BCP 47 locale of the text shown |
| status | enum — granted \| withdrawn \| superseded \| lapsed |
| source | enum — ui \| unsubscribe \| deletion \| import |
| grantedAt | timestamp — RFC 3339 UTC, local clock |
| withdrawnAt? | timestamp — RFC 3339 UTC, local clock |
| statementCid? | string — cid of the signed classrup.privacy.consent_statement/v1; federation_publish only |
| withdrawalCid? | string — cid of the signed classrup.privacy.consent_withdrawal/v1 whose targetCid is statementCid |
| peerSync? | string — local_committed \| prepared \| transport_acknowledged \| peer_accepted |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one row with status granted per (purpose, scope key), where the scope key is scope.relayId for relay-scoped purposes, scope.endpoint for chain_lookup and empty otherwise.
- No purpose is granted by default; absence of a row means not granted.
- policyHash equals the hash of the bundled policy text of policyId at policyVersion when the row is created.
- statementCid and withdrawalCid are set only for federation_publish; notify_email and notify_push are linked from F13.S02.M03 ChannelConsent by consent ID, and analytics_share, location_precise and chain_lookup produce no statement.
- scope.relayId, when present, matches the canonical relayId pattern of F15.S02.M01; a hostname is never stored as a relayId.

### Storage DDL

```sql
CREATE TABLE privacy_consent (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, purpose TEXT NOT NULL, scope_key TEXT, status TEXT NOT NULL,
  policy_hash TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
-- scope_key: canonical relayId (federation_publish, notify_email, notify_push), endpoint origin (chain_lookup) or NULL
CREATE UNIQUE INDEX privacy_consent_active ON privacy_consent(vault_id, purpose, ifnull(scope_key,'')) WHERE status = 'granted';
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T01 | unit | PS-076-01.R01, PS-076-02.R01 | grant federation_publish, notify_email and notify_push for a canonical relayId and chain_lookup for an endpoint origin with the current hash; grant notify_email without relayId; grant notify_push with relayId relay.example.org | rows stored granted with scope.relayId or scope.endpoint; the federation grant has a signed statement; missing relayId and the hostname both return VALIDATION_FAILED |
| TEST-PS-076-09.T02 | unit | PS-076-01.R02, PS-076-03.R01 | grant, regrant with new version, withdraw | history keeps three rows with statuses superseded, then withdrawn; none edited |
| TEST-PS-076-09.T17 | contract | PS-076-01.R03, PS-076-01.R04, PS-076-07.R01 | capture every byte leaving the vault through network and relay doubles during grant, withdraw, lapse, deletion step and export | the only consent data leaving the vault are consent_statement and consent_withdrawal envelopes whose payload has exactly the allowlisted fields with the did only as envelope author, plus the user's export; no PrivacyConsent row leaves the vault |
| TEST-PS-076-09.T20 | integration | PS-076-04.R04, PS-076-01.R01 | cross-module contract with F13.S02.M03 and F06.S02.M02 doubles: grant notify_email for relay A, F13 opt-in, F13 channel expiry after 365 days; grant location_precise | the channel consent carries consentId and purpose; no F10 statement is sent for notify_*; channel expiry leaves the F10 consent granted; the location_precise grant shares nothing until an explicit per-share action |
| TEST-PS-076-09.T23 | integration | PS-076-01.R01, PS-076-04.R04 | notify.channel.opted_out with via unsubscribe_link for the canonical relayId of the granted notify_email consent and for a hostname of the same relay | the canonical relayId withdraws the consent; the hostname matches nothing and the consent stays granted |

## Dependencies

Module depends on: F07.S01.M01, F11.S01.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
