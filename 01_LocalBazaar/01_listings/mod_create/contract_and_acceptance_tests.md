# PS-002-09 — Process acceptance and test matrix

**Status:** SPECIFIED — pending architecture/security review; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Contract references: [API/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md), [listing model](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md), [security threats](../../../planning/SECURITY_PRIVACY_THREAT_MODEL.md), [test gates](../../../planning/RELEASE_AND_TEST_GATES.md). All examples are proposed v1 contracts.

## Requirements
- PS-002-09.R01: Test fixtures for draft kind variants, title Unicode boundaries, integer overflow, tenant access and invalid/duplicate idempotency key. Derive expected errors from validation_rules and CORE problem+json.
- PS-002-09.R02: Real PostgreSQL integration test asserts one insertion/outbox/receipt after 100 concurrent identical requests; under failed transaction no partial record. Search never returns drafts; federation cannot import them as authoritative listings.
- PS-002-09.R03: Property fuzz 10,000 schema inputs with deterministic seed, negative cross-tenant authorization, XSS, stale region, forbidden category. E2E viewport 320/375/768px, keyboard-only and screenreader error summary, offline retry with same key.
- PS-002-09.R04: All tests must be linked by TEST-PS-002-01 through TEST-PS-002-10 to actual CI artifacts after implementation; no test result exists in this phase.
## Objective exit criteria
0 schema/permission/race failures, all error status contracts stable, WCAG2.2 AA review, API p95 <=700ms at specified workload, no known high/critical security findings. TEST-PS-002-09 is the aggregate test map. Still pending CI evidence.
