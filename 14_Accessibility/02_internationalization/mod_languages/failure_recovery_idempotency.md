# PS-113-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_languages. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-113-06.R01 | If a catalog fails to load or parse, the bundled `en` catalog is used and an error is logged with key names only. | MVP |
| PS-113-06.R02 | A missing key in the active locale renders the `en` value; the UI never shows raw keys to users. | MVP |
| PS-113-06.R03 | Language change offline is queued per D08 PROVISIONAL and applied locally at once. | MVP |
| PS-113-06.R04 | Catalog version mismatch triggers at most one reload per session. | MVP |

## Data / schema
No server records. Local key: `lang.pending` (queued change), cleared on acknowledgement.

## Commands / queries / events
Event consumer is idempotent by `(aggregate_id, revision)` (CTR-EVT-001).

## States & transitions
See workflow_state_machine.

## Validation & errors
`LANG.CATALOG_VERSION_MISMATCH` triggers reload guard (R04).

## Authorization
Not applicable.

## Failure, idempotency, concurrency, offline
- Two devices change language: last committed revision wins; each device re-renders on sync.
- Storage blocked (private mode): language applies for session only.

## Privacy, retention, abuse
Pending language value is PSEUDONYMOUS and cleared on logout.

## Observability & budgets
Counter `lang_fallback_total{locale,reason}`; catalog load p95 ≤ 200 ms.

## Tests
- TEST-PS-113-06-01 (integration): corrupt `de` catalog falls back to `en` with logged key names only.
- TEST-PS-113-06-02 (offline): language change offline applied locally, sent on reconnect.
- TEST-PS-113-06-03 (chaos): catalog 404 falls back without crash.
- TEST-PS-113-06-04 (integration): mismatch reload happens once.

## Acceptance criteria
1. No raw key visible in UI test snapshots.
2. Fallback verified in fault injection.
3. Reload loop guard verified.

## Assumptions & open decisions
- D08 PROVISIONAL (D08 default, unapproved).
