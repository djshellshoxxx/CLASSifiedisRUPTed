# PS-002-08 — Performance and telemetry requirements

**Status:** SPECIFIED — pending architecture/security review; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Contract references: [API/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md), [listing model](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md), [security threats](../../../planning/SECURITY_PRIVACY_THREAT_MODEL.md), [test gates](../../../planning/RELEASE_AND_TEST_GATES.md). All examples are proposed v1 contracts.

## Requirements
- PS-002-08.R01: Draft creation target API p95 <=700ms/p99 <=1500ms at 100RPS mixed workload, 99.9% monthly availability; load-test environment and fixture volumes must be attached, not assumed.
- PS-002-08.R02: Publish counters create_total by status category, duration histogram, transactional outbox lag, failure codes, retry count. No actor IDs, listing descriptions, IPs, exact location or excessive high-cardinality labels in metrics/logs.
- PS-002-08.R03: Structured log request_id, correlation_id, coarse tenant bucket and error_code, default 30d operations retention; event backlog >120s for >10m alerts; 5xx >1% for 5m alerts, runbook includes DB failover and outbox replay.
## Acceptance
TEST-PS-002-08 15 minute deterministic load, forced DB latency, outbox queue outage, canary payload telemetry scan and alert firing/clear. No measurements yet.
