# F15.S02.M01 — Relay service

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S02](../SPEC.md). **Process IDs:** PS-118-01…PS-118-10. **Code:** `apps/relay/src/relays`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The relay process (apps/relay) is an optional, self-hostable service that a user or community may choose to run and others may choose to use (ADR-0016). It is a Node >=22.18 program using node:http and node:sqlite that hosts relay commands only: indexing signed public projections, end-to-end encrypted mailboxes, content-free push, auction hosting and federation. It has an Ed25519 relay identity used to sign receipts and announcements, loads configuration from environment variables, drains in-flight requests for 10 s on shutdown, and runs a transactional outbox dispatcher for relay-local consumers. It is never authoritative for a user's private records, never sees plaintext P2 or higher data, and stopping it leaves every vault intact. The static PWA host cannot be a relay; the relay is a separate deployment.

## Responsibilities

- [object Object]
- [object Object]
- Load and validate configuration from RELAY_* environment variables once at startup, failing fast with exit code 78 and a message that lists offending variable names but never values.
- [object Object]
- Sign relay receipts (statement cid, relay id, receipt time) so vaults can use them as evidence of delivery to this relay and of this relay's clock only.
- Record and publish the runtime risk that node:sqlite is stability 1.1 (active development) and keep the SQLite access behind the repository port of F15.S02.M03.

## Not responsible for

- Command and query registry, validation, idempotency, rate limits and error mapping (F15.S02.M02 mod_api).
- SQLite repository, migrations and the in-memory test adapter (F15.S02.M03 mod_storage).
- Logging, metrics registry and health handlers (F15.S03.M01 mod_observability).
- Backups and restore (F15.S03.M02, F15.S03.M03).
- User accounts, passwords or any server-held user secret; the relay has no account database (ADR-0016).
- Moderation decisions and relay access tokens (relay policy modules in F12 and F16 use this process but own their logic).
- Future: clustering several relay processes behind one database with a shared dispatcher lease; Future: HTTP/2 and built-in TLS termination (MVP expects a reverse proxy).

## User stories

- As a community organizer, I can start my own relay with a handful of environment variables, share its address, and my members' vaults can use it for discovery and mailboxes while keeping their records on their own devices.
- As a relay operator, I can stop the relay for maintenance without dropping in-flight requests, and members see their deliveries as pending rather than lost.
- As a member, I can verify a relay's identity and see that a receipt was signed by the relay I selected, understanding that its timestamp only proves that relay's clock.
- As an operator, I can rotate the relay signing key without invalidating receipts issued earlier.

## Edge cases

- Required configuration is missing or malformed (for example RELAY_PUBLIC_URL is http in production); the process exits with code 78 before opening the port and names the variable, never its value.
- The key file is missing but the database holds a RelayIdentity; startup refuses with PLATFORM_RELAY_IDENTITY_MISSING instead of silently generating a new identity that would break receipts, unless the operator passes --accept-new-identity.
- SIGTERM arrives while a long request is in flight; the process stops accepting connections, finishes in-flight requests within 10 s, closes the rest, checkpoints the WAL and exits 0 (1 if requests were cut).
- A second SIGTERM or SIGINT arrives during drain; the process exits immediately with code 130 after closing the database handle.
- Node version below 22.18 or without node:sqlite; startup exits 78 with the required version rather than failing later.
- An event consumer throws repeatedly; after 8 attempts the event moves to dead_letter with an error code and the dispatcher continues with other aggregates.
- Two relay processes are started on one database file; the second fails to acquire the dispatcher lease (30 s TTL) and exits with PLATFORM_RELAY_DUPLICATE_INSTANCE.
- A request arrives during drain; it is answered 503 PLATFORM_RELAY_DRAINING with Retry-After 5 and Connection close.

## UX and accessibility



Headless service with an operator CLI. CLI commands: relay start, relay check-config, relay identity show, relay identity rotate. The PWA shows relay name, identity fingerprint (first 16 hex of SHA-256 of the public key) and reachability in Settings > Relays (owned by the client relay-selection module).

## Owned data

- `RelayIdentity` (classrup.platform.relay_identity/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `platform.relay_identity.rotate`
- Queries: `platform.relay_identity.get`, `platform.relay.get_status`
- Emits: `platform.relay_identity.rotated`
- Consumes: none

## Dependencies

F15.S02.M02, F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-118-01 | [Domain schema](domain_schema.md) | 3 |
| PS-118-02 | [Validation rules](validation_rules.md) | 3 |
| PS-118-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-118-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-118-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-118-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-118-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-118-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-118-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-118-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/relay/src/relays/index.ts`.

## Acceptance criteria

- All tests T01-T18 pass in CI.
- The relay starts from environment variables alone, serves its identity, and shuts down within 10 s without losing in-flight committed work.
- No plaintext private user data and no private key material is ever stored in the database or logs.
- Stopping or losing the relay loses no vault data; vault tests still pass with the relay stopped.
