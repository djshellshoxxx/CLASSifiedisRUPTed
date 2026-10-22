# PS-002-05 — Authorization and permissions

**Status:** SPECIFIED — pending architecture/security review; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Contract references: [API/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md), [listing model](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md), [security threats](../../../planning/SECURITY_PRIVACY_THREAT_MODEL.md), [test gates](../../../planning/RELEASE_AND_TEST_GATES.md). All examples are proposed v1 contracts.

## Requirements
- PS-002-05.R01: Only active member of current tenant with listing:create capability can create draft. Deny anonymous, banned, unverified suspended, cross-tenant actors and peers with federation:import only.
- PS-002-05.R02: F16 ABAC evaluates account status, tenant, feature flag, anti-abuse policy before persistence. Server never honors caller owner_id/tenant_id. Moderator/operator cannot create on behalf of a seller absent a separate audited delegated capability (disabled in MVP).
- PS-002-05.R03: New draft is visible only to creator, except explicitly assigned case review under F12; public, other members, federation peers cannot enumerate draft IDs.
## Errors/abuse
401 if unauthenticated, 403 for missing capability/disabled state; future draft lookup returns 404 indistinguishable for not-found and not-authorized. Log only actor surrogate and permission code. Session/token compromised case invalidates refresh and future writes.
## Acceptance
TEST-PS-002-05 exhaustive role × tenant × account flag table, policy outage denied, guessed draft ID not leaked. Pending independent permission review.
