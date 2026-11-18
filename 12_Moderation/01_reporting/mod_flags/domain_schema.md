# PS-094-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_flags (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-EVT-001, CTR-PRV-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-094-01.R01 | One `rpt_` record per accepted report. Class `opaque` (CTR-ID-001 registry, owner F12). | MVP |
| PS-094-01.R02 | Reporter identity (`reporter_ref`) is stored for abuse analysis and is never returned to the reported party or to other reporters. | MVP |
| PS-094-01.R03 | Duplicate suppression key is a keyed HMAC-SHA-256 over (reporter, target, UTC day), never a plain concatenation. | MVP |
| PS-094-01.R04 | `reason_code` is from the closed enum below; no free-form category. | MVP |
| PS-094-01.R05 | Report weight is server-computed in [0.0, 1.0] and never shown to the reporter. | MVP |
| PS-094-01.R06 | Target content is not copied into the report; snapshots are referenced by `mev_` (PS-093). | MVP |

## Data / schema
| Field | Type | Class | Constraint / visibility |
|---|---|---|---|
| report_id | `rpt_` | PSEUDONYMOUS | required, opaque |
| reporter_ref | `acc_` | PSEUDONYMOUS | visibility `case` |
| target_type | enum: listing, service, auction, rental, message, thread, attachment, profile | PUBLIC | required |
| target_id | prefix-matched string | PSEUDONYMOUS | `ID.PREFIX_MISMATCH` |
| target_owner_ref | `acc_` | PSEUDONYMOUS | visibility `case` |
| reason_code | enum: prohibited_item, fraud_suspected, harassment, threat_or_violence, doxxing_or_personal_data, spam, misleading_listing, impersonation, other | PUBLIC | required |
| detail_text | string 0–500 UTF-8 chars | PRIVATE_PERSONAL | visibility `case`; RET-PRIV |
| dedupe_hmac | hex(64) | SECRET (keyed) | never in events |
| weight | decimal string, 0.0–1.0, 1 decimal | PSEUDONYMOUS | visibility `case` |
| status | enum in PS-094-03 | PUBLIC | required |
| case_id | `cas_`, nullable | PSEUDONYMOUS | set on link |
| submitted_at | RFC3339 UTC ms | PSEUDONYMOUS | server-set |
| revision | integer ≥ 1 | PUBLIC | CTR-EVT-001 R02 |

Record max class: PRIVATE_PERSONAL (detail_text). Event payloads carry no detail_text.

## Commands / queries / events
PS-094-04. Schema registered as `report` 1.0.0 (CTR-SCH-001).

## States & transitions
PS-094-03.

## Validation & errors
PS-094-02.

## Authorization
PS-094-05.

## Failure, idempotency, concurrency, offline
Unique on (dedupe_hmac) within a 24 h window; duplicates return existing `rpt_` with status `deduplicated`.

## Privacy, retention, abuse
`detail_text` may contain personal data about third parties: stored in RET-PRIV, redacted on case closure when reason is doxxing_or_personal_data. Retained report metadata RET-AUD for 12 months after closure.

## Observability & budgets
Field-count and class checks in CI; `flags_schema_violations_total`.

## Tests
- TEST-PS-094-01-01 (lint): every field classified; `dedupe_hmac` absent from events and logs.
- TEST-PS-094-01-02 (visibility): reported party response omits `reporter_ref`, `weight`, `detail_text`.

## Acceptance criteria
1. Schema validates against CTR-SCH-001 with classes on all fields.
2. No API or event exposes reporter identity to target owner (TEST-02).

## Assumptions & open decisions
- PENDING: none new; `rpt` prefix exists (CTR-ID-001, owner F12, opaque).
- B-06: canonical owner of report records = F12.S01.M01 (PROVISIONAL, unapproved). Feature flags (F15.S04.M02) are a different record class and are never referenced as reports.
- PROVISIONAL (D07 default, unapproved): retention classes RET-PRIV and RET-AUD.
