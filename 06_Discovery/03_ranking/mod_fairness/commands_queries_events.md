# PS-050-04 — Commands, queries and events: Ranking fairness

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M02 Ranking fairness](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/fairness` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-050-04.R01** The module exposes functions only and defines no commands, queries or events.
- **PS-050-04.R02** Callers apply capability checks and pagination, call rerank exactly once per page of a snapshot window, and store the returned carry in their cursor.
- **PS-050-04.R03** Typed errors returned by rerank are mapped by callers to HTTP problems.
- **PS-050-04.R04** auditPage(page, constants) is a pure check that a vault runs on each relay page and that returns which fairness rule the page breaks, without reordering it.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FAIRNESS_PROMOTION_NOT_ALLOWED | 422 | no | a promoted flag was supplied while pageParams.promotionEnabled is false; no page is produced |
| FAIRNESS_INPUT_UNSORTED | 422 | no | candidates are not sorted by descending score with the documented tie-break |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module - no commands or queries. Exports rerank and auditPage; the vault query modules call auditPage on every relay page.

### Example

```
rerank(candidates[200], { pageSize: 20, windowStart: 0, position: 0, carry: empty bitmap, promotionEnabled: true })
-> items[20]: at most 3 per author, at most 4 promoted (each flagged promoted: true), 2 reserved new-author slots at positions 5 and 12 when qualifying
-> items[0].explain = [{ key: "discovery.explain.text_match", params: { field: "title" } }, { key: "discovery.explain.distance_bucket", params: { bucket: "5_10" } }]
-> at position 180: nextWindowStart 200, carry = bitmap with positions 7 and 13 of window 0 set (author-capped results carried forward)
auditPage(relayPage[20]) -> { followed: false, violations: ["max_per_author"] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-050-09.T06 | unit | PS-050-01.R01, PS-050-04.R01 | page with a single author and page size 7 | cap relaxed with only_seller explanation; promoted cap 1 and new-author slots 1 |
| TEST-PS-050-09.T07 | unit | PS-050-04.R01, PS-050-04.R02, PS-050-04.R03 | inspect exports and map each rerank error through a caller harness | no commands, queries or events; only rerank and auditPage exported; typed errors map to the documented HTTP problems |
| TEST-PS-050-09.T16 | unit | PS-050-04.R04 | auditPage on relay pages with 4 results of one author, 5 promoted of 20, an unlabelled promoted item, and a compliant page | violations max_per_author, promoted_share, promoted_unlabelled, and followed true for the compliant page |

## Dependencies

Module depends on: F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
