# PS-144-01 — Domain schema: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-01.R01** A Category has a stable uuidv7 id, a key unique per publisher, a parent, a depth between 1 and 4, localized names and a status; ids are never reused.
- **PS-144-01.R02** Categories are P0 public configuration; a vault stores a verified mirror with provenance and only the publisher vault may change the origin copy.
- **PS-144-01.R03** A restricted flag marks categories that need extra notices or review under a jurisdiction profile; it does not itself prohibit anything.

## Specification

### Category

Schema `classrup.governance.category/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — stable primary key, never reused |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| publisherId | did:key — key that signed the pack in which the category was defined |
| key | string — [a-z0-9_]{2,40}, unique per publisher |
| parentId? | uuidv7 — ref Category; absent for depth 1 |
| depth | int — 1..4 |
| names | object — locale (BCP 47) to name, 1..30 locales, each name 1..60 code points, en required |
| restricted | boolean — default false |
| restrictedReasonKey? | string — i18n message key, required when restricted |
| status | enum — active \| deprecated \| retired |
| mergedInto? | uuidv7 — ref Category, required when status retired |
| sortOrder | int — 0..999 among siblings |
| packVersion | int — pack version in which this record last changed |
| provenance | object — {originRelay?, receivedAt, verifiedAt, packCid} |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- depth = parent depth + 1 and never exceeds 4; the parent chain has no cycles.
- At most 50 non-retired children per parent and at most 2 000 categories per pack.
- status retired implies mergedInto is set to a non-retired category in the same pack; restricted implies restrictedReasonKey is set.

### Storage DDL

```sql
CREATE TABLE governance_category (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, publisher_id TEXT NOT NULL, key TEXT NOT NULL, parent_id TEXT,
  depth INTEGER NOT NULL, status TEXT NOT NULL, pack_version INTEGER NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX governance_category_key ON governance_category(tenant_id, publisher_id, key);
CREATE INDEX governance_category_parent ON governance_category(tenant_id, parent_id, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T01 | unit | PS-144-01.R01, PS-144-01.R02, PS-144-02.R01, PS-144-02.R02 | create category with names and key | stable id, key unique for publisher, en name required |
| TEST-PS-144-09.T03 | property | PS-144-01.R03, PS-144-02.R02 | random trees and moves | depth <= 4, no cycles, child limit holds, restricted implies reason key |
| TEST-PS-144-09.T15 | a11y | PS-144-01.R03 | axe run on picker and settings | zero serious or critical issues; keyboard tree navigation and Move to flow work |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
