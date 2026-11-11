# F12.S01.M01 — Content flags

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S01](../SPEC.md). **Process IDs:** PS-094-01…PS-094-10. **Code:** `packages/moderation/src/reporting/flags`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Local-first reporting. A member reports content from their own vault: the vault captures evidence of what it holds (via F12.S01.M02), stores the Report locally, and sends a report statement to one user-selected relay. The statement has a signed header the relay can read (report id, relay, reporter key, subject key, target and reason) and a body sealed to that relay's moderation key (details and evidence). The relay verifies the statement, returns a signed receipt and emits the relay-local moderation.report.received event that opens or extends a case; when the report is attached to a case and when the case closes, the relay sends signed link and outcome statements back. The reporter can also hide or block locally and subscribe to signed advisory feeds that label or hide content, with no relay involved. A relay's moderators decide only what that relay indexes; there is no global takedown. Reporter pseudonymity is not anonymity: the relay operator sees the reporting key, and the relay's hosting policy (not cryptography) promises not to reveal it to the reported party. Local hides are vault records that local views (F06 search and proximity results) apply at query time through the in-process LocalHidePort (isHidden, filterHidden), and the user removes them with an explicit unhide.

## Responsibilities

- Own the Report record in the reporter's vault (device) and its relay-side copy on the relay that received it, with sync states local committed, prepared, transport_acknowledged and peer_accepted.
- Offer the 12-code reason taxonomy and produce the report statement addressed to one user-selected relay, bound to that relay's DID and current moderation key.
- Deduplicate reports (one open report per reporter key, target and reason) in the vault and again at the relay, and cap reports per relay policy through F12.S03.M03.
- On the relay, verify received reports, store the readable header and sealed body, return a signed receipt, emit moderation.report.received (and moderation.report.dismissed for reports on cases closed without action), and send signed reportlinked and reportoutcome statements to reporters.
- Provide local hide records (never leave the device) with explicit hide and unhide commands, the in-process LocalHidePort (isHidden by targetRef or authorDid, filterHidden over result items) used by F06.S01.M02 and F06.S02.M03 at query time, and advisory-feed subscriptions that label or hide matching content in local views, removing labels on verified retraction or expiry.
- Show the reporter honest delivery state and a coarse outcome (actioned on that relay, no action, duplicate, removed by owner) from verified relay statements.
- Keep the relay-side report ledger (reporter keys per case) used in-process for conflict-of-interest checks (F12.S02.M01, F12.S01.M03) and report-abuse controls.

## Not responsible for

- Evidence capture, hashing and participant-disclosure previews (F12.S01.M02).
- Cases, actions, statements of reasons and advisories issued by a relay (F12.S02.M01).
- Policy rule text and IDs (F12.S02.M03).
- Appeals (F12.S01.M03).
- Blocking people (F07.S02.M02 owns block lists); hide here only affects content visibility.
- Signal weights and bad-faith derivation (F12.S03.M02); request limits (F12.S03.M03).
- Future: trusted-flagger relationships; cross-relay report forwarding.

## User stories

- As a member, I can report a listing as a scam to the relay that serves it, and I see whether my report is only saved on my device, sent to the relay, acknowledged by the relay, linked to a case or resolved.
- As a member, I can hide content or an author on my device immediately, even when no relay is reachable.
- As a member, I can subscribe to a relay's or community's signed advisory feed and choose whether matching content is labelled or hidden, and labels disappear when the publisher retracts them or they expire.
- As a member reporting a private message, I am told that by default only its metadata is sent, and I choose whether to disclose a redacted copy.
- As a member, I can see what I hid on this device and unhide an item or an author, and my searches show it again at once.

## Edge cases

- The same reporter key reports the same target for the same reason twice; the vault returns the existing Report (MODERATION_REPORT_DUPLICATE with params.reportId) and sends nothing.
- The relay is unreachable; the report stays prepared in the sync outbox for up to 7 days and the UI says 'saved on this device, not delivered'; the user may export the report file to send to another relay or moderator.
- The relay serves a different copy of the content than the one the reporter holds; the snapshot covers the reporter's signed copy and the relay compares its own copy by content id.
- The target has no signed author envelope (a local draft or an unsigned import); filing is refused with MODERATION_TARGET_UNAVAILABLE, except an unsigned end-to-end message, which may be filed as a labelled reporter claim.
- A relay returns an outcome statement with an invalid relay signature; the vault quarantines it, keeps the report state unchanged and never shows 'actioned'.
- An advisory feed publisher key is revoked; the vault drops the subscription's labels after it verifies the revocation statement and shows 'publisher revoked'.
- Mass reporting from many fresh keys against one author; relay policy applies per-key and per /24 caps, and reports carry no weight by count alone.
- The first receipt is lost and the vault retries on day 3; the relay returns the stored signed receipt for the same reportId and digest instead of a duplicate error.
- A relay forwards a report statement it received to another relay; the second relay refuses it because the signed relayId and sealing key are not its own.
- The reported private message came from the only counterparty; the sheet warns that the reported party can infer who reported it.
- A member hides author A and later one listing of author B; filterHidden drops every result item of A and only that listing of B, and unhiding A restores A's items in the next query without touching the search index.
- A message disclosure preview removed a phone number; the report carries the redacted copy without the message key K, because K and the ciphertext would reveal the removed number, and the relay shows 'redacted copy, commitment not checkable'.
- A message disclosure preview removed nothing; the sealed body carries K so the relay recomputes the key commitment and checks that the ciphertext decrypts to the disclosed text.

## UX and accessibility

- Report sheet from any content item: relay picker (default the relay that served the content), reason radio list (12 reasons), optional details (max 1000 characters), toggles 'hide on this device' and 'also block this author', submit.
- Private content step (message, offer, cycle proposal): 'Only metadata is sent by default' notice, optional 'Disclose a redacted copy' preview with highlighted redactions, approve or skip, and the warning 'the person may infer that you reported this'.
- Delivery status line under each report: Saved on this device, Sent to relay, Relay acknowledged, Linked to a case, Resolved; each with timestamp labelled as 'this device' or 'relay clock'.
- Settings > Safety > Advisory feeds: add publisher, per-feed mode (label, hide, ignore), last update, revoke state, number of active, retracted and expired advisories.
- Honest notice on the sheet: your reporting key is visible to the relay's moderators; the person reported is not told by the relay's policy; copies already fetched by others cannot be recalled.
- Settings > Safety > Hidden on this device: hidden items and authors with the time hidden and an Unhide button each; the note says hides stay on this device and are never sent.

**States:** loading; empty; saved-locally; sent; acknowledged; linked; resolved; duplicate; relay-unreachable; quarantined-outcome; disclosure-preview; hidden-locally; unhidden

**Accessibility:** Reason list is a radiogroup with arrow-key navigation and per-option descriptions.; Delivery state changes are announced in an aria-live polite region and are never conveyed by color alone.; All controls are at least 44 by 44 px and the sheet traps focus and restores it on close.

## Owned data

- `Report` (classrup.moderation.report/v1, P2, RET-EVIDENCE)
- `AdvisorySubscription` (classrup.moderation.advisorysubscription/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `moderation.report.file`, `moderation.report.withdraw`, `moderation.report.receive`, `moderation.report.link_case`, `moderation.report.receive_relay_statement`, `moderation.localhide.add`, `moderation.localhide.remove`, `moderation.advisorysubscription.set`, `moderation.advisorysubscription.sync`
- Queries: `moderation.report.list_mine`, `moderation.report.list_for_target`, `moderation.report.status_for_reporter`, `moderation.report.ledger_for_case`, `moderation.localhide.list`, `moderation.localhide.check`, `moderation.localhide.filter`, `moderation.advisorysubscription.list`
- Emits: `moderation.report.filed`, `moderation.report.received`, `moderation.report.dismissed`
- Consumes: `moderation.case.opened`, `moderation.case.closed`, `privacy.deletion.completed`

## Dependencies

F12.S01.M02, F12.S02.M03, F12.S03.M03, F07.S02.M02, F08.S01.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-094-01 | [Domain schema](domain_schema.md) | 6 |
| PS-094-02 | [Validation rules](validation_rules.md) | 4 |
| PS-094-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-094-04 | [Commands, queries and events](commands_queries_events.md) | 8 |
| PS-094-05 | [Authorization and capabilities](authorization_capabilities.md) | 4 |
| PS-094-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-094-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 6 |
| PS-094-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-094-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-094-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/reporting/flags/index.ts`.

## Acceptance criteria

- All tests T01–T29 pass in CI.
- No response, event, notification or export visible to the reported party contains the reporter key (privacy suite).
- The UI never shows sent, acknowledged, linked or resolved before the matching verified state is reached.
