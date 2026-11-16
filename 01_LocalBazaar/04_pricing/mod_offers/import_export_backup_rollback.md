# PS-011-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_offers. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (export, backup restore BT-04, legal hold), CTR-SCH-001 (migration), CTR-EVT-001 (immutability, operator_correction), CTR-CAP-001 (`offer.export`), CTR-FED-001 (no offer federation). Feature flag name `offers` PENDING F15 flag registry.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-011-10.R01 | Owner export is UTF-8 JSON. Amounts are decimal strings. Status is the closed enum. Counterparty PRIVATE_PERSONAL is redacted. | MVP |
| PS-011-10.R02 | No offer import in MVP. Federated import of offers is forbidden. | MVP |
| PS-011-10.R03 | Backups include offers. Restore replays deletions and legal holds before serving (CTR-PRV-001 BT-04). | MVP |
| PS-011-10.R04 | Schema migrations are upcast-only and lossless. Stored events are never rewritten. | MVP |
| PS-011-10.R05 | Flag `offers` off: no new submit; existing offers stay readable and actionable; submitted offers still expire at expires_at. No silent accept. | MVP |
| PS-011-10.R06 | Errors in stored offers are fixed by an operator_correction event, never by editing stored rows. | MVP |
| PS-011-10.R07 | Accepted is terminal. A mistaken accept is corrected by operator correction and listing re-open via F01 (PENDING). | MVP |
| PS-011-10.R08 | Owner-initiated restore of a single export file is not supported in MVP. | Future |

## Data / schema
Export file: `{ "schema_version": "1.0.0", "exported_at": RFC 3339, "offers": [ ... ] }`. Each item carries the PS-011-01 fields visible to the owner, plus `role` (buyer or seller). Revision is included as a number only.

## Commands / queries / events
Export is `offer.export` (CTR-CAP-001 verb export), a read of owner-visible offers. Operator correction emits a normal offer event with provenance source_kind `operator_correction`.

## States & transitions
No new states. Flag-off is a configuration state, not an offer state.

## Validation & errors
Export with unknown schema version → SCH.UNKNOWN_VERSION on the importing side. Flag off on submit → SYS.UNPROCESSABLE_STATE (422, non-retryable).

## Authorization
Export requires `offer.export` self scope. Operator correction on PRIVATE_PERSONAL requires dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
- Restore: a submitted offer whose expires_at passed during downtime is expired on first read.
- Migration failure: record quarantined, original bytes kept (SCH.MIGRATION_FAILED).
- Rollback of app version: old readers encountering schema 2.x get SCH.UNKNOWN_VERSION; their drafts stay pending.

## Privacy, retention, abuse
Export and backups carry PRIVATE_PERSONAL data and are encrypted (CTR-PRV-001 disclosure matrix). Export files are not cached by the PWA.

## Observability & budgets
Metrics: `offer_exports_total`, `offer_restore_expired_on_read_total`, `offer_migration_failures_total`. Export p95 ≤ 5 s for 1,000 offers (ASSUMPTION).

## Tests
- TEST-PS-011-10-01 (export): owner export contains own offers; counterparty refs redacted; amounts are strings.
- TEST-PS-011-10-02 (import lint): no import route for offer schema; federated offer batch → FED.DATA_CLASS_NOT_ALLOWED.
- TEST-PS-011-10-03 (restore): deletions and holds replayed before serve; expired-in-downtime offers expire on read.
- TEST-PS-011-10-04 (migration golden): 1.0.0 fixtures upcast identically twice.
- TEST-PS-011-10-05 (flag): flag off blocks submit, keeps accept/reject/withdraw, expires pending offers, never accepts.
- TEST-PS-011-10-06 (correction): operator correction creates a new event; stored event bytes unchanged.

## Acceptance criteria
1. Export and restore tests pass with synthetic data.
2. No migration for offers is lossy.
3. TEST-PS-011-10-01 through -06 pass in CI.

## Assumptions & open decisions
- PROVISIONAL (D07 default, unapproved): retention and legal-hold exceptions apply to exports and backups.
- ASSUMPTION: no offer import in MVP; export size budget.
- OPEN: feature flag registry name (F15).
- PENDING F01 listing re-open contract (R07).
