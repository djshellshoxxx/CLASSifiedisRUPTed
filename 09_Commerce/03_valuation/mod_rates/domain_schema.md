# PS-075-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_rates (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (quote object; R04), CTR-ID-001 (`qte`), CTR-SCH-001, CTR-PRV-001 (PUBLIC). **Pending:** `rsrc` source prefix (CTR-ID-001). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-075-01.R01 | Quote fields exactly as CTR-COM-001 quote object: `quote_id`, `base`, `quote`, `rate`, `rate_scale`, `rounding` (const `HALF_EVEN`), `source_id`, `observed_at`, `valid_until`, `quote_hash`. | MVP |
| PS-075-01.R02 | `valid_until` − `observed_at` ≤ PT15M (ASSUMPTION). | MVP |
| PS-075-01.R03 | `quote_hash` = SHA-256 of JCS(quote without `quote_hash`). | MVP |
| PS-075-01.R04 | Source record: `source_id`, `adapter_pubkey`, `pairs[]`, `status`, `license_ref`. | MVP |
| PS-075-01.R05 | Quotes are immutable once issued. | MVP |

## Data / schema
| Field | Type / constraint | Class |
|---|---|---|
| `quote_id` | `qte_` + 26 Crockford chars | PUBLIC |
| `base`, `quote` | currency objects (CTR-COM-001 `$defs/currency`) | PUBLIC |
| `rate` | decimal string per CTR-COM-001 pattern | PUBLIC |
| `rate_scale` | integer 0–18 | PUBLIC |
| `source_id` | `^[a-z0-9_.-]{3,64}$` | PUBLIC |
| `observed_at`, `valid_until` | RFC 3339 UTC | PUBLIC |
| `quote_hash` | 64 hex | PUBLIC |
| `source.status` | enum `active`, `stale`, `disabled` | PUBLIC |

## Commands / queries / events
PS-075-04.

## States & transitions
Quote: `issued` → `expired`. Source: PS-075-03.

## Validation & errors
PS-075-02.

## Authorization
Quotes are public; source records are operator-managed.

## Failure, idempotency, concurrency, offline
Quote issuance idempotent by (`source_id`, pair, `observed_at`).

## Privacy, retention, abuse
Quotes contain no party data; a quote is linked to a claim or proposal by ID only.

## Observability & budgets
Gauge: active sources per pair.

## Tests
- TEST-PS-075-01-01 (unit): `valid_until` 15 min 1 s after `observed_at` rejected.
- TEST-PS-075-01-02 (golden): quote hash matches reference JCS vector.
- TEST-PS-075-01-03 (unit): mutation after issue rejected.

## Acceptance criteria
1. Quote schema equals CTR-COM-001 quote object.
2. Hash golden vectors pass.
3. Immutability enforced.

## Assumptions & open decisions
- ASSUMPTION: 15-minute maximum validity.
- D03 (PROVISIONAL default, unapproved).
