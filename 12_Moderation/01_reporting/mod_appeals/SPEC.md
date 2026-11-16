# F12.S01.M03 — Appeals

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S01](../SPEC.md). **Process IDs:** PS-092-01…PS-092-10. **Code:** `packages/moderation/src/reporting/appeals`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A person affected by a relay's moderation action (content removed from that relay's index, feature restricted, relay access suspended, warning) can appeal to that same relay once per action within 30 days of the signed statement of reasons. The appeal is a signed statement from the appellant's vault. The relay assigns a reviewer who is not the moderator who decided, and returns a signed decision with reasons. The appeal covers only that relay's hosting decision; it cannot restore the person's local records, other relays' decisions or copies other vaults already hold.

## Responsibilities

- Own the Appeal record (relay copy and the appellant's vault copy) from filing to a signed decision.
- Enforce one appeal per action, a 30-day window measured from the relay-signed statement of reasons time, and reviewer independence.
- Assign reviewers automatically from relay moderators other than the original decider and keep an auditable queue with a 14-day decision target.
- Return a relay-signed decision statement that states outcome, policy rule IDs and reasoning, and trigger revert of the action on overturn.

## Not responsible for

- Applying or reverting actions (F12.S02.M01 consumes the decision event).
- Evidence storage and viewing rules (F12.S01.M02).
- Disputes between deal parties (F09.S02.M02).
- Future: independent external review bodies; cross-relay appeal escalation; appeals of dismissed reports by reporters.

## User stories

- As a member whose listing was removed from a relay's index, I can appeal with my explanation and see the evidence the relay relied on.
- As a relay moderator, I review appeals on decisions made by colleagues and record a reasoned decision with policy rule IDs.
- As a member, I get a signed decision I can keep and show to anyone, including when I move to another relay.

## Edge cases

- Appeal is filed on day 31; refused with MODERATION_APPEAL_WINDOW_CLOSED, and the notice explains the relay's contact route for exceptional requests.
- A second appeal is filed for the same action; refused with MODERATION_APPEAL_DUPLICATE and returns the existing appeal.
- The relay has only one moderator; the appeal stays awaiting_reviewer, the appellant is told honestly that no independent reviewer exists on that relay, and may export the full appeal packet to take elsewhere.
- The deciding moderator is removed from the role and a new moderator is added; the new one may review because reviewer independence is checked against decider key, not role history.
- The appellant's vault was offline at filing; the appeal queues in the sync outbox and the 30-day window is measured against the relay-signed receipt time of the statement of reasons plus a 7-day grace for offline devices only if the appellant's signed statement predates the window end by its own clock claim.
- The action was already reverted by the moderator before the appeal; the appeal is closed as moot with outcome overturned and a decision notice.
- A decision statement arrives with an invalid relay signature; the vault quarantines it and keeps the appeal at transport_acknowledged.

## UX and accessibility

- Statement of reasons screen: action, rule IDs and text, facts summary, 'Appeal this decision' button with deadline date and remaining days (deadline computed from the relay-signed time).
- Appeal form: statement of up to 2000 characters, optional supporting files (max 3, 5 MiB each), review of the evidence snapshot, submit.
- Appeal status timeline: Saved on this device, Sent to relay, Assigned to a reviewer, Decided, each with whose clock the time comes from.
- Moderator appeal queue: oldest first, deadline badges, reviewer-independence indicator.

**States:** loading; draft; saved-locally; sent; awaiting-reviewer; in-review; decided-upheld; decided-overturned; decided-reduced; window-closed; withdrawn

**Accessibility:** Deadline is shown as a date and relative text and is announced by screen readers, not by color alone.; Form errors are linked to fields with aria-describedby and announced in an aria-live region.; Controls are at least 44 by 44 px and the timeline is a semantic ordered list.

## Owned data

- `Appeal` (classrup.moderation.appeal/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `moderation.appeal.file`, `moderation.appeal.receive`, `moderation.appeal.decide`, `moderation.appeal.withdraw`
- Queries: `moderation.appeal.get_mine`, `moderation.appeal.list_queue`
- Emits: `moderation.appeal.filed`, `moderation.appeal.decided`
- Consumes: `moderation.action.applied`, `moderation.action.reverted`

## Dependencies

F12.S02.M01, F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-092-01 | [Domain schema](domain_schema.md) | 3 |
| PS-092-02 | [Validation rules](validation_rules.md) | 3 |
| PS-092-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-092-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-092-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-092-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-092-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-092-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-092-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-092-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/reporting/appeals/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No appeal is ever decided by the moderator who made the original decision (property and abuse tests).
- The 30-day window is always computed from the relay-signed statement time.
