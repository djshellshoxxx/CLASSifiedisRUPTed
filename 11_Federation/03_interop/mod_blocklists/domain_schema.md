# PS-089-01 — Domain schema: Federation blocklists

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M02 Federation blocklists](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/blocklists` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-089-01.R01** A BlockRule stores type, value, action, reason, source, optional publisher list reference, optional expiry and status with tenant and revision per CTR-ID-001.
- **PS-089-01.R02** Local block lists are private to the vault owner or relay operator and are classed P3 because a person's block list is sensitive.
- **PS-089-01.R03** Values are exact matches only (relay id, did:key, cid, SHA-256 content hash), with no patterns or regular expressions.

## Specification

### BlockRule

Schema `classrup.federation.block_rule/v1` · storage **relay+device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope (vault id in the browser vault) |
| ruleType | enum — peer \| author \| cid \| content_hash |
| value | string — relay id, did:key, cid or sha256-base64url; ≤ 200 chars; exact match |
| action | enum — reject \| hide |
| reason | enum — spam \| scam \| harassment \| illegal \| malware \| other |
| note? | string — ≤ 280 code points, plain text |
| source | enum — local \| imported |
| listCid? | string — cid of the imported blocklist statement |
| publisher? | string — did:key that signed the imported list |
| status | enum — pending_review \| active \| disabled \| expired \| removed |
| expiresAt? | timestamp — default none for local, createdAt + 180 days for imported |
| createdBy | string — local principal or relay operator id |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one non-removed rule per (tenantId, ruleType, value).
- source imported never starts in status active; it starts pending_review.
- A rule of type peer never targets the local relay id.
- Total non-removed rules per tenant ≤ 100000.

### Storage DDL

```sql
CREATE TABLE fed_block_rule (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, rule_type TEXT NOT NULL, value TEXT NOT NULL, action TEXT NOT NULL,
  status TEXT NOT NULL, expires_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_block_rule_value ON fed_block_rule(tenant_id, rule_type, value) WHERE status <> 'removed';
CREATE INDEX fed_block_rule_active ON fed_block_rule(tenant_id, status, rule_type);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-089-09.T01 | unit | PS-089-01.R01, PS-089-01.R03, PS-089-02.R01 | add one rule of each type with valid values | rules active with exact-match values and event emitted |
| TEST-PS-089-09.T02 | unit | PS-089-02.R02, PS-089-02.R03, PS-089-01.R02 | each rule V01–V07 violated | documented code and no rule changed |

## Dependencies

Module depends on: F11.S01.M03, F07.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [module SPEC](SPEC.md).
