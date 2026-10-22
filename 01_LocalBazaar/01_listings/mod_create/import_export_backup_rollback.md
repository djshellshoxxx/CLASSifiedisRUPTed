# PS-002-10 — Export/import, backups and rollback

**Status:** SPECIFIED — pending architecture/security review; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Contract references: [API/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md), [listing model](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md), [security threats](../../../planning/SECURITY_PRIVACY_THREAT_MODEL.md), [test gates](../../../planning/RELEASE_AND_TEST_GATES.md). All examples are proposed v1 contracts.

## Requirements
- PS-002-10.R01: Owner-authenticated export F10 includes own draft fields, created_at, revision, state and metadata; never include another user's data, auth sessions or risk decisions. Format JSON v1 with schema_version and data provenance.
- PS-002-10.R02: Imported owner drafts get new server ID, tenant/owner derived from session, state forced draft, revalidated against F18/F06. Imported federated public data belongs to F11 projection, not listing owner record.
- PS-002-10.R03: F15 backup encrypted PITR RPO<=15m RTO<=4h targets, <=90d retention absent scoped case hold. Restore sequence reapplies deletion/tombstone, ACL, feature flag and moderation policies before exposing database.
- PS-002-10.R04: Precommit create rollback atomic including outbox; postcommit undo must be archive/delete event, not direct invisible external reset. Federation revocation best effort cannot ensure remote erasure.
## Acceptance
TEST-PS-002-10 owner export/unauthorized export rejection, import revalidation, restore drills, deletion resurrection prevention and operational rollback. Targets not measured.
