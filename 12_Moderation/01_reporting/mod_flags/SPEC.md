# F12.S01.M01 — Content flags

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S01](../SPEC.md). **Process IDs:** PS-094-01…PS-094-10. **Code:** `packages/moderation/src/reporting/flags`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Local-first reporting. A member reports content from their own vault: the vault captures evidence of what it holds (via F12.S01.M02), stores the Report locally, and sends a signed report statement, sealed to the chosen relay's moderation key, to that relay's moderators. The reporter can also hide or block locally and subscribe to signed advisory feeds that label or hide content, with no relay involved. A relay's moderators decide only what that relay indexes; there is no global takedown. Reporter pseudonymity is not anonymity: the relay operator sees the reporting key, and the relay's hosting policy (not cryptography) promises not to reveal it to the reported party.

## Responsibilities

- Own the Report record in the reporter's vault (device) and its relay-side copy on a relay that accepts the report, with sync states local committed, prepared, transport_acknowledged and peer_accepted.
- Offer the 12-code reason taxonomy and produce the signed report statement addressed to one user-selected relay.
- Deduplicate reports (one open report per reporter key, target and reason) in the vault and again at the relay, and cap reports per relay policy.
- Provide local hide (never leaves the device) and advisory-feed subscriptions that label or hide matching content in local views.
- Show the reporter honest delivery state and a coarse outcome (actioned on that relay, no action, duplicate) when the relay returns a signed outcome statement.

## Not responsible for

- Evidence capture and hashing (F12.S01.M02).
- Cases, actions and statements of reasons issued by a relay (F12.S02.M01).
- Policy rule text and IDs (F12.S02.M03).
- Appeals (F12.S01.M03).
- Blocking people (F07.S02.M02 owns block lists); hide here only affects content visibility.
- Future: trusted-flagger relationships; cross-relay report forwarding.

## User stories

- As a member, I can report a listing as a scam to the relay that serves it, and I see whether my report is only saved on my device, delivered to the relay, or acknowledged by its moderators.
- As a member, I can hide content or an author on my device immediately, even when no relay is reachable.
- As a member, I can subscribe to a relay's or community's signed advisory feed and choose whether matching content is labelled or hidden.

## Edge cases

- The same reporter key reports the same target for the same reason twice; the vault returns the existing Report (MODERATION_REPORT_DUPLICATE with params.reportId) and sends nothing.
- The relay is unreachable; the report stays prepared in the sync outbox for up to 7 days and the UI says 'saved on this device, not delivered'; the user may export the report file to send to another relay or moderator.
- The relay serves a different copy of the content than the one the reporter holds; the snapshot covers the reporter's signed copy and the relay compares its own copy by content id.
- The target has no signed author envelope (a local draft or an unsigned import); capture is refused with MODERATION_TARGET_UNAVAILABLE because evidence needs the author's signature.
- A relay returns an outcome statement with an invalid relay signature; the vault quarantines it, keeps the report at transport_acknowledged and never shows 'actioned'.
- An advisory feed publisher key is revoked; the vault drops the subscription's labels after it verifies the revocation statement and shows 'publisher revoked'.
- Mass reporting from many fresh keys against one author; relay policy applies per-key and per /24 caps, and reports carry no weight by count alone.

## UX and accessibility

- Report sheet from any content item: relay picker (default the relay that served the content), reason radio list (12 reasons), optional details (max 1000 characters), toggles 'hide on this device' and 'also block this author', submit.
- Delivery status line under each report: Saved on this device, Sent to relay, Relay acknowledged, Resolved; each with timestamp labelled as 'this device' or 'relay clock'.
- Settings > Safety > Advisory feeds: add publisher, per-feed mode (label, hide, ignore), last update, revoke state.
- Honest notice on the sheet: your reporting key is visible to the relay's moderators; the person reported is not told by the relay's policy; copies already fetched by others cannot be recalled.

**States:** loading; empty; saved-locally; sent; acknowledged; resolved; duplicate; relay-unreachable; quarantined-outcome

**Accessibility:** Reason list is a radiogroup with arrow-key navigation and per-option descriptions.; Delivery state changes are announced in an aria-live polite region and are never conveyed by color alone.; All controls are at least 44 by 44 px and the sheet traps focus and restores it on close.

## Owned data

- `Report` (classrup.moderation.report/v1, P3, RET-EVIDENCE)
- `AdvisorySubscription` (classrup.moderation.advisorysubscription/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `moderation.report.file`, `moderation.report.withdraw`, `moderation.report.receive`, `moderation.advisorysubscription.set`
- Queries: `moderation.report.list_mine`, `moderation.report.list_for_target`, `moderation.advisorysubscription.list`
- Emits: `moderation.report.filed`
- Consumes: `moderation.case.opened`, `moderation.case.closed`

## Dependencies

F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-094-01 | [Domain schema](domain_schema.md) | 4 |
| PS-094-02 | [Validation rules](validation_rules.md) | 3 |
| PS-094-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-094-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-094-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-094-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-094-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-094-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-094-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-094-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/reporting/flags/index.ts`.

## Acceptance criteria

- All tests T01–T16 pass in CI.
- No response, event, notification or export visible to the reported party contains the reporter key (privacy suite).
- The UI never shows delivered or acknowledged before the matching sync state is reached.
