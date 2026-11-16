# F17.S02.M03 — Offline testing

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S02](../SPEC.md). **Process IDs:** PS-140-01…PS-140-10. **Code:** `tests/offline`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Test suite for client offline behavior under ADR-0016: the PWA is local-first, so offline is the normal state and a relay is optional. It verifies that the core works with no relay configured, that the sync outbox moves statements through local committed, prepared, transport_acknowledged and peer_accepted without the UI claiming more, that conflicts and forks surface as prompts rather than silent overwrites, and that service worker caching never stores authenticated relay responses. It runs partly as vitest tests with a fake network and IndexedDB shim and partly through Playwright network emulation.

## Responsibilities

- Provide a controllable fake network (online, offline, latency 2 s, 30 percent packet loss, connection reset mid-request) for unit and integration tests of the outbox.
- Verify outbox behavior from CTR-IDM-001: queue order per entity, same Idempotency-Key on replay, backoff 1 s doubling to 60 s with jitter, and maximum 7 days before a queued command is marked stale.
- Verify conflict handling (IDM-5): CONFLICT_REVISION after reconnect surfaces a prompt offering keep mine, take theirs or merge, with no silent overwrite.
- Verify cache behavior: app shell available offline after first visit, authenticated APIs never served from cache, versioned cache cleanup on update.

## Not responsible for

- The outbox and service worker implementations (F15.S01.M01 and F15.S01.M02).
- General e2e journeys (F17.S01.M04).
- Server-side fault injection (F17.S02.M02).
- Future: background sync on iOS when the platform supports it.

## User stories

- As a user on a train, I create an offer offline, see it pending, and it is delivered once when I reconnect.
- As a user whose listing was edited on another device, I get a clear choice when my queued edit conflicts.
- As a developer, I run one command that proves cache and outbox behavior under flaky networks.

## Edge cases

- Connection drops after the server committed but before the response arrived; the replay returns the stored response and no duplicate is created.
- Two queued commands target the same entity; order is preserved and the second uses the revision from the first response.
- A queued command is older than 7 days; it is marked stale and the user is asked to review instead of replaying.
- The service worker caches an authenticated API response by mistake; the test asserts network-only for such routes.
- Storage quota is exceeded when queuing; the user is told and the command is not silently dropped.
- Browser reloads during replay; the outbox resumes from persisted state without double send.

## UX and accessibility



Headless tests that assert user-visible states: pending badge, retry banner, conflict dialog with three actions, stale-command review list, offline shell. They check accessible names and aria-live announcements.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-140-01 | [Domain schema](domain_schema.md) | 4 |
| PS-140-02 | [Validation rules](validation_rules.md) | 4 |
| PS-140-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-140-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-140-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-140-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-140-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-140-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-140-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-140-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `tests/offline/index.ts`.

## Acceptance criteria

- A command created offline is applied exactly once after reconnect, even across repeated connection resets.
- A stale revision conflict always shows the keep mine, take theirs and merge prompt and never overwrites silently.
- Authenticated API responses are never present in Cache Storage and caches are empty after logout.
- The app shell loads offline after first visit within the OBS-5 budget.
