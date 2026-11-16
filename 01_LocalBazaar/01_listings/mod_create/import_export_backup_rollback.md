# PS-002-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_create. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (export R11, backup and restore R06, holds R07), CTR-EVT-001 (immutability R08, source kinds), CTR-SCH-001 (upcast R07, compatibility R05), CTR-ID-001 (IDs).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-002-10.R01 | No import path creates drafts. `federated_import` and `migration` sources are refused for `listing.create`. | MVP |
| PS-002-10.R02 | Owner export includes the owner's drafts at their data classes. Other users' drafts are never included. | MVP |
| PS-002-10.R03 | Backups include drafts (encrypted). Restore replays deletions and legal holds before serving any draft (CTR-PRV-001 BT-04). | MVP |
| PS-002-10.R04 | Disabling create (feature flag) refuses new creates with `SYS.UNAVAILABLE` (retryable) and leaves existing drafts and queued entries intact. | MVP |
| PS-002-10.R05 | Events are never rewritten. Corrections to a draft are new events (CTR-EVT-001 R08). | MVP |
| PS-002-10.R06 | Rolling back the service keeps drafts written by the new version readable by the previous supported version (CTR-SCH-001 R05). | MVP |

## Data / schema
Export file: `listing.draft` records for the owner, field classes per PS-002-01. `asking_price` included as stored. `region_cell` included. No LOCATION_PRECISE data exists to export. Import of drafts is not supported in MVP.

## Commands / queries / events
No import or export command in this module. Export is an F10 service that reads `listing.draft` records.

## States & transitions
Rollback does not change draft states. Expired drafts (PS-002-07 R05) stay purged after restore.

## Validation & errors
Export and import refusals reuse `SYS.FORBIDDEN` (import sources) and `SYS.UNAVAILABLE` (flag off). Restore conflicts follow CTR-PRV-001 hold rules.

## Authorization
Export requests are authorized as owner export (CTR-PRV-001 R11). Operator restore needs dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Queued offline creates survive a feature-flag disable and stay pending. They are not discarded (CTR-ERR-001). A restore can re-deliver an acknowledged create. Idempotency rows restored with the data stop duplicates (PS-002-06).

## Privacy, retention, abuse
Backup retention follows the backup schedule. Export does not carry `owner_ref` for other users. Portability and account-ID re-issuance depend on D10 (OPEN).

## Observability & budgets
Metrics: `lst_create_flag_refusals_total`, `lst_export_drafts_total` (counts only). Restore verification report lists draft counts before and after replay.

## Tests
- TEST-PS-002-10-01 (restore): a backup holding a draft that was deleted after the backup point is restored; the draft is not served after replay.
- TEST-PS-002-10-02 (export): owner export contains own drafts with classes and excludes other owners' drafts.
- TEST-PS-002-10-03 (rollback): with the create flag off, queued offline creates remain `pending_local`; no half-written draft exists.
- TEST-PS-002-10-04 (compatibility): a `listing.draft` 1.0.0 record written by the new build is read by the previous build.

## Acceptance criteria
1. Imports of `federated_import` or `migration` sources are refused in 100% of fixtures.
2. Restore and rollback fixtures show no served deleted draft and no lost queued entry.
3. Export contains zero drafts of other owners.
4. TEST-PS-002-10-01 to -04 pass in CI.

## Assumptions & open decisions
- PROVISIONAL (D07 default, unapproved): backup and draft retention.
- OPEN (D10): account-ID re-issuance during portability; affects `owner_ref` in exports.
- ASSUMPTION: no migration hooks needed in MVP; any later upcast must be pure, deterministic and idempotent (CTR-SCH-001 R07).
