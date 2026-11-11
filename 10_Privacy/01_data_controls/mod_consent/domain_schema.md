# PS-076-01 — Domain schema: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-01.R01** A PrivacyConsent stores purpose, scope (relay and record kinds), policy id, version and SHA-256 hash, locale of the text shown, grant and withdrawal times, status and source.
- **PS-076-01.R02** The history is append-only; a new grant creates a new row and supersedes the previous one rather than editing it.
- **PS-076-01.R03** Consents are P3 in the vault and retained as RET-EVIDENCE (2 years after withdrawal) as proof of what was agreed; the statement sent to a relay contains only purpose, scope, policy hash and times.

## Specification

### PrivacyConsent

Schema `classrup.privacy.consent/v1` · storage **device** · privacy **P3** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| purpose | enum — federation_publish \| notify_email \| notify_push \| analytics_share \| location_precise |
| scope | object — {relayId?: string, recordKinds?: string[] up to 20}; relayId required for federation_publish and notify_push |
| policyId | string — e.g. privacy.federation.v3 |
| policyVersion | int — ≥ 1 |
| policyHash | string — sha256 hex of the canonical policy text shown |
| locale | string — BCP 47 locale of the text shown |
| status | enum — granted \| withdrawn \| superseded \| lapsed |
| source | enum — ui \| unsubscribe \| deletion \| import |
| grantedAt | timestamp — RFC 3339 UTC, local clock |
| withdrawnAt? | timestamp — RFC 3339 UTC, local clock |
| statementCid? | string — cid of the signed consent statement sent to the relay |
| peerSync? | string — local_committed \| prepared \| transport_acknowledged \| peer_accepted |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one row with status granted per (purpose, scope.relayId).
- No purpose is granted by default; absence of a row means not granted.
- policyHash equals the hash of the bundled policy text of policyId at policyVersion when the row is created.

### Storage DDL

```sql
CREATE TABLE privacy_consent (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, purpose TEXT NOT NULL, relay_id TEXT, status TEXT NOT NULL,
  policy_hash TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX privacy_consent_active ON privacy_consent(vault_id, purpose, ifnull(relay_id,'')) WHERE status = 'granted';
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T01 | unit | PS-076-01.R01, PS-076-01.R03, PS-076-02.R01 | grant federation_publish for a relay with the current hash | row stored granted, statement signed with policy hash |
| TEST-PS-076-09.T02 | unit | PS-076-01.R02, PS-076-03.R01 | grant, regrant with new version, withdraw | history keeps three rows with statuses superseded, then withdrawn; none edited |
| TEST-PS-076-09.T14 | a11y | PS-076-07.R02, PS-076-01.R03 | privacy settings and grant sheet | axe zero serious issues; keyboard-only completion; switches announced |

## Dependencies

Module depends on: F07.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
