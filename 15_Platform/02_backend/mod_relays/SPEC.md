# F15.S02.M01 — Relay service

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S02](../SPEC.md). **Process IDs:** PS-118-01…PS-118-10. **Code:** `apps/relay/src/relays`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The relay process (apps/relay) is an optional, self-hostable service that a user or community may choose to run and others may choose to use (ADR-0016). It is a Node >=22.18 program using node:http and node:sqlite that hosts relay commands only: indexing signed public projections, end-to-end encrypted mailboxes, content-free push, auction hosting, public media and federation. It has a self-certifying Ed25519 relay identity (relayId derived from the genesis key, rotations signed by the previous key, revocation from the local CLI) used to sign relay receipts (classrup.platform.relay_receipt/v1) and announcements, defines the canonical relayId, keyId and destination strings every vault uses, loads configuration from environment variables, enforces route-class body limits, drains in-flight requests for 10 s on shutdown, and runs a transactional outbox dispatcher for relay-local consumers. Relay roles come from F16.S01.M01 role assignments. It is never authoritative for a user's private records, never sees plaintext P2 or higher data, and stopping it leaves every vault intact. The static PWA host cannot be a relay; the relay is a separate deployment.

## Responsibilities

- [object Object]
- [object Object]
- Define the canonical identifiers used by every vault and relay module (relayId, keyId and destination strings) and issue signed relay receipts through ReceiptPort.issue for every route that accepts bytes for storage or forwarding.
- Serve the public media route GET /media/v1/sha256-<base64url> for P0 unencrypted F15.S02.M03 blobs with cache-friendly headers outside the command bus, and accept media uploads under the media body limit and the tenant maxUploadBytes reported by the TenantPort that F15.S04.M03 registers.
- Load and validate configuration from RELAY_* environment variables once at startup, failing fast with exit code 78 and a message that lists offending variable names but never values.
- [object Object]
- Record and publish the runtime risk that node:sqlite is stability 1.1 (active development) and keep the SQLite access behind the repository port of F15.S02.M03.

## Not responsible for

- Command and query registry, validation, idempotency, rate limits and error mapping (F15.S02.M02 mod_api).
- SQLite repository, migrations, blob storage and the in-memory test adapter (F15.S02.M03 mod_storage).
- Logging, metrics registry and health handlers (F15.S03.M01 mod_observability).
- Backups, the WAL archive and restore (F15.S03.M02 registers the pre-checkpoint hook; F15.S03.M03 writes restore announcements).
- Relay role assignments and authorization decisions (F16.S01.M01 RoleAssignment and authorize(); this module only names the roles its capabilities need).
- Tenant configuration and limits (F15.S04.M03 registers TenantPort with this process; no depends_on edge because F15.S04.M03 depends on this module for relay signing).
- User accounts, passwords or any server-held user secret; the relay has no account database (ADR-0016).
- Moderation decisions and relay access tokens (relay policy modules in F12 and F07.S01.M02 use this process but own their logic).
- Future: clustering several relay processes behind one database with a shared dispatcher lease; Future: HTTP/2 and built-in TLS termination (MVP expects a reverse proxy).

## User stories

- As a community organizer, I can start my own relay with a handful of environment variables, share its address, and my members' vaults can use it for discovery and mailboxes while keeping their records on their own devices.
- As a relay operator, I can stop the relay for maintenance without dropping in-flight requests, and members see their deliveries as pending rather than lost.
- As a member, I can verify a relay's identity and see that a receipt was signed by the relay I selected for exactly the bytes I sent, understanding that its timestamp only proves that relay's clock.
- As an operator, I can rotate the relay signing key without invalidating receipts issued earlier, and revoke a stolen key from the command line even though the thief may have signed a rotation.

## Edge cases

- Required configuration is missing or malformed (for example RELAY_PUBLIC_URL is http in production); the process exits with code 78 before opening the port and names the variable, never its value.
- The key file is missing but the database holds a RelayIdentity; startup refuses with PLATFORM_RELAY_IDENTITY_MISSING instead of silently generating a new identity; relay identity init --new-identity creates a new genesis key and therefore always a new relayId, and vaults treat it as a different relay.
- The active key is stolen; the operator runs relay identity revoke --reason compromised from the CLI (signed with the key itself or its pre-signed revocation certificate, no prior-key authorization needed, exempt from the 24 h limit), then relay identity init --new-identity; receipts by the revoked key stay valid only in vaults that stored them before revokedAt.
- The thief signs a rotation from the stolen key while the operator signs another one from the same previous key; vaults see two rotations with the same prevKeyId, treat it as equivocation and freeze that relay with a warning.
- SIGTERM arrives while a long request is in flight; the process stops accepting connections, finishes in-flight requests within 10 s, closes the rest, runs the pre-checkpoint hooks (final WAL archive), checkpoints the WAL with TRUNCATE only if every hook succeeded, and exits 0 (1 if requests were cut).
- A second SIGTERM or SIGINT arrives during drain; the process exits immediately with code 130 after closing the database handle, without TRUNCATE.
- Node version below 22.18 or without node:sqlite; startup exits 78 with the required version rather than failing later.
- An event consumer throws repeatedly; after 8 attempts the event moves to dead_letter with an error code and the dispatcher continues with other aggregates.
- Two relay processes are started on one database file; the second fails to acquire the dispatcher lease (30 s TTL) and exits with PLATFORM_RELAY_DUPLICATE_INSTANCE.
- A request arrives during drain; it is answered 503 PLATFORM_RELAY_DRAINING with Retry-After 5 and Connection close.
- A 300 KiB JSON body or a 6 MiB media upload arrives; both are refused with PAYLOAD_TOO_LARGE before reaching the bus, while a 4 MiB media upload within the tenant's maxUploadBytes is accepted.
- A client requests /media/v1/sha256-X for an encrypted or non-P0 blob; the route answers 404 exactly as for a missing blob.

## UX and accessibility



Headless service with an operator CLI. CLI commands: relay start, relay check-config, relay identity show, relay identity rotate, relay identity revoke --key <keyId> --reason compromised|lost|superseded, relay identity init --new-identity. The PWA shows relay name, identity fingerprint (first 16 hex of SHA-256 of the genesis public key, which is what relayId is derived from), key status and reachability in Settings > Relays (owned by the client relay-selection module).

## Owned data

- `RelayIdentity` (classrup.platform.relay_identity/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `platform.relay_identity.rotate`, `platform.relay_identity.revoke`
- Queries: `platform.relay_identity.get`, `platform.relay.get_status`
- Emits: `platform.relay_identity.rotated`
- Consumes: none

## Dependencies

F15.S02.M02, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-118-01 | [Domain schema](domain_schema.md) | 4 |
| PS-118-02 | [Validation rules](validation_rules.md) | 4 |
| PS-118-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-118-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-118-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-118-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-118-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-118-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-118-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-118-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/relay/src/relays/index.ts`.

## Acceptance criteria

- All tests T01-T26 pass in CI.
- The relay starts from environment variables alone, serves its identity and key history, and shuts down within the drain and hook budgets without losing in-flight committed work or unarchived WAL frames.
- No plaintext private user data and no private key material is ever stored in the database or logs, and no log line links a client address to a mailbox.
- Every receipt binds destination and the digest of the exact bytes and verifies against the published key history; a stolen key can be revoked from the CLI at once.
- Stopping or losing the relay loses no vault data; vault tests still pass with the relay stopped.
