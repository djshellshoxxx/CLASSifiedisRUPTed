# PS-036-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_anti. **Parent:** [mod_anti SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (`auc`, `bid`), CTR-PRV-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-036-01.R01 | The extension state is embedded in the auction (`auc_`); no standalone entity ID. | MVP |
| PS-036-01.R02 | Fields: `base_end_utc`, `effective_end_utc`, `extension_count` (0–10), `policy_id` (pinned at auction creation), `policy_version` (SemVer), `last_evaluated_sequence`, `schema_version`. | MVP |
| PS-036-01.R03 | Policy record (`anti_policy`, immutable once published): `policy_id`, `policy_version`, `window_seconds` (default 120), `extension_seconds` (default 120), `max_extensions` (default 10), `applies_when` (`bid_accepted`). | MVP |
| PS-036-01.R04 | Extension log (append-only): `auc_id`, `extension_index`, `bid_id`, `bid_sequence`, `server_accepted_at_utc`, `previous_end_utc`, `new_end_utc`, `policy_version`. | MVP |
| PS-036-01.R05 | Canonical owner of extension schedule and log: F04.S02.M01 (this module). Bid records: F04.S01.M02. Auction records: F04. | MVP |

## Data / schema
```json
{"auc_id": "auc_01HZ...", "base_end_utc": "2026-12-10T18:00:00Z", "effective_end_utc": "2026-12-10T18:04:00Z",
 "extension_count": 2, "policy_id": "anti_default", "policy_version": "1.0.0",
 "last_evaluated_sequence": 57, "schema_version": "1.0.0"}
```
- Data classes: all fields PUBLIC (end times are visible to bidders). `bid_id` in the log is PUBLIC; no account identifier appears.
- Extension log rows are never updated or deleted before the auction's retention end.

## Commands / queries / events
Covered in PS-036-04. Schema ID: `auction.schedule` (1.0.0).

## States & transitions
Covered in PS-036-03.

## Validation & errors
Covered in PS-036-02.

## Authorization
Covered in PS-036-05.

## Failure, idempotency, concurrency, offline
Covered in PS-036-06.

## Privacy, retention, abuse
Covered in PS-036-07.

## Observability & budgets
Evaluation lag p95 ≤ 1 s after bid acceptance (PS-036-08).

## Tests
- TEST-PS-036-01-01 (unit): policy defaults (120 s, 120 s, 10) load and are immutable after publish.
- TEST-PS-036-01-02 (lint): no field in schedule or log contains `acc_`.
- TEST-PS-036-01-03 (lint): every field has one CTR-PRV-001 class (PUBLIC).

## Acceptance criteria
1. Policy records are immutable (write-once integration test).
2. Extension log is complete: every extension has one row.
3. `auction.schedule` schema registered in CTR-SCH-001.

## Assumptions & open decisions
- ASSUMPTION: defaults 120 s window, 120 s extension, 10 extensions.
- Slug rename pending per review B-07 (proposed `mod_auction_anti_sniping`); path unchanged until registry update.
- See [DECISIONS.md](../../../DECISIONS.md) D03 (valuation not used here; included for bid amounts only) and D07 (retention).
