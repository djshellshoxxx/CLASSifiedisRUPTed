# PS-010-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_negotiation. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, retention, deletion, push previews), CTR-EVT-001 (redaction, hash chain), CTR-FED-001 (federation exclusion), CTR-CAP-001 (abuse alerts), CTR-SCH-001 R10 (class changes need F10).

**Decision labels:** Retention defaults are PROVISIONAL (D07 default, unapproved). Pseudonymous-only classing is ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-010-07.R01 | Data class per field: IDs and state PSEUDONYMOUS; terms amounts PSEUDONYMOUS (ASSUMPTION); no field of class LOCATION_PRECISE, PRIVATE_PERSONAL or SECRET exists. | MVP |
| PS-010-07.R02 | No negotiation content leaves the module as free text. Terms carry no coordinates, pickup address, phone, email or handle. Pickup or meeting detail is out of scope (F05, F08). | MVP |
| PS-010-07.R03 | Initiator identity is shown to the seller only as its active `prf_` view. The seller never sees the initiator's `acc_`. | MVP |
| PS-010-07.R04 | Non-agreed terminal negotiations (REJECTED, WITHDRAWN, EXPIRED, VOIDED): payload minimized at 90 days, record deleted at 180 days (ASSUMPTION, D07). Event envelope retained with payload replaced by digest (CTR-EVT-001 R08). | MVP |
| PS-010-07.R05 | AGREED negotiations: retained as RET-EVD for 24 months after AGREED (ASSUMPTION, mirrors CTR-COM-001 retention), then minimized. | MVP |
| PS-010-07.R06 | Deletion and expiry propagate to replicas, caches, search and exports within 24 h (CTR-PRV-001 R06). | MVP |
| PS-010-07.R07 | Negotiation events are not federated. No export to peers (CTR-FED-001 R02). | MVP |
| PS-010-07.R08 | Push and in-app previews are generic: "A negotiation has an update" (CTR-PRV-001 R10). | MVP |

## Data / schema
Retention classes used: RET-EVD (AGREED), RET-OPS (error and timer logs, 30 days), RET-AUD (decision and privileged-read records, 12 months). Field-class map: [PS-010-01](domain_schema.md). Redaction keeps `event_id`, `aggregate_id`, `revision`, `occurred_at`, `event_type` and replaces payload with `payload_digest`.

## Commands / queries / events
Export and deletion commands are in [PS-010-10](import_export_backup_rollback.md). No privacy-specific command exists in this module.

## States & transitions
Retention transitions are time-driven: `TERMINAL_RECENT` → `MINIMIZED` (90 d) → `DELETED` (180 d). `AGREED` → `MINIMIZED` (24 months). Legal holds pause these per CTR-PRV-001 R07.

## Validation & errors
Writes containing forbidden classes are rejected by schema lint (CI, TEST-PS-010-07-02) and at runtime with `SYS.REQUEST_MALFORMED`. Error bodies never echo input (CTR-ERR-001 R06).

## Authorization
Access to minimized or deleted records returns `SYS.NOT_FOUND` (CTR-ERR-001 R08). Moderator access under `case` grant only (see [PS-010-05](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Deletion requests are idempotent. Offline devices receive the deletion at next sync; queued writes for deleted negotiations fail at commit.

## Privacy, retention, abuse
Abuse controls:

| Abuse | Control | Code / signal |
|---|---|---|
| Spam opens | 1 active per (listing, initiator); 20 active per initiator | `NEG.OPEN_EXISTS`, `NEG.ACTIVE_LIMIT` |
| Counter flooding | 10 round cap; ≤ 10 commands per negotiation per hour per actor (ASSUMPTION) | `NEG.ROUND_LIMIT`, `SYS.RATE_LIMITED` |
| Price anchoring or bait | Ratio bounds 0.10×–10.00×; accept blocked after listing edit | `NEG.TERMS_OUT_OF_BOUNDS`, `NEG.LISTING_CHANGED` |
| Enumeration of other buyers | Uniform `SYS.NOT_FOUND`; no counts of other buyers | CTR-CAP R04 alert |
| Harassment via negotiation | Report from thread (`rpt_`) opens `cas_`; read via case grant | F12 |
| Off-platform steering | No free-text field in negotiation; messages live in F08 thread | — |
| Fake listings for scraping | Listing-level negotiation counts are not public | — |

Pseudonyms do not guarantee anonymity: repeated negotiations on one listing may link `prf_` views to one `acc_`. This must be disclosed to users (ASSUMPTION).

## Observability & budgets
Abuse alert: one initiator opens more than 5 negotiations in 1 h (ASSUMPTION). Logs carry `neg_`, `lst_`, state, round and code only (see [PS-010-08](observability_performance.md)).

## Tests
- TEST-PS-010-07-01 (classes): every field has a class; no LOCATION_PRECISE, PRIVATE_PERSONAL or SECRET field present.
- TEST-PS-010-07-02 (input): email, phone, street address and coordinate strings in `terms` are rejected and not stored.
- TEST-PS-010-07-03 (retention): terminal negotiation minimized at 90 d and deleted at 180 d in a clock-advanced run.
- TEST-PS-010-07-04 (deletion propagation): delete reaches cache, search and export within 24 h simulation.
- TEST-PS-010-07-05 (preview): push preview for `countered` contains no amount.
- TEST-PS-010-07-06 (federation): export batch containing negotiation events is empty.

## Acceptance criteria
1. No negotiation record or event contains a forbidden class (TEST-PS-010-07-01).
2. Seller views never contain initiator `acc_` (TEST-PS-010-05-05).
3. TEST-PS-010-07-01 through -06 pass.

## Assumptions & open decisions
- PROVISIONAL (D07 default, unapproved): 90/180-day non-agreed retention; 24-month agreed retention.
- ASSUMPTION: pseudonymous-only class for terms; F10 to validate.
- OPEN (D05): if pickup location is later negotiated, it needs a separate LOCATION_PRECISE process outside this module.
- Related: D01 (federation), D07 (retention).
