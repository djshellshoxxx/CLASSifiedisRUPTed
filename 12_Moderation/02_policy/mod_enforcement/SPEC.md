# F12.S02.M01 — Enforcement actions

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S02](../SPEC.md). **Process IDs:** PS-096-01…PS-096-10. **Code:** `packages/moderation/src/policy/enforcement`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Relay-side moderation. Moderators of one relay work a case queue built from received reports, spam detections, shill suspicions, high risk levels, operator-opened cases and host-policy records from hosting modules (an auction void confirmed by two host moderators in F04.S02.M03), and apply actions that affect only what that relay hosts: remove content from the relay's index, restrict a relay feature for a key, suspend a key's access to the relay, or warn. A case can carry several actions. Every action carries policy rule IDs in force at decision time and a relay-signed statement of reasons delivered to the affected key's mailbox, with an appeal route and an expiry. The only statement that goes beyond the subject is an opt-in, expiring advisory that other relays and vaults apply only under their own policy or subscription; moderation never issues federation tombstones. There is no global suspension or takedown: copies in other vaults and on other relays are outside this module, and statements say so. The subject's vault verifies received statements and derives its own local events; users' local records are never touched.

## Responsibilities

- Own ModerationCase and EnforcementAction records on the relay, with case assignment, notes and closure, and the subject's verified copy of their own actions in the vault.
- Open cases from received reports (moderation.report.received), spam detections, shill suspicions, high risk levels and the operator command, and merge new reports about the same target into the open case.
- Apply relay-scoped actions (warn, remove from index, restrict feature, suspend relay access) with rule IDs, facts summary and expiry, never silently, several per case when needed.
- Produce and deliver the relay-signed statement of reasons (classrup.moderation.reasons/v1) and optionally an expiring advisory (classrup.moderation.advisory/v1) others may subscribe to.
- Revert actions on moderator decision, expiry or appeal overturn, replace them on an appeal outcome reduced, and publish the reversal and the advisory retraction.
- Verify received statements of reasons and reversals in the subject's vault and derive local moderation.action.applied and moderation.action.reverted events (EVT-9).
- Record host-policy EnforcementActions for hosting modules in-process through moderation.action.record_host_policy (auction voids from F04.S02.M03), opening a case with source auction_review when none is open for the auction and returning the actionId, so the void carries a statement of reasons and is appealable through F12.S01.M03.

## Not responsible for

- Policy rule text (F12.S02.M03); spam heuristics (F12.S02.M02); risk scoring (F12.S03.M01).
- Appeals handling and reviewer assignment (F12.S01.M03).
- Report intake, reporter statements and the report ledger (F12.S01.M01).
- Local hide and block in a user's vault (F12.S01.M01 and F07.S02.M02).
- Search index storage (F06.S01.M01 removes only the document named by targetRef when it consumes moderation.action.applied); relay-hosted profile copies (F07.S02.M02 stops serving its relay copy in relay runtime).
- Auction review, void decisions and void statements (F04.S02.M03); this module only records the host-policy action and its statement of reasons.
- Global takedown, global suspension, federation tombstones or any effect on other relays or vaults; those do not exist in this architecture.
- Future: shared moderation queues between cooperating relays; transparency export per action (F18.S02.M02 consumes aggregate counts only).

## User stories

- As a relay moderator, I see one case per reported target with all reasons and evidence snapshots, and I apply one or more actions citing the rules they violate.
- As a member, I receive a signed statement saying what happened to my content on that relay, which rule applied, what I can do, and until when, and my vault keeps it even if the relay goes away.
- As a relay operator, I can open a case about an account, see every action and who decided it, and revert mistakes; reversals are published with the same transparency.

## Edge cases

- Two moderators apply conflicting actions to the same case at once; the second returns CONFLICT_REVISION and sees the first action.
- The target is already deleted by its author before the action; the case closes with outcome content_removed_by_owner and no action is recorded.
- Suspend access is requested for a key that is the relay's only admin; refused with MODERATION_LAST_ADMIN_PROTECTED.
- The subject's mailbox is unreachable; the statement of reasons is stored for retrieval and the action stays pending_notice until the mailbox acknowledges it or 24 h pass, except for imminent-harm rules where effect is immediate and notice follows.
- A permanent suspension is attempted by a moderator; only an operator can apply it, and an expiry of at most 90 days applies for moderators.
- Removal from the index is applied but a federation peer already holds a copy; no tombstone is sent, the optional advisory is only advice for subscribers, and the statement of reasons says copies already fetched cannot be recalled.
- A key is restricted on the relay and moves to another relay; the action has no effect there, and the old relay's advisory is only advice.
- A moderator cites a rule version that is published but scheduled for next week; refused with MODERATION_RULE_REQUIRED because the version is not yet in force.
- A suspended key wants to appeal; appeal filing, own-action reads and own-evidence reads stay allowed and cannot be listed as restricted capabilities.
- F04.S02.M03 confirms an auction void while a report case about the same auction is open; record_host_policy attaches to that case instead of opening a second one, records the action with source auction_review and returns its actionId; a retry with the same reviewId returns the same actionId.
- An auction document was already removed from the relay index at close; the host-policy remove_from_index is still recorded with its statement of reasons, and its index effect is a no-op.

## UX and accessibility

- Case queue: filter by status, source, reason, age, assignee; deadline and appeal badges; reporter identities hidden unless the case view is opened.
- Case view: reports grouped by target, evidence snapshots (F12.S01.M02), signals summary, rule picker showing only versions in force, list of actions already applied on the case, action form with expiry and facts summary, close case with outcome.
- Operator 'Open case' form: subject key, target type (including account), target id, reason, optional snapshots.
- Action confirmation dialog: preview of the statement of reasons exactly as the subject will see it.
- Subject notice: signed statement of reasons with rule IDs, plain-language explanation, 'what this does not affect', appeal button and deadline.

**States:** loading; empty-queue; assigned; deciding; pending-notice; applied; reverted; expired; conflict

**Accessibility:** Queue and action forms are fully keyboard operable with visible focus.; Status changes are announced in an aria-live polite region.; Destructive actions use buttons of at least 44 by 44 px with confirmation naming the action and the rule.

## Owned data

- `ModerationCase` (classrup.moderation.case/v1, P2, RET-EVIDENCE)
- `EnforcementAction` (classrup.moderation.enforcementaction/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `moderation.case.open`, `moderation.case.assign`, `moderation.case.close`, `moderation.action.apply`, `moderation.action.record_host_policy`, `moderation.action.revert`, `moderation.action.receive`
- Queries: `moderation.case.list`, `moderation.action.get_mine`, `moderation.action.list_active_for_key`
- Emits: `moderation.case.opened`, `moderation.case.closed`, `moderation.action.applied`, `moderation.action.reverted`
- Consumes: `moderation.report.received`, `moderation.spam.detected`, `auctions.shill.suspected`, `moderation.appeal.decided`, `governance.prohibited_rule.changed`, `moderation.risk.elevated`, `privacy.deletion.completed`

## Dependencies

F12.S02.M03, F12.S01.M01, F12.S01.M02, F12.S03.M03, F06.S01.M01, F08.S01.M01, F07.S02.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-096-01 | [Domain schema](domain_schema.md) | 6 |
| PS-096-02 | [Validation rules](validation_rules.md) | 5 |
| PS-096-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-096-04 | [Commands, queries and events](commands_queries_events.md) | 8 |
| PS-096-05 | [Authorization and capabilities](authorization_capabilities.md) | 6 |
| PS-096-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-096-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-096-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-096-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-096-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/policy/enforcement/index.ts`.

## Acceptance criteria

- All tests T01–T31 pass in CI.
- No action exists without in-force rule IDs, facts summary and a retrievable signed statement of reasons.
- No moderation path produces any effect outside the issuing relay, and no federation tombstone is ever produced; statements say so.
