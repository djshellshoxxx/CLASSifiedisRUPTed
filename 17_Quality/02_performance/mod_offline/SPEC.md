# F17.S02.M03 — Offline testing

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S02](../SPEC.md). **Process IDs:** PS-140-01…PS-140-10. **Code:** `tests/offline`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Test suite for client offline behavior under ADR-0016: the PWA is local-first, so offline is the normal state and a relay is optional. It verifies, against the owner F15.S01.M01 (N24), that the core works with no relay configured, that each locally committed record's OutboxEntry moves through prepared, sending, transport_acknowledged and peer_accepted (plus conflict, failed, expired and discarded) with labels never stronger than the reached state, that retries follow CTR-IDM-001 IDM-4, that conflicts surface as the resolve-or-discard dialog and forks freeze the coordination, that vault lock keeps data encrypted and queued work intact, and that service worker caching never stores relay-authenticated responses. It runs partly as vitest tests with a fake network and IndexedDB shim and partly through Playwright network emulation.

## Responsibilities

- Provide a controllable fake network (online, offline, latency 2 s, 30 percent packet loss, connection reset mid-request) for unit and integration tests of the outbox.
- Verify the F15.S01.M01 outbox behavior (CTR-IDM-001 IDM-4, IDM-5, IDM-7): delivery in seq order per destination and aggregateKey, the original cid (statements) or Idempotency-Key (relay commands) on every resend, IDM-4 retry (full jitter, base 500 ms, cap 30 s, retryAfterMs honoured, 6 attempts then failed with failureReason retry_exhausted, Retry now resets attempts), the day-6 expiry prompt and expiry at 7 days, and the 200-entry and 5 MiB per-principal caps (PLATFORM_OUTBOX_FULL).
- Verify conflict handling (IDM-5, F15.S01.M01): CONFLICT_REVISION or a peer rejection after reconnect surfaces the conflict dialog with exactly the actions Prepare a new version on theirs and Discard mine (plus Change relay in the outbox sheet); no option overwrites the peer's signed revision and nothing is auto-merged; two conflicting signed promises (a fork) freeze the coordination with no resolve option (ADR-0016 section 5).
- Verify cache behavior: app shell available offline after first visit, relay-authenticated responses never served from or stored in Cache Storage, versioned cache cleanup on update.
- Verify vault lock and principal switch (F07.S01.M02, F15.S01.M02): in-memory keys are dropped, the IndexedDB vault stays encrypted and unreadable until unlock, OutboxEntry rows are kept but not sent, relay access tokens are dropped and the image partition is unbound; unlocking restores everything with zero entries lost; only Erase vault (F10.S01.M04) after an export prompt deletes vault data.

## Not responsible for

- The outbox and service worker implementations (F15.S01.M01 and F15.S01.M02).
- General e2e journeys (F17.S01.M04).
- Server-side fault injection (F17.S02.M02).
- Receiver-side verification and quarantine of statements (F11.S01.M02); this suite only checks that the sender's entry shows the reported rejection.
- Deleting vault data (F10.S01.M04 deletion flow behind Erase vault); this suite only proves lock and switch never delete.
- Future: background sync on iOS when the platform supports it.

## User stories

- As a user on a train, I create an offer offline, see it as Saved on this device, and after I reconnect it reaches the relay and the seller's vault applies it once.
- As a user who locks my vault on a shared phone, my records stay encrypted and my queued statements wait, unsent, until I unlock again.
- As a user whose listing was edited on another device, I get a clear choice when my queued edit conflicts.
- As a developer, I run one command that proves cache and outbox behavior under flaky networks.

## Edge cases

- Connection drops after the relay committed but before the response arrived; a relay command resend returns the stored response under its Idempotency-Key and a statement resend is ignored as a duplicate cid, so no duplicate is created.
- Two queued commands target the same entity; order is preserved and the second uses the revision from the first response.
- An unsent entry reaches day 6; the expiry prompt lists it with Send now, Keep until expiry and Discard; at 7 days it moves to expired with its payload erased, is never sent, and a send attempt is refused with EXPIRED.
- The service worker caches a relay-authenticated response by mistake; the test asserts network-only for such routes.
- Storage quota is exceeded when queuing; the user is told and the command is not silently dropped.
- The 201st entry, or one that would push queued payload past 5 MiB for the principal, is refused with PLATFORM_OUTBOX_FULL and shown to the user.
- The vault locks with three entries queued; keys leave memory, records stay encrypted, entries are kept but not sent, relay access tokens are dropped and the image partition is unbound; unlocking restores everything and sending resumes with zero entries lost.
- Two conflicting signed promises (a fork) arrive for one coordination; it is frozen and the dialog offers no option that picks a winner.
- Browser reloads during replay; the outbox resumes from persisted state without double send.

## UX and accessibility



Headless tests that assert user-visible states: the sync status chip with the F15.S01.M01 labels (Saved on this device, Delivered to relay, peer has not confirmed, Confirmed by peer, Needs attention), the failure banner with Retry now, the conflict dialog with exactly Prepare a new version on theirs and Discard mine, the day-6 expiry prompt, the lock screen and the offline shell. They check accessible names and aria-live announcements.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02, F15.S02.M03, F07.S01.M02, F10.S01.M04, F11.S01.M02, CTR-PRV-001, CTR-CAP-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-140-01 | [Domain schema](domain_schema.md) | 4 |
| PS-140-02 | [Validation rules](validation_rules.md) | 5 |
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

- An offer created offline is applied exactly once by the receiving vault after reconnect, even across repeated connection resets.
- A revision conflict shows exactly Prepare a new version on theirs and Discard mine, never overwrites the peer's signed revision, and a fork freezes the coordination.
- Relay-authenticated responses are never present in Cache Storage, vault lock keeps data encrypted and queued entries intact, and only Erase vault after an export prompt deletes vault data.
- Retry timing follows IDM-4 exactly and unsent entries expire at 7 days after the day-6 prompt.
- The app shell loads offline after first visit within the OBS-5 budget.
