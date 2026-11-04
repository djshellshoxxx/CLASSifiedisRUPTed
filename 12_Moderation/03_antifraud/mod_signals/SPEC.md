# F12.S03.M02 — Fraud signals

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S03](../SPEC.md). **Process IDs:** PS-101-01…PS-101-10. **Code:** `packages/moderation/src/antifraud/signals`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Append-only ingestion of fraud and trust signals about a counterparty key, with weights and exponential decay. The same module runs in a user's vault (signals derived from that user's own verified dealings, such as no-shows and disputes) and on a relay (signals derived from what that relay hosts, such as spam detections and shill suspicions). Signals are observations, not findings: weights are small, sources are recorded, and corrections are new compensating signals. Nothing here is shared as a global reputation; each store keeps its own view.

## Responsibilities

- Own the Signal record, append-only, with kind, weight, half-life, source event reference and expiry.
- Map consumed events from other modules to signals through a fixed, versioned table, deduplicated by source event ID.
- Compute decayed totals per subject key on request and provide a read model for F12.S03.M01.
- Accept manual signals from relay moderators or from the local user, always labelled manual with an author.
- Never edit or delete signals before expiry; corrections are compensating signals that reference the corrected one.

## Not responsible for

- Combining signals into risk levels (F12.S03.M01).
- Deciding or applying consequences (F12.S02.M01 and F12.S03.M04).
- Producing the underlying events (auctions, commerce, comms, mutiny modules).
- Future: signed signal exchange between cooperating relays; privacy-preserving aggregate sharing.

## User stories

- As a user, I see on a counterparty's profile that 'two no-shows in the last 60 days are recorded in your own history', not a global score.
- As a relay moderator, I see the signals behind a case with their sources and decayed weights.
- As a user, I can add a private note-signal about a counterparty and remove its effect by adding a compensating signal.

## Edge cases

- The same source event is delivered twice; the unique source index makes the second ingestion a no-op.
- A dispute opened by a party is later resolved in the other party's favor; a compensating signal cancels the original weight and both stay visible.
- A counterparty rotates keys; signals stay on the old key and are linked through the rotation statement, but only when the vault holds a verified rotation statement.
- The device clock is wrong; signal observedAt uses the store clock at ingestion and the event's claimed time is stored as a claim without affecting decay.
- A flood of signals about one key from a malicious relay feed; only signals derived from local verified events count, and manual or imported ones have a per-source weight cap of 20.
- Signal volume exceeds 5 000 per subject key; older signals beyond decayed weight below 0.5 are summarized into a rollup signal and the originals are purged after expiry.

## UX and accessibility

- Trust panel on a counterparty profile: categories with counts for the last 90 days, an 'only based on your own history on this device' note, link to see details.
- Relay signal list for moderators: kind, source module, observed time (store clock), weight, decayed weight, compensating links.

**States:** loading; empty; populated; forbidden

**Accessibility:** Categories and counts are text lists with no meaning carried by color alone.; The list is a table with headers and sortable columns operable by keyboard.; Explanatory notes are available to screen readers via aria-describedby.

Headless service; surfaces are the profile trust panel (counts and categories of local signals, no scores shown here) and the relay moderator case view (signal list with source, kind, weight and decayed weight).

## Owned data

- `Signal` (classrup.moderation.signal/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `moderation.signal.record_manual`
- Queries: `moderation.signal.list_for_subject`, `moderation.signal.summarize`, `moderation.signal.categories_own`
- Emits: `moderation.signal.recorded`
- Consumes: `moderation.spam.detected`, `auctions.shill.suspected`, `auctions.result.voided`, `commerce.dispute.opened`, `commerce.dispute.resolved`, `commerce.payment.disputed`, `commerce.payment.expired`, `commerce.deal.completed`, `comms.meetup.no_show`, `mutiny.cycle.participant_dropped`, `rentals.damage.claimed`, `moderation.action.applied`

## Dependencies

F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-101-01 | [Domain schema](domain_schema.md) | 3 |
| PS-101-02 | [Validation rules](validation_rules.md) | 3 |
| PS-101-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-101-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-101-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-101-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-101-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-101-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-101-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-101-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/antifraud/signals/index.ts`.

## Acceptance criteria

- All tests T01–T13 pass in CI.
- No signal row is ever modified or deleted before expiry.
- Decayed totals match the closed-form formula within 1e-9 in property tests.
