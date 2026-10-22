# PS-002-06 — Idempotency, retries and consistency

**Status:** SPECIFIED — pending architecture/security review; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Contract references: [API/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md), [listing model](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md), [security threats](../../../planning/SECURITY_PRIVACY_THREAT_MODEL.md), [test gates](../../../planning/RELEASE_AND_TEST_GATES.md). All examples are proposed v1 contracts.

## Requirements
- PS-002-06.R01: Unique (tenant_id,actor_id,endpoint,Idempotency-Key) command receipt stores canonical hash,status,body,24h expiry in the same transaction as draft and outbox. Replay identical payload returns original result. Different payload => 409 IDEMPOTENCY_MISMATCH with no additional draft.
- PS-002-06.R02: Deadlock/serialization retry maximum three with bounded randomized backoff 20..200ms; after exhaustion return 503 with Retry-After. No direct external provider call within the transaction. Outbox dispatched at least once and consumer inbox dedups by event_id.
- PS-002-06.R03: If receipt expired and response unknown, command_id lookup reconciles before creating a new draft; owner can list drafts ordered server timestamp. Cancelled client call does not undo committed server state.
## Offline
User's local draft is labeled unsent until authenticated server receipt. Same idempotency key and body reused on reconnect; never mark published or payment confirmed.
## Acceptance
TEST-PS-002-06 concurrent 100 replay harness, injected dropped response, deadlock, DB crash after outbox commit. Tests only planned.
