# PS-062-10 — import export backup rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_consent. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07, R11, R12), CTR-SCH-001 (R07, R08), CTR-EVT-001 (R08)

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-062-10.R01 | Export gives each party their own consent records (given, declined, withdrawn), with terms digests and version numbers, in JSON within 24 h of request. | MVP |
| PS-062-10.R02 | Export never includes another party's `consent_id`, scope or digest. | MVP |
| PS-062-10.R03 | Consent records are signed evidence (CTR-SCH-001 R08): stored bytes retained verbatim; lossy migrations forbidden. | MVP |
| PS-062-10.R04 | Restore from backup never recreates a withdrawal that was refused, and never reverts a `given` after lock. | MVP |
| PS-062-10.R05 | Rollback of the consent module keeps readers for `consent.v1`; no record rewritten. | MVP |
| PS-062-10.R06 | Retention changes (RET-EVD) apply to new records; lengthening requires F10 approval (CTR-PRV-001 versioning). | MVP |

## Data / schema
Export manifest per party: `{"export_id":"…","consents":[{"consent_id":"cns_…","proposal_ref":"…","proposal_version":3,"terms_digest":"…","state":"…","given_at":"…"}],"schema_version":"1.0.0"}`.

## Commands / queries / events
`consent.exported` event with IDs and counts only.

## States & transitions
Export job: `requested` → `building` → `ready` (24 h) → `expired`.

## Validation & errors
`CONSENT.EXPORT_NOT_READY` (precondition_failed / 412, retryable); `CONSENT.EXPORT_EXPIRED` (gone / 410).

## Authorization
Self-scope only ([PS-062-05](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Export job idempotent per (party, day). Restore runs the lock check against the proposal's current lock state before applying any withdrawal.

## Privacy, retention, abuse
Export files PRIVATE_PERSONAL (authenticated download only). Backups encrypted; excluded from analytics restores.

## Observability & budgets
`consent_restore_conflict_total`; alert on any restore applying a withdrawal after lock (should be zero).

## Tests
- TEST-PS-062-10-01 (export): own records present; other party's IDs absent (grep).
- TEST-PS-062-10-02 (backup): restore from backup taken before lock with a withdrawal later refused → withdrawal not replayed after lock.
- TEST-PS-062-10-03 (schema): `consent.v1` bytes unchanged after migration to a later MINOR reader.
- TEST-PS-062-10-04 (rollback): previous reader reads all `consent.v1` rows.

## Acceptance criteria
1. Export excludes other parties' data (TEST-PS-062-10-01).
2. Restore honours lock (TEST-PS-062-10-02).

## Assumptions & open decisions
- D07 (retention): PROVISIONAL (D07 default, unapproved).
- OPEN: whether a party may export consent records of a deleted proposal (default: yes, RET-EVD).
