# PS-114-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_cache. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-114-07.R01 | Never cache responses of classes PRIVATE_PERSONAL, FINANCIAL_EVIDENCE, SECRET or LOCATION_PRECISE. | MVP |
| PS-114-07.R02 | Region cache holds the coarse cell only (LOCATION_COARSE), with max-age 1 h (D05 PROVISIONAL). | MVP |
| PS-114-07.R03 | Purge on logout, account switch and session revoke (PS-114-03). | MVP |
| PS-114-07.R04 | Shared device: no cached data survives "clear data" (mod_install). | MVP |
| PS-114-07.R05 | Query strings are dropped from keys unless allowlisted; identifiers in paths are normalized to route templates in telemetry. | MVP |

## Data / schema
| Field | Class | Retention |
|---|---|---|
| PUBLIC entries | PUBLIC | until expiry (max 5 min) or eviction |
| REGION_COARSE entries | LOCATION_COARSE | until expiry (max 1 h) |
| shell assets | PUBLIC | active build lifetime |

## Commands / queries / events
None.

## States & transitions
Account deletion purges on next client start.

## Validation & errors
Not applicable.

## Authorization
See authorization_capabilities.

## Failure, idempotency, concurrency, offline
Purge idempotent.

## Privacy, retention, abuse
- Shared-device risk: cached public listings reveal browsing only if device is shared; purge rules limit exposure.
- Abuse: cache used to store pages for offline phishing; mitigated by same-origin and hash manifest.
- Privacy: no telemetry with URLs; route templates only.

## Observability & budgets
Route-template counters only.

## Tests
- TEST-PS-114-07-01 (integration): response with PRIVATE_PERSONAL class header is not cached.
- TEST-PS-114-07-02 (integration): region entry expires at 1 h.
- TEST-PS-114-07-03 (integration): "clear data" leaves no entries.
- TEST-PS-114-07-04 (unit): query string with `user=` is stripped from key.

## Acceptance criteria
1. Class-based caching rules verified.
2. Clear-data verified.
3. Privacy Lead review pending.

## Assumptions & open decisions
- ASSUMPTION: route allowlist defines cacheable classes.
- D05 PROVISIONAL (D05 default, unapproved).
- D07 PROVISIONAL (D07 default, unapproved).
