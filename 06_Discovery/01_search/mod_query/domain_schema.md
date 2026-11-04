# PS-046-01 — Domain schema: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-01.R01** A SavedSearch stores a normalized query, typed filters, optional area (L2 cell and radius), alert mode and match bookkeeping, and is a P3 vault-local record that is never part of any statement.
- **PS-046-01.R02** A vault keeps at most 25 saved searches and each stores at most 200 matched document ids for dedupe, trimmed oldest first.
- **PS-046-01.R03** Query results are not persisted beyond a 15 minute snapshot used only for cursor consistency.

## Specification

### SavedSearch

Schema `classrup.discovery.saved_search/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| ownerDid | did — local principal |
| name | string — 1..60 code points |
| queryText? | string — 0..200 code points, normalized NFC, at most 12 terms |
| filters | object — typed filters validated by F06.S01.M03 |
| centerCell5? | string — geohash of exactly 5 characters (L2), the user's chosen search center |
| radiusKm? | int — one of 5, 10, 25, 50, 100; minimum 5 |
| alertMode | enum — off \| instant \| daily |
| status | enum — active \| paused \| deleted |
| matchedDocIds | array — at most 200 document ids already alerted |
| lastEvaluatedAt? | timestamp — local clock of last evaluation |
| lastMatchedAt? | timestamp — local clock of last alert |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- centerCell5 has length exactly 5 and radiusKm is at least 5 when present.
- A vault never holds more than 25 non-deleted saved searches.
- Saved search content is never written into an outbox statement, relay request or log.

### Storage DDL

```sql
CREATE TABLE discovery_saved_search (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, owner_did TEXT NOT NULL, status TEXT NOT NULL,
  alert_mode TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX discovery_saved_search_active ON discovery_saved_search(tenant_id, status, alert_mode);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T01 | unit | PS-046-01.R01, PS-046-02.R01 | create saved search with valid input | record stored with status active, revision 1, matchedDocIds empty |
| TEST-PS-046-09.T03 | unit | PS-046-01.R02, PS-046-02.R02 | limits: 201-char query, 13 terms, 26th saved search, limit 51 | DISCOVERY_QUERY_INVALID, DISCOVERY_SAVED_SEARCH_LIMIT or VALIDATION_FAILED respectively |
| TEST-PS-046-09.T12 | integration | PS-046-01.R03, PS-046-04.R02, PS-046-06.R02 | local and relay return the same listing | merged into one card with both provenance labels |

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
