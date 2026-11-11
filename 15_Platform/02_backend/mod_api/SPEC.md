# F15.S02.M02 — API and command bus

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S02](../SPEC.md). **Process IDs:** PS-117-01…PS-117-10. **Code:** `packages/kernel/src/bus`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The kernel command bus shared by every feature package (ADR-0002, amended by ADR-0016). It runs in-process inside the user's vault (IndexedDB, actor = unlocked local principal) and, wrapped by a node:http adapter, inside an optional self-hosted relay for relay commands only. It owns the definition API (defineCommand, defineQuery, defineSubscriber, defineEvent, defineMachine, defineErrors), the dispatch pipeline (feature flag, relay read-only containment, authentication, tenant status, rate limit, strict validation, authorization, idempotency, handler in one transaction, transactional outbox, idempotent response, audit), UUIDv7 identifiers, the clock port, typed errors with problem+json rendering, and relay access tokens issued by challenge-response. Ports owned downstream reach the bus by inverted registration at composition: TenantPort (F15.S04.M03, which also supplies LocalSettings.vaultId as the vault's dispatch-context tenantId) and ContainmentPort (the relay read-only switch of F16.S03.M03). It holds no domain data of its own except IdempotencyRecord and relay access tokens.

## Responsibilities

- Provide the definition API and a registry that rejects duplicate or malformed command, query and consumer names at startup.
- Run every command through one pipeline in the order flag, read-only (relay), authn, tenant (TenantPort), rate limit, validation, authorize, idempotency, handler in transaction, outbox, idempotent response, audit.
- Store IdempotencyRecord rows for 24 h and replay the original status and body for the same key and request hash (CTR-IDM-001 IDM-1).
- Generate and validate UUIDv7 identifiers with a monotonic counter and reject IDs more than 24 h in the future (CTR-ID-001).
- Map every failure to a CTR-ERR-001 AppError and render RFC 9457 problem+json on the relay HTTP surface.
- Expose only relay-surface definitions over HTTP; vault definitions are reachable only in-process.
- Issue, resolve and revoke relay access tokens by challenge-response (CTR-CAP-001 sessions, CAP-10).
- Refuse mutating relay commands that are not on the F16.S03.M03 exemption list with SECURITY_READ_ONLY_MODE (503, Retry-After 300) while the relay read-only sentinel is on, and never block queries.
- Run the TenantPort stage after authentication so writes to a suspended or archived relay tenant get PLATFORM_TENANT_SUSPENDED, and dispatch every vault command with LocalSettings.vaultId as the context tenantId.

## Not responsible for

- Authorization policy content, role assignments and the audit log store (F16.S01.M01 implements AuthzPort and AuditPort).
- Flag values and the dependency rule (F15.S04.M02 implements FlagPort and returns disabled modules).
- Rate limit policy per relay (F12.S03.M04 and relay hosting policy implement RateLimitPort).
- Storage adapters, outbox delivery and media blobs (F15.S02.M03); the vault sync outbox of OutboxEntry records and its sender (F15.S01.M01, N24).
- Logs, metrics and readiness (F15.S03.M01); the relay process, configuration and shutdown, and the public media route GET /media/v1/* served before the bus with its own cache headers (F15.S02.M01).
- Device key cryptography; signature verification is injected through SignatureVerifier (F16.S02.M03).
- Tenant status, tenant limits and LocalSettings including vaultId (F15.S04.M03 registers TenantPort with the bus and owns PLATFORM_TENANT_SUSPENDED; no depends_on edge, because F15.S04.M03 depends on this module through F15.S02.M01).
- The containment switch contract, the read-only sentinel <RELAY_DATA_DIR>/containment/read_only and its exemption list by exact command ID (F16.S03.M03 owns them and SECURITY_READ_ONLY_MODE; the relay composition registers ContainmentPort; no depends_on edge, because F16.S03.M03 reaches this module through F11.S03.M01 and F10.S01.M04).

## User stories

- As a feature developer, I declare a command with a strict zod input, a capability and a handler, and the bus enforces flags, authentication, validation, authorization, idempotency and audit for me.
- As a vault user who taps submit twice while offline, my retried command replays the first result instead of creating a duplicate.
- As a relay operator, I expose only relay commands over HTTP and every error my relay returns is a stable problem+json code with a correlation ID I can find in logs.
- As a client, I log in to a relay I chose by signing a fresh nonce with my device key, without any account password.

## Edge cases

- The same Idempotency-Key arrives twice concurrently; transactions are serialized so the handler runs once and the second call replays.
- The same key arrives with a different body; IDEMPOTENCY_KEY_REUSED is returned and nothing executes.
- A key or record ID carries a timestamp more than 24 h ahead of the receiver clock; ID_TIMESTAMP_SKEW is returned.
- A handler throws after writing records and emitting events; the transaction rolls back and the caller sees INTERNAL with a correlation ID only.
- A remote caller names a vault-only command; NOT_FOUND is returned so the vault surface is not enumerable.
- An idempotency record survives a restore from an older backup; it is ignored once its expiresAt has passed.
- A login nonce is replayed or used after 120 s; UNAUTHENTICATED is returned and the nonce stays consumed.
- The HTTP body is 300 KiB or not JSON; PAYLOAD_TOO_LARGE or PLATFORM_BUS_UNSUPPORTED_MEDIA_TYPE is returned before parsing.
- The relay is in read-only mode; bazaar.listing.publish returns SECURITY_READ_ONLY_MODE with 503 and Retry-After 300 without reaching its handler, while identity.session.revoke (exempt) and every query still run.
- A member writes to a relay tenant that its operator suspended; the TenantPort stage returns PLATFORM_TENANT_SUSPENDED after authentication, while reads of that tenant and writes to other tenants succeed.

## UX and accessibility



Headless kernel module. User-visible effects are the error message keys (error.<code>) rendered by CTR-UX-001 and the Idempotent-Replay header that lets the PWA outbox (F15.S01.M01) show pending versus confirmed states.

## Owned data

- `IdempotencyRecord` (classrup.platform.idempotency_record/v1, P2, RET-SHORT)

## Interfaces

- Commands: `platform.access_token.challenge`, `platform.access_token.login`, `platform.access_token.revoke`
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-ERR-001, CTR-EVT-001, CTR-IDM-001, CTR-CAP-001, CTR-FLG-001, CTR-SCH-001, CTR-OBS-001, CTR-PRV-001, CTR-TST-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-117-01 | [Domain schema](domain_schema.md) | 3 |
| PS-117-02 | [Validation rules](validation_rules.md) | 3 |
| PS-117-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-117-04 | [Commands, queries and events](commands_queries_events.md) | 7 |
| PS-117-05 | [Authorization and capabilities](authorization_capabilities.md) | 4 |
| PS-117-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-117-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-117-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-117-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-117-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/kernel/src/bus/index.ts`.

## Acceptance criteria

- All tests T01–T29 pass in CI on Node 22 and the isomorphic scan finds no node-scheme import in the core.
- No failure path leaves records, outbox events or idempotency records behind (T11, T25).
- A duplicate submission never executes twice within 24 h (T10, T12).
