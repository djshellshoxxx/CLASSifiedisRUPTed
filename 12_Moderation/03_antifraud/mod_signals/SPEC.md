# F12.S03.M02 — Fraud signals

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S03](../SPEC.md). **Process IDs:** PS-101-01…PS-101-10. **Code:** `packages/moderation/src/antifraud/signals`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Append-only ingestion of fraud and trust signals about a counterparty key, with weights and exponential decay. The same module runs in a user's vault (signals derived from that user's own verified dealings, such as no-shows and disputes) and on a relay (signals derived from what that relay hosts, such as spam detections, shill suspicions, enforcement actions, dismissed reports and module-reported patterns such as proximity query patterns recorded through the in-process SignalPort.record). Signals are observations, not findings: weights are small, the subject and source keys come only from fields the producing event carries, and corrections are new compensating signals. Nothing here is shared as a global reputation; each store keeps its own view, and a counterparty can never delete or change the signals another person's vault holds.

## Responsibilities

- Own the Signal record, append-only, with kind, weight, half-life, source event reference, source key and expiry.
- Map consumed events from other modules to signals through a fixed, versioned table (signals/3), deduplicated by source event ID, using only fields present in the producer payloads.
- Accept relay-local module signals in-process through SignalPort.record (moderation.signal.record_module) for the kinds of the module table (proximity_pattern from F06.S02.M03), so producers report patterns without emitting a catalog event.
- Compute decayed totals and per-kind counts per subject key on request and provide a read model for F12.S03.M01 and the report-class selector of F12.S03.M03.
- Accept manual signals from relay moderators or from the local user, always labelled manual with an author.
- Never edit or delete signals before expiry; corrections are compensating signals that reference the corrected one.

## Not responsible for

- Combining signals into risk levels (F12.S03.M01).
- Deciding or applying consequences (F12.S02.M01, F12.S03.M03 and F12.S03.M04).
- Producing the underlying events (auctions, commerce, comms, mutiny, rentals and moderation modules).
- Future: signed signal exchange between cooperating relays; privacy-preserving aggregate sharing.

## User stories

- As a user, I see on a counterparty's profile that 'two no-shows in the last 60 days are recorded in your own history', not a global score.
- As a relay moderator, I see the signals behind a case with their sources and decayed weights.
- As a user, I can add a private note-signal about a counterparty and remove its effect by adding a compensating signal.
- As a reporter whose reports a relay keeps dismissing, I am rate limited more strictly only after a clear threshold, and never for minor-safety reports.

## Edge cases

- The same source event is delivered twice; the unique source index makes the second ingestion a no-op.
- A dispute ends with refund_claimed accepted by every party; refund_agreed is recorded against the respondent of the dispute_opened signal with the same caseId; a no_fault_close or withdrawal compensates the dispute_opened signal instead; no outcome is read as one party 'losing'.
- A counterparty rotates keys; signals stay on the old key and are linked through the rotation statement, but only when the vault holds a verified rotation statement.
- The device clock is wrong; signal observedAt uses the store clock at ingestion and the event's claimed time is stored as a claim without affecting decay.
- One counterparty files many no-show reports about the same subject; only 3 per 30 days from that sourceKey count for scoring.
- A counterparty sends an account deletion tombstone and then reappears with a new key; the vault keeps its no-show signals about the old key until they expire, because only the local principal's own deletion removes vault signals.
- An action is overturned on appeal; a compensation signal cancels its report_actioned weight on the relay, while an action that simply expired keeps its decaying signal.
- An owner files a damage claim the renter has not answered yet; rentals.damage.claimed is an unanswered assertion and records nothing; only rentals.damage.resolved with outcome accepted, counter_accepted, refund_claimed or return_agreed records damage_agreed, and withdrawn or dispute_unresolved record nothing.
- A no-show report is contradicted by the accused's check-in statement after it was weighed; comms.meetup.no_show_contradicted records a compensation of that no_show signal, and a report that arrives already contradicted records nothing.
- An auction void confirmed by the host is recorded as a host-policy EnforcementAction; its moderation.action.applied records no report_actioned, because the void is weighed once through auctions.result.voided against the host-only subjectKeys (N22).
- F06.S02.M03 reports a proximity query pattern for an anonymous caller without a did:key; SignalPort.record refuses it with VALIDATION_FAILED and only the caller's rate-limit penalty applies.
- Signal volume exceeds 5 000 per subject key; older signals beyond decayed weight below 0.5 are summarized into a rollup signal and the originals are purged after expiry.

## UX and accessibility

- Trust panel on a counterparty profile: categories with counts for the last 90 days, an 'only based on your own history on this device' note, link to see details.
- Relay signal list for moderators: kind, source module, source key (pseudonymous), observed time (store clock), weight, decayed weight, compensating links.

**States:** loading; empty; populated; forbidden

**Accessibility:** Categories and counts are text lists with no meaning carried by color alone.; The list is a table with headers and sortable columns operable by keyboard.; Explanatory notes are available to screen readers via aria-describedby.

Headless service; surfaces are the profile trust panel (counts and categories of local signals, no scores shown here) and the relay moderator case view (signal list with source, kind, weight and decayed weight).

## Owned data

- `Signal` (classrup.moderation.signal/v1, P2, RET-SIGNAL)

## Interfaces

- Commands: `moderation.signal.record_manual`, `moderation.signal.record_module`
- Queries: `moderation.signal.list_for_subject`, `moderation.signal.summarize`, `moderation.signal.categories_own`
- Emits: `moderation.signal.recorded`
- Consumes: `moderation.spam.detected`, `auctions.shill.suspected`, `auctions.result.voided`, `commerce.dispute.opened`, `commerce.dispute.resolved`, `commerce.dispute.withdrawn`, `commerce.payment.disputed`, `commerce.payment.expired`, `commerce.deal.completed`, `comms.meetup.no_show`, `comms.meetup.no_show_contradicted`, `mutiny.cycle.participant_dropped`, `rentals.damage.resolved`, `moderation.action.applied`, `moderation.action.reverted`, `moderation.report.dismissed`, `privacy.deletion.completed`

## Dependencies

F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-101-01 | [Domain schema](domain_schema.md) | 4 |
| PS-101-02 | [Validation rules](validation_rules.md) | 4 |
| PS-101-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-101-04 | [Commands, queries and events](commands_queries_events.md) | 7 |
| PS-101-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-101-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-101-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-101-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-101-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-101-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/antifraud/signals/index.ts`.

## Acceptance criteria

- All tests T01–T21 pass in CI.
- No signal row is ever modified before expiry, and no counterparty action removes signals from another person's vault.
- Decayed totals match the closed-form formula within 1e-9 in property tests.
