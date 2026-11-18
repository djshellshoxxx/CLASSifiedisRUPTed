# PS-056-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_profiles. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11 export rules; RET-LEGAL), CTR-SCH-001 (migrations), CTR-CAP-001 (owner export), CTR-FED-001 (not federated in MVP).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-056-10.R01 | Owner export returns own public and private block, grants issued by owner, and visibility settings as JSON `profile.export` 1.0.0. | MVP |
| PS-056-10.R02 | Export never includes counterparties' private values or grant recipients' data beyond IDs. | MVP |
| PS-056-10.R03 | Backups encrypted and include profile rows, grants and purge state. | MVP |
| PS-056-10.R04 | Restore never re-exposes purged private blocks; restore of a `purged` profile keeps the purge flag. | MVP |
| PS-056-10.R05 | Restore of disclosure grants re-checks expiry; expired grants are not restored as active. | MVP |
| PS-056-10.R06 | Profile import from another platform. | Future (blocked on D01 and D10) |

## Data / schema
`profile.export` 1.0.0: `export_id` (opaque), `generated_at`, `profile` (fields per [domain_schema.md](domain_schema.md)), `grants_issued[]` (`grant_id`, `counterparty_ref`, `fields`, `expires_at`), `schema_version`.

## Commands / queries / events
`RequestProfileExport` (owner, idempotent), completion event `profile.export_ready` with `export_id` only.

## States & transitions
| From | Event | Guard | To |
|---|---|---|---|
| (none) | `RequestProfileExport` | owner; ≤ 1 per 24 h | `queued` |
| `queued` | job complete | — | `ready` (24 h validity) |
| `ready` | expiry | 24 h | `expired` (file deleted) |

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `PROF.EXPORT_RATE_LIMIT` | true | `err.prof.export_rate_limit` |
| `PROF.RESTORE_PURGED_CONFLICT` | false | `err.prof.restore_conflict` |

## Authorization
Export: `profile.export` on `self`. Restore: operator with dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Export generation idempotent per `export_id`. Restore into staging first; cutover after purge-flag check. Schema rollback forward-only; bad releases roll back via feature flag.

## Privacy, retention, abuse
Export file deleted at 24 h (RET-EPH). Backups retained 35 days (ASSUMPTION), then purged; holds per RET-LEGAL. Export of another account denied.

## Observability & budgets
`prof_export_total{result}`, `prof_restore_check_total{result}`; export p95 ≤ 30 s (ASSUMPTION).

## Tests
- TEST-PS-056-10-01 (contract): export validates against `profile.export` 1.0.0.
- TEST-PS-056-10-02 (integration): export excludes counterparties' private values (two-account fixture).
- TEST-PS-056-10-03 (integration): restore of purged profile keeps purge.
- TEST-PS-056-10-04 (integration): expired grant not restored as active.

## Acceptance criteria
1. Export matches stored data for all fixtures.
2. Restore never resurrects purged private data.
3. Export link expires at 24 h.
4. Backup drill completed and recorded.

## Assumptions & open decisions
- ASSUMPTION: backup retention 35 days.
- PROVISIONAL (D10 default, unapproved): encrypted export keyed to owner; recovery in mod_recovery.
- PROVISIONAL (D07 default, unapproved): per-category retention with legal-hold exceptions.
