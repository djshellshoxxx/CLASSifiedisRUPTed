# PS-052-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_pseudonyms. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11 export rules, RET-LEGAL), CTR-SCH-001 (migrations, R08 for signed records), CTR-CAP-001 (owner export), CTR-FED-001 (no federation in MVP).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-052-10.R01 | Owner export returns own `prf_` records with `account_id`, handle, label, state and timestamps as JSON 1.0.0. | MVP |
| PS-052-10.R02 | Export never includes other accounts' linkage, reservation holders' IDs or moderation data. | MVP |
| PS-052-10.R03 | Backups are encrypted at rest and include `prf_`, `handle_reservations`, idempotency records (7 days). | MVP |
| PS-052-10.R04 | Restore rebuilds the unique `handle_norm` index and rejects any restore that would duplicate an `active` handle. | MVP |
| PS-052-10.R05 | Restore never reactivates a `retired` `prf_`. | MVP |
| PS-052-10.R06 | Pseudonym import from another platform. | Future (blocked on D01/D10) |

## Data / schema
Export document `pseudonym.export` 1.0.0:

| Field | Type | Notes |
|---|---|---|
| `export_id` | string(30) | `opaque` class per CTR-ID-001 |
| `generated_at` | timestamp | RFC 3339 UTC |
| `pseudonyms[]` | array(max 5 active + retired) | fields per [domain_schema.md](domain_schema.md) |
| `schema_version` | semver | `1.0.0` |

Export file is encrypted to the owner's device key or delivered through the authenticated session (ASSUMPTION; D10 PROVISIONAL).

## Commands / queries / events
- `RequestExport` (owner, `pseudonym.export`, idempotency key). Event `pseudonym.export_requested`.
- Export generation is an asynchronous job; completion event carries `export_id` only.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `RequestExport` | owner, rate ≤ 1 per 24 h | `queued` | job created |
| `queued` | job complete | — | `ready` | link valid 24 h |
| `ready` | expiry | 24 h elapsed | `expired` | file deleted |

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `PSEUD.EXPORT_RATE_LIMIT` | true | `err.pseud.export_rate_limit` |
| `PSEUD.RESTORE_HANDLE_CONFLICT` | false | `err.pseud.restore_conflict` |

## Authorization
Export requires `pseudonym.export` on `self`. Restore requires `sys_` operator with dual control (ASSUMPTION; CTR-CAP-001 R07 applies when restore touches personal data).

## Failure, idempotency, concurrency, offline
- Export job retried on failure; generation is idempotent per `export_id`.
- Restore is run in a maintenance window into a staging copy; cutover only after handle index check passes.
- Rollback of schema: forward-only for `pseudonym.record`; a bad release is rolled back by feature flag, not by data rollback.

## Privacy, retention, abuse
- Export file retention 24 h then deleted (RET-EPH).
- Backup retention 35 days (ASSUMPTION), then purged; legal hold per RET-LEGAL.
- Export abuse: rate limit R01 of states table; export of other accounts is denied.

## Observability & budgets
Metrics `pseud_export_total{result}`, `pseud_restore_check_total{result}`. Export generation p95 ≤ 30 s for 5 pseudonyms (ASSUMPTION).

## Tests
- TEST-PS-052-10-01 (contract): export validates against `pseudonym.export` 1.0.0.
- TEST-PS-052-10-02 (integration): export contains no other account's data (fixture with two accounts).
- TEST-PS-052-10-03 (integration): restore into staging detects duplicate active handle and aborts.
- TEST-PS-052-10-04 (negative): restore cannot change `retired` to `active`.

## Acceptance criteria
1. Owner export matches stored data for 100% of fixtures.
2. Restore fails closed on handle conflict.
3. Export link expires at 24 h and file is deleted.
4. Backup contents list verified in drill.

## Assumptions & open decisions
- ASSUMPTION: backup retention 35 days.
- PROVISIONAL (D10 default, unapproved): user-controlled keys for encrypted export; recovery and rotation documented in mod_recovery.
- PROVISIONAL (D07 default, unapproved): retention per category with legal-hold exceptions.
