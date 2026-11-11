# PS-044-04 — Commands, queries and events: Search filters

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M03 Search filters](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/filter` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-044-04.R01** The module exposes functions only; it has no commands, queries or events.
- **PS-044-04.R02** Callers (F06.S01.M02, relay query handler) are responsible for capability checks and idempotency.
- **PS-044-04.R03** Error codes defined here are returned inside Result values and mapped by callers to HTTP problems.

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
| DISCOVERY_FILTER_INVALID | 422 | no | a filter value is out of range, of the wrong type or unknown |
| DISCOVERY_FILTER_CURRENCY_REQUIRED | 422 | no | price filter without a currency |
| DISCOVERY_FILTER_CENTER_REQUIRED | 422 | no | distance filter without a search center |
| DISCOVERY_RADIUS_TOO_SMALL | 422 | no | radius below 5 km or not an allowed value |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module - no commands or queries; callers expose them.

### Example

```
compileFilter({ listingKinds: ["sell"], price: { currency: "EUR", max: 30000 }, distanceKm: 10, postedWithin: "7d" }, now)
-> { sql: "d.listing_kind IN (?) AND d.currency = ? AND d.price_minor <= ? AND d.geo_cell5 IN (?,?,?) AND d.first_seen_at >= ?",
     params: ["sell", "EUR", 30000, "u4pru", "u4prv", "u4prs", "2026-10-28T10:00:00.000Z"] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-044-09.T08 | unit | PS-044-04.R01, PS-044-04.R02, PS-044-04.R03 | inspect module exports and error mapping | no commands, queries or events exist and errors map to documented codes |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001, CTR-MNY-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
