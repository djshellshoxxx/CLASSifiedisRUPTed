# PS-102-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_email (Platform Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07, R11), CTR-SCH-001 (R07, R08), CTR-EVT-001 (R08).

**Decision labels:** Backup encryption and restore order are PROVISIONAL (D07 and D10 defaults, unapproved). No federated import or export of addresses (CTR-FED-001 deferred).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-102-10.R01 | Import: none in MVP. Address import from another service requires a fresh verification; imported addresses start in `UNVERIFIED`. | Future |
| PS-102-10.R02 | Owner export includes the owner's own address in clear, as PRIVATE_PERSONAL data (CTR-PRV-001 R11). Export never includes tokens, provider IDs or other accounts' data. | MVP |
| PS-102-10.R03 | Backups are encrypted; address ciphertext is included only under the same key policy as the live store. | MVP |
| PS-102-10.R04 | Restore replays removals and suppressions before serving sends. A restored `VERIFIED` binding whose account is deleted is removed, not resurrected (CTR-PRV-001 R06). | MVP |
| PS-102-10.R05 | Template rollback: the catalog pins versions; rollback re-points to the prior version and emits an `aud_` record. Sent messages are not recalled. | MVP |
| PS-102-10.R06 | Provider failover is a configuration change; queued messages keep their `dlv_` IDs and dedupe keys. | MVP |

## Data / schema
Owner export package: `schema_version`, `email_id`, `address` (owner only), `state`, `verified_at`, `generated_at`. Schema per CTR-SCH-001; lossy migrations forbidden for verification records (R08 analog, ASSUMPTION).

## Commands / queries / events
Export is a `sys_` job on owner request, emitting `aud_` with purpose and decision ID. Restore emits no user-facing events; it logs an `aud_` summary.

## States & transitions
Restore sets states from replayed events (PS-102-03). Rollback emits events; it does not rewrite history.

## Validation & errors
Restore rejects backups with unknown schema MAJOR (`SCH.UNKNOWN_VERSION`).

## Authorization
Export requires owner `eml.read` with purpose constraint; no operator export (PS-102-05).

## Failure, idempotency, concurrency, offline
Restore is idempotent. Offline: not applicable.

## Privacy, retention, abuse
Backup expiry follows backup schedule (CTR-PRV-001 R06). Exports are delivered through the authenticated session only, never by email.

## Observability and budgets
Restore duration and replay count; target restore of 30 days of bindings within 60 minutes (ASSUMPTION).

## Tests
- TEST-PS-102-28 (integration): owner export contains own address and no other account's data.
- TEST-PS-102-29 (integration): restore a backup with deleted account; binding stays removed.
- TEST-PS-102-30 (integration): template rollback re-points sends; prior sent messages unchanged.
- TEST-PS-102-31 (integration): provider failover keeps dedupe; no duplicate sends across providers.

## Acceptance criteria
1. Restore drill passes for deleted-account case.
2. Export test passes for owner-only content.
3. Template rollback drill recorded in `aud_`.

## Assumptions & open decisions
- ASSUMPTION: backup tooling supports per-table restore.
- D07, D10 (PROVISIONAL, unapproved).
