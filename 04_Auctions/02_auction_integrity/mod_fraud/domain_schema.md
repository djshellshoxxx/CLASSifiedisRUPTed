# PS-037-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_fraud. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-PRV-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-037-01.R01 | Persist three records: `FraudSignal`, `FraudCase`, `RuleVersion`. Prefixes `afs_` and `afc_` are ASSUMPTION until registered in CTR-ID-001. | MVP |
| PS-037-01.R02 | `FraudSignal` references only canonical IDs (`auc_`, `bid_`, `acc_`, `evt_`). No name, email, IP, device identifier or coordinates in clear. | MVP |
| PS-037-01.R03 | `score` is an integer 0–100. A case opens when the maximum signal score on one auction is ≥ 70 (PROVISIONAL). | MVP |
| PS-037-01.R04 | Signals are append-only. Re-evaluation writes a new row with `supersedes` set; no row is updated in place. | MVP |
| PS-037-01.R05 | Cross-auction graph features (same account pairs across many auctions) are out of scope until a CTR-PRV-001 linkage review passes. | Future |

## Data / schema
```
FraudSignal {
  signal_id: "afs_<ulid>"            REQUIRED
  auction_id: "auc_..."              REQUIRED, FK 01_auction_lifecycle
  bid_ids: ["bid_..."]               REQUIRED, len 1..50
  account_ids: ["acc_..."]           REQUIRED, len 2..20, unique
  rule_id: enum[SELLER_LINK, CO_BID_CLUSTER, DEVICE_OVERLAP, NEW_ACCOUNT_BURST]
  rule_version: semver               REQUIRED
  score: int 0..100                  REQUIRED
  features: {name: number|bool}      len <= 16, aggregates only
  device_key_hash: bytes[32] | null  HMAC-SHA256, DEVICE_OVERLAP only
  source_event_id: "evt_..."         REQUIRED (provenance)
  supersedes: "afs_..." | null
  created_at: RFC3339 UTC, ms
  schema_version: int >= 1
}
FraudCase {
  case_id: "afc_<ulid>", auction_id, signal_ids[1..200], status (PS-037-03),
  score_max: int 0..100, assigned_mod: "mod_..." | null,
  decision_id: "dec_..." | null, version: int >= 1 (optimistic lock),
  opened_at, closed_at | null
}
```
Constraints: unique(auction_id, rule_id, rule_version, sha256(sorted bid_ids)) for dedupe; partial unique index on `auction_id` where status in (OPEN, UNDER_REVIEW, ESCALATED) (one open case per auction).

## Commands / queries / events
Defined in PS-037-04. Schema change follows CTR-SCH-001 (new optional field = MINOR).

## States & transitions
Status enum only; transitions in PS-037-03.

## Validation & errors
Referential and bounds checks in PS-037-02.

## Authorization
`device_key_hash` is write-only from the rule engine and never returned by any API (PS-037-05).

## Failure, idempotency, concurrency, offline
Writes are idempotent on the dedupe key. Unique-index conflict on case open returns `FRAUD.CASE_EXISTS` with the existing `case_id`. Server-side only; no offline writes.

## Privacy, retention, abuse
Classes: signals and `device_key_hash` PRIVATE_PERSONAL; case status PSEUDONYMOUS; aggregates PUBLIC only after k >= 5 (ASSUMPTION). Retention in PS-037-07.

## Observability & budgets
Alert when a single auction exceeds 150 signals (hard cap 200). Row write p95 <= 20 ms.

## Tests
- TEST-PS-037-01-01 (lint): every field has one CTR-PRV-001 class; `device_key_hash` absent from all response schemas.
- TEST-PS-037-01-02 (constraint): duplicate dedupe key rejected; second open case on one auction rejected by index.
- TEST-PS-037-01-03 (migration): schema_version bump follows CTR-SCH-001 compatibility rules.

## Acceptance criteria
1. Every field has type, bounds, class and provenance.
2. Dedupe and one-open-case rules enforced in the database, not only in application code.
3. No canonical contract is redefined; only referenced by ID.

## Assumptions & open decisions
- ASSUMPTION: `afs_` and `afc_` prefixes are registered in CTR-ID-001 before implementation.
- PROVISIONAL (D07 default, unapproved): retention per PS-037-07.
- PROVISIONAL (no Dxx; F12 to confirm): score threshold 70.
