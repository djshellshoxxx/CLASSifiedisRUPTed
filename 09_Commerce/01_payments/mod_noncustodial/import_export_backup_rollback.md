# PS-069-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_noncustodial (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R11), CTR-SCH-001 (migration), CTR-FED-001 (R03), CTR-EVT-001 (R08). **Decisions:** D07 (PROVISIONAL default, unapproved), D09 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-069-10.R01 | Owner export includes own routes and own `contact_hint`; counterparty's `contact_hint` is redacted (CTR-PRV-001 R11). | MVP |
| PS-069-10.R02 | Export format: JSON per CTR-SCH-001, destinations as strings, no floats. Export generated in ≤ 10 s for ≤ 100 routes. | MVP |
| PS-069-10.R03 | No import path in MVP. Route import from any peer or file is refused (`SYS.FORBIDDEN`) until a separate decision. | MVP |
| PS-069-10.R04 | Backup restore replays `route.*` and `adapter.*` events; restored state must equal pre-backup state at the recorded `state_version`. | MVP |
| PS-069-10.R05 | Restore replays hint purges so purged hints are not resurrected (CTR-PRV-001 R06). | MVP |
| PS-069-10.R06 | Schema changes use expand-contract; rollback disables new commands by feature flag and never deletes route rows. | MVP |

## Data / schema
Export manifest: `schema_version`, `exported_at`, `route_count`, `redactions` (count only), `digest` (SHA-256 of body).

## Commands / queries / events
Export is a query, not a command. Restore emits no new domain events; it writes a `restore.completed` audit record (`aud_`) with counts only.

## States & transitions
Rollback does not move routes between states; disabled commands return `SYS.UNAVAILABLE` (retryable true) until re-enabled.

## Validation & errors
Export request by non-owner returns `SYS.NOT_FOUND`. Restore digest mismatch returns `SCH.MIGRATION_FAILED`.

## Authorization
Owner export requires `route.read` on own routes. Restore requires `ope_` with dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Export is idempotent on (owner, manifest digest). Restore is idempotent by replaying from event sequence; a partial restore is discarded and retried from the start.

## Privacy, retention, abuse
Exports are PRIVATE_PERSONAL artefacts: encrypted, expire from download link in 24 h (ASSUMPTION), deleted from the server after download or expiry.

## Observability & budgets
Export duration p95 ≤ 10 s; restore duration recorded per GB, no budget in MVP.

## Tests
- TEST-PS-069-10-01 (integration): owner export contains own hint and redacts counterparty hint.
- TEST-PS-069-10-02 (contract): export validates against CTR-SCH-001 schema.
- TEST-PS-069-10-03 (integration): backup-restore round trip equals pre-backup digest.
- TEST-PS-069-10-04 (integration): hint purged before backup is still purged after restore.
- TEST-PS-069-10-05 (negative): import attempt refused with `SYS.FORBIDDEN`.

## Acceptance criteria
1. Round-trip restore digest matches in 100 of 100 fixture runs.
2. No purged hint reappears after restore (automated).
3. Rollback drill: commands disabled, no route rows lost (staging drill).

## Assumptions & open decisions
- ASSUMPTION: 24 h export link lifetime.
- D07 (PROVISIONAL default, unapproved): retention with legal-hold exceptions.
- D09 (PROVISIONAL default, unapproved).
