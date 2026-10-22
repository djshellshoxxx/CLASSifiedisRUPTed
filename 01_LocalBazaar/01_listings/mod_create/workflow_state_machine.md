# PS-002-03 — Draft creation state and transitions

**Status:** SPECIFIED — pending architecture/security review; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Contract references: [API/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md), [listing model](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md), [security threats](../../../planning/SECURITY_PRIVACY_THREAT_MODEL.md), [test gates](../../../planning/RELEASE_AND_TEST_GATES.md). All examples are proposed v1 contracts.

## Requirements
- PS-002-03.R01: Create is one transition ABSENT->DRAFT. Initial state and visibility always draft/private, revision 1. No request may directly create published/reserved.
- PS-002-03.R02: Event listing.created v1 emitted atomically with durable creation through F15 transactional outbox. A draft never triggers public search indexing or federation export.
- PS-002-03.R03: F01 mod_edit owns later draft revisions, mod_publish handles pending_moderation/publication and mod_archive handles archive/delete lifecycle. Draft retention/ownership requires F10.
## Failure & state behavior
Transaction failure -> no listing/no outbox; network response lost -> repeated Idempotency-Key returns original 201; disabled flag -> 403 without mutation; offline -> local pending draft, no server status. Race against account suspension checked inside transaction at write.
## Acceptance
TEST-PS-002-03 proves ABSENT->DRAFT only, outbox exactly one logical event despite retries, rollback and no public projection. Security and integration review not performed.
