# PS-112-06 — failure, recovery, idempotency and offline
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_currencies. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-112-06.R01 | Formatting works offline from the bundled catalog for 100% of bundled codes. | MVP |
| PS-112-06.R02 | Catalog fetch failure keeps the last known good version; no formatting failure is shown. | MVP |
| PS-112-06.R03 | A publish retry with the same digest never creates a second version. | MVP |

## Data / schema
Bundled catalog includes `catalog_version` and `digest`.

## Commands / queries / events
Retries reuse the key ([PS-112-04](commands_queries_events.md)).

## States & transitions
Per [PS-112-03](workflow_state_machine.md).

## Validation & errors
`CUR.CATALOG_VERSION_STALE` triggers refresh only.

## Authorization
Not applicable offline.

## Failure, idempotency, concurrency, offline
| Scenario | Behavior |
|---|---|
| Catalog fetch fails | Use last known good version |
| Digest mismatch on fetch | Reject download; keep current; log code |
| Two publishers race | Second publish fails digest check; must refetch draft |

## Privacy, retention, abuse
Not applicable.

## Observability & budgets
Count of fallback uses.

## Tests
- TEST-PS-112-06-01 offline: all bundled codes format with network off.
- TEST-PS-112-06-02 fault: digest mismatch refused.

## Acceptance criteria
1. Zero formatting failures offline in test.
2. Digest mismatch never activates a catalog.

## Assumptions & open decisions
- ASSUMPTION: bundled catalog ships with each release.
- No Dxx decision directly affects this process.
