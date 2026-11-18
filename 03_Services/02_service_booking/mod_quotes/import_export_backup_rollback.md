# PS-032-10 — import export backup rollback

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-032-10. **Owner:** [03_Services/02_service_booking/mod_quotes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_quotes. **Consumers:** candidate consumers in domain_schema.md Section 6; subscriber map pending F15 registry.

## Purpose and scope
Defines the portable export format for a participant's own quotes, the import boundary, backup and restore scope, and rollback rules for schema and release changes. Business outcome: a participant can take a readable copy of their own quote history, and operators can restore quote data after loss without corrupting open quotes or replaying stale acceptances.

Exclusions: per-user import of quotes from external systems (not in v1); import of other participants' data; payment or ledger exports; federation (CTR-FED-001).

## Requirements
- PS-032-10.R01: Export format, fields, encoding and integrity check are fixed in Section 1.
- PS-032-10.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial import, export and restore cases are listed in Section 4 and tested in TEST-PS-032-10-T01 to T04.
- PS-032-10.R03: Export output is readable without assistive technology dependency (plain JSON Lines plus a human-readable index in the same archive). Export size and time budgets are in observability_performance.md.
- PS-032-10.R04: The export contains only the caller's own quotes and their revisions, responses and status history (Section 1).
- PS-032-10.R05: Import is refused in v1 for quote data. Restore is an operator action from backup only (Section 2).
- PS-032-10.R06: Backup, restore and rollback boundaries are defined in Sections 2 and 3, including the rule that restore never re-sends acceptance events as new decisions.

## 1. Export format
- Container: one archive `quotes-export-<participant_token>-<YYYYMMDD>.zip` containing `quotes.jsonl`, `manifest.json` and `README.txt`.
- `quotes.jsonl`: UTF-8, LF line endings, one JSON object per quote, keys sorted. Object: quote fields from domain_schema.md Section 1, `revisions` (array of revision objects with line items), `responses` (array), `status_history` (array). Exported timestamps are RFC 3339 UTC with milliseconds.
- `manifest.json`: `schema_version` (`1.0.0`), `exported_at`, `record_count`, `sha256` of `quotes.jsonl`, `participant_token`, `format` (`quotes-jsonl`).
- `README.txt`: plain text, under 2 KB, describes fields in English. Localization is out of scope for the archive README (A-quotes-23).
- Integrity: the caller verifies `sha256` against `manifest.json`. A mismatch means the file is corrupt; the caller should request a new export.
- Excluded from export: other parties' participant IDs in clear (replaced with `counterparty_token`), operator audit records, idempotency records, outbox rows.

Example line (abbreviated):
```json
{"quote_id":"01J9QTX7M3K2R8W5N4P6T0V1Z2","status":"ACCEPTED","closed_reason":"ACCEPTED","provider_token":"tok_example_a1","requester_token":"tok_example_b2","currency_code":"EUR","revisions":[{"revision_no":1,"total_minor":9000,"content_hash":"3f9a0c…"}],"responses":[{"decision":"ACCEPT","revision_no":1}],"status_history":[{"to_status":"ACCEPTED","occurred_at":"2026-11-10T11:00:00.000Z"}]}
```

## 2. Import boundary and restore
- Quote import from files: not supported in v1 (A-quotes-23). The import endpoint returns QUOTES_FEATURE_DISABLED for this purpose. Export files are not accepted as input.
- Restore from backup: operator action with a recorded case reference. Restores quote, revision, line item, response, status history, outbox and idempotency tables as one consistent snapshot.
- Backup scope: all quote tables, outbox, idempotency records (24-hour window), and schema migration version. Backup frequency: continuous log plus daily full snapshot.
- Recovery objectives: RPO 15 minutes, RTO 4 hours (A-quotes-24).
- After restore, in order: (1) run the expiry job to move any quote with `valid_until` ≤ now to EXPIRED; (2) re-publish outbox rows with `published_at` null, consumers dedupe on `event_id`; (3) do not re-issue any accepted or declined event as a new decision; (4) reconcile open pending offline queues by server state only.

## 3. Rollback boundaries
- Schema migrations are expand-then-contract. A release never drops a column that the previous release reads.
- Application rollback: code can be rolled back within one minor version without data rollback. Stored records written by the newer release must remain readable by the older release (additive fields only).
- Data rollback: not performed on production quote data. If a migration must be undone, restore from backup to a new environment and compare, then cut over under operator case.
- Feature flag `quotes.enabled` is the first control to use. Turning it off stops commands with QUOTES_FEATURE_DISABLED and keeps reads, export and expiry jobs running so no quote is stranded (A-quotes-25).
- Events published before rollback remain valid. Consumers must accept the `1.0.0` envelope.

## 4. Import, export and restore cases
| Class | Case | Expected result | Test |
|---|---|---|---|
| normal | Export own quotes; re-read and count | Manifest count equals records; checksum matches | T01 |
| invalid | Import attempt with quote file | QUOTES_FEATURE_DISABLED; no rows written | T02 |
| expired | Restore snapshot taken before a `valid_until` | Expiry job closes quote; no accept event re-emitted | T03 |
| duplicate | Export requested twice within a minute | Two archives with distinct names; identical content hash | T01 |
| concurrent | Export while an accept commits | Export reflects either pre- or post-commit state, never a partial quote | T01 |
| offline | Restore while clients have pending queues | Queues reconcile by server state; stale revisions return QUOTES_REVISION_STALE | T03 |
| adversarial | Export request for another participant's quote ID | QUOTES_NOT_FOUND; no archive produced | T04 |
| adversarial | Tampered `quotes.jsonl` | Checksum mismatch detected by verifier | T04 |

## Assumptions and open decisions
- A-quotes-23: Export is JSON Lines plus manifest and README, UTF-8. Per-user import is not supported in v1. README is English.
- A-quotes-24: Backup RPO 15 minutes; RTO 4 hours; daily full snapshot retained 35 days.
- A-quotes-25: Feature flag `quotes.enabled` defaults to off in production until the release gate in contract_and_acceptance_tests.md passes.
- Export archive retention and delivery channel follow privacy_retention_abuse.md and the platform export feature (F10). Not decided here.
