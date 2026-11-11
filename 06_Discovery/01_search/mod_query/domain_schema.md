# PS-046-01 — Domain schema: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-01.R01** A SavedSearch stores a normalized query, typed filters, an optional area (L1 or L2 cell and radius), alert mode, an alert watermark and match bookkeeping, and is a P3 vault-local record that is never part of any statement.
- **PS-046-01.R02** A vault keeps at most 25 saved searches; each stores at most 200 matched document ids for dedupe, trimmed oldest first, as an optimisation only, because alert uniqueness comes from the watermark rule.
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
| filters | object — typed filters validated by F06.S01.M03, stored in canonical form |
| centerCell? | string — geohash of 4 (L1) or 5 (L2) characters, the user's chosen search center |
| radiusKm? | int — one of 5, 10, 25, 50, 100; minimum 5 |
| alertMode | enum — off \| instant \| daily |
| status | enum — active \| paused \| deleted |
| watermarkAt | timestamp — createdAt, or the last resume or import time; only documents with firstSeenAt later than it can alert |
| matchedDocIds | array — at most 200 document ids already alerted (optimisation only) |
| lastEvaluatedAt? | timestamp — local clock, advanced after each evaluation batch |
| lastMatchedAt? | timestamp — local clock of last alert |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- centerCell has length 4 or 5 and passes F06.S02.M01 assertPublicCell, and radiusKm is at least 5 when present.
- A vault never holds more than 25 non-deleted saved searches.
- Saved search content (text, filters, ids) is never written into an outbox statement, relay request or log; a pull request carries only L1 cells.
- An alert is raised for a (savedSearchId, documentId) pair only when the document's firstSeenAt is later than watermarkAt.

### Storage DDL

```sql
CREATE TABLE discovery_saved_search (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, owner_did TEXT NOT NULL, status TEXT NOT NULL,
  alert_mode TEXT NOT NULL, watermark_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX discovery_saved_search_active ON discovery_saved_search(tenant_id, status, alert_mode);
CREATE TABLE discovery_saved_search_match (saved_search_id TEXT NOT NULL, document_id TEXT NOT NULL,
  matched_at TEXT NOT NULL, PRIMARY KEY (saved_search_id, document_id));
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T01 | unit | PS-046-01.R01, PS-046-02.R01 | create saved search with valid input | record stored with status active, revision 1, matchedDocIds empty, watermarkAt equal to createdAt |
| TEST-PS-046-09.T03 | unit | PS-046-01.R02, PS-046-02.R02 | limits: 201-char query, 13 terms, 26th saved search, limit 51, page depth 501 | DISCOVERY_QUERY_INVALID, DISCOVERY_QUERY_INVALID, DISCOVERY_SAVED_SEARCH_LIMIT, VALIDATION_FAILED, VALIDATION_FAILED |
| TEST-PS-046-09.T18 | integration | PS-046-01.R03 | run a query, then advance the clock 15 minutes and run the sweep | snapshot store is empty and the old cursor returns EXPIRED |

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M01, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M02, F11.S01.M03, F12.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
