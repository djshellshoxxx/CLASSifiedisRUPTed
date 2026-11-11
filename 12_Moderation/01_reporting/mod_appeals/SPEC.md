# F12.S01.M03 — Appeals

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S01](../SPEC.md). **Process IDs:** PS-092-01…PS-092-10. **Code:** `packages/moderation/src/reporting/appeals`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A person affected by a relay's moderation action (content removed from that relay's index, feature restricted, relay access suspended, warning) can appeal to that same relay once per action within 30 days of the relay-signed statement of reasons, measured on the relay's clock. The appeal is a signed statement from the appellant's vault, bound to that relay, and it stays possible while the key is suspended or restricted on the relay. The relay assigns a reviewer whose principal is neither the decider, the subject nor a reporter of the case, reassigns when the reviewer becomes unavailable, and returns a decision signed by the relay key only, so the reviewer stays anonymous. An appeal on an action that a moderator reverts or that expires first closes as moot, never as overturned. The appeal covers only that relay's hosting decision; it cannot restore the person's local records, other relays' decisions or copies other vaults already hold.

## Responsibilities

- Own the Appeal record (relay copy and the appellant's vault copy) from filing to a signed decision, withdrawal or moot closure.
- Enforce one appeal per action, a 30-day window measured from the relay-signed statement of reasons time against the relay's receive time, and reviewer independence by principal.
- Assign reviewers automatically from relay moderators whose principal differs from the decider, the subject and every reporter of linked reports, reassign on role loss, operator request or the day-10 escalation, and keep an auditable queue with a 14-day decision target.
- Return relay-signed receipt, status, decision and moot statements (relay key only); a decision states outcome, policy rule IDs, reasoning and, for reduced, the typed replacement, and triggers revert or replacement of the action.
- Verify relay statements in the appellant's vault and derive the local moderation.appeal.decided event (EVT-9).

## Not responsible for

- Applying, reverting or replacing actions (F12.S02.M01 consumes the decided event).
- Evidence storage and viewing rules (F12.S01.M02).
- Report intake and the report ledger used for conflict checks (F12.S01.M01).
- Disputes between deal parties (F09.S02.M02).
- Future: independent external review bodies; cross-relay appeal escalation; appeals of dismissed reports by reporters.

## User stories

- As a member whose listing was removed from a relay's index, I can appeal with my explanation and see the evidence the relay relied on, even while my key is suspended on that relay.
- As a relay moderator, I review appeals on decisions made by colleagues and record a reasoned decision with policy rule IDs, without my key being revealed to the appellant.
- As a member, I get a decision signed by the relay that I can keep and show to anyone, including when I move to another relay.
- As a member whose contested action was lifted or expired before review, I am told the appeal closed as moot and why, not that I won.

## Edge cases

- Appeal reaches the relay on day 31; refused with MODERATION_APPEAL_WINDOW_CLOSED, and the notice explains the relay's contact route for exceptional requests.
- The appellant's vault was offline; the window is measured by the relay's receive time against deadlineAt and the appellant's createdAt is ignored, so an appeal arriving on day 32 with createdAt backdated to day 29 is refused with MODERATION_APPEAL_WINDOW_CLOSED.
- The first delivery reached the relay on day 29 but the receipt was lost; the retry on day 32 with the same appealId and statement digest returns the stored signed receipt.
- A second appeal is filed for the same action; refused with MODERATION_APPEAL_DUPLICATE and returns the existing appeal.
- The relay has only one moderator, or every other moderator is linked to the decider, subject or a reporter; the appeal stays awaiting_reviewer, the appellant is told honestly that no independent reviewer exists on that relay, and may export the full appeal packet to take elsewhere.
- The assigned reviewer loses the moderator role or stops responding; the appeal returns to awaiting_reviewer by role revocation, operator reassignment or the day-10 escalation and is assigned to another eligible reviewer.
- A moderator holds a second device key listed in the decider's key set; that moderator is not eligible because independence is checked by principal, not by single key.
- A moderator reverts the action before the appeal is decided; the appeal closes as moot with mootReason action_reverted and a relay-signed moot notice; no decided event is emitted, so nothing is reverted twice.
- The action expires before the appeal is decided; the appeal closes as moot with mootReason action_expired and is never labelled overturned.
- A decision statement arrives with an invalid relay signature; the vault quarantines it and keeps the appeal at its previous state.
- A forwarded appeal statement reaches another relay; it is refused because the signed relayId is not that relay's DID.

## UX and accessibility

- Statement of reasons screen: action, rule IDs and text, facts summary, 'Appeal this decision' button with deadline date and remaining days (deadline computed from the relay-signed time; the note says the relay's receive time decides).
- Appeal form: statement of up to 2000 characters, optional supporting files (max 3, 5 MiB each), review of the evidence snapshot, submit.
- Appeal status timeline: Saved on this device, Sent to relay, Relay acknowledged, Waiting for a reviewer, In review, Decided or Closed as moot, each with whose clock the time comes from; the reviewer is shown only as 'a moderator who did not make the original decision'.
- Moderator appeal queue: oldest first, deadline badges, reviewer-independence indicator, escalation badge at day 10; operators see a Reassign action.

**States:** loading; draft; saved-locally; sent; acknowledged; awaiting-reviewer; in-review; decided-upheld; decided-overturned; decided-reduced; moot; window-closed; withdrawn; quarantined-statement

**Accessibility:** Deadline is shown as a date and relative text and is announced by screen readers, not by color alone.; Form errors are linked to fields with aria-describedby and announced in an aria-live region.; Controls are at least 44 by 44 px and the timeline is a semantic ordered list.

## Owned data

- `Appeal` (classrup.moderation.appeal/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `moderation.appeal.file`, `moderation.appeal.receive`, `moderation.appeal.decide`, `moderation.appeal.reassign`, `moderation.appeal.withdraw`, `moderation.appeal.receive_relay_statement`
- Queries: `moderation.appeal.get_mine`, `moderation.appeal.status_for_appellant`, `moderation.appeal.list_queue`
- Emits: `moderation.appeal.filed`, `moderation.appeal.decided`
- Consumes: `moderation.action.applied`, `moderation.action.reverted`, `security.role.revoked`, `privacy.deletion.completed`

## Dependencies

F12.S02.M01, F12.S01.M01, F12.S01.M02, F12.S02.M03, F07.S02.M01, F08.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-092-01 | [Domain schema](domain_schema.md) | 4 |
| PS-092-02 | [Validation rules](validation_rules.md) | 4 |
| PS-092-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-092-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-092-05 | [Authorization and capabilities](authorization_capabilities.md) | 5 |
| PS-092-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-092-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-092-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-092-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-092-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/reporting/appeals/index.ts`.

## Acceptance criteria

- All tests T01–T24 pass in CI.
- No appeal is ever decided by a moderator whose principal made the original decision, is the subject or reported the case (property and abuse tests).
- The 30-day window is always computed from the relay-signed statement time against the relay's receive time, and expiry or a moderator revert never shows the appellant an overturned outcome.
