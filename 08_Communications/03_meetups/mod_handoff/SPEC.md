# F08.S03.M02 — Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S03](../SPEC.md). **Process IDs:** PS-065-01…PS-065-10. **Code:** `packages/comms/src/meetups/handoff`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Check-in around an agreed meetup. Each party taps "I have arrived" inside the agreed window, which produces a signed check-in statement that carries no location and is delivered to the other parties through encrypted messages. A party who checked in can report the other as a no-show after a grace period; the report is a signed claim by the reporter, not a fact, and receiving vaults label it that way. Optionally a member shares a trusted-contact link that shows place, window and check-in status to a person without the app, as an end-to-end encrypted snapshot hosted on the member's chosen relay with a key that stays in the link fragment and a lifetime of at most 24 hours.

## Responsibilities

- Own the MeetupCheckin record per party and meetup (pending, checked in, no-show claim, void) in each vault.
- Accept check-ins only inside the window from 15 minutes before windowStart to 30 minutes after windowEnd and sign them as classrup.comms.checkin/v1 statements without any coordinates.
- Allow a checked-in party to report another party as no-show from 30 minutes after windowEnd until 24 hours after, as a signed claim classrup.comms.no_show_report/v1 that the accused sees and may answer in the thread.
- Own the MeetupShare record for user-initiated trusted-contact links, create the encrypted snapshot on the chosen relay, update it on check-in, and revoke it on request or at expiry.
- Never read device location, never request live location, and never store anything but the pseudonym-level state of check-ins.

## Not responsible for

- Time and place agreement (F08.S03.M03) and curated spots (F08.S03.M01).
- Reputation effects of no-shows (F07.S03.M01 consumes comms.meetup.no_show as a claim and decides its weight).
- Live location sharing (F06.S02.M02 owns discovery.location_share.* which is a separate, user-initiated feature with L4 rules).
- Emergency services contact or monitoring; the module is not a safety monitoring service.
- Future: scheduled safety reminders pushed through a relay, check-out confirmation, check-in by scanning the other party's QR code.

## User stories

- As a buyer, I tap I have arrived at the meetup and the seller's app shows that I checked in at the time my phone claims.
- As a seller waiting alone, I can report that the other party did not show up after the grace period, knowing it is recorded as my claim.
- As a member, I can send a link to a friend that shows where and when I am meeting and whether I checked in, and it stops working after at most 24 hours or when I revoke it.
- As a member accused of no-show, I can see the report and reply in the thread.

## Edge cases

- A party taps arrive 20 minutes before the window; the app refuses and shows when check-in opens.
- Both parties check in but only one verified statement reaches the other vault; each vault shows its own state and the other's as waiting until the statement arrives, never both checked in on the strength of one signature.
- No-show is reported while the accused's check-in statement is still in transit; when it arrives the report is marked contradicted and both are shown.
- Trusted-contact link opened after revocation or expiry; the relay returns NOT_FOUND and the page shows the link has ended.
- The member shares a link and the relay later goes offline; the contact sees an unavailable page and the member's local state is unaffected.
- Meetup is cancelled after check-ins; open check-ins are voided and any share link is revoked automatically.
- Device clock is wrong; check-in window is judged on the local clock and the statement time is a claim, shown to others with a clock warning when it is more than 10 minutes off their own.

## UX and accessibility

- Meetup day card: countdown to window, big I have arrived button enabled only inside the check-in window, party check-in list with text status, Report no-show (after grace period), Share with a trusted contact.
- Share sheet: explains that the link shows place, window and check-in status, expires in 24 hours at most, is readable by anyone who has the whole link, and that the relay cannot read it; buttons Create link, Copy, Revoke.
- No-show report sheet: states that the report is your claim, lists what the other party will see, and Send report.

**States:** loading; before-window; check-in-open; checked-in; waiting-for-others; grace-period; no-show-reportable; no-show-reported; contradicted; void; share-active; share-revoked; offline-queued

**Accessibility:** The arrive button has a persistent accessible name and live announcements state when check-in opens and when others check in.; Time values are text with the zone label; countdown does not auto-announce more often than once a minute.; Share link actions are buttons of at least 44 by 44 px and the copied confirmation is announced politely.

## Owned data

- `MeetupCheckin` (classrup.comms.meetup_checkin/v1, P2, RET-STANDARD)
- `MeetupShare` (classrup.comms.meetup_share/v1, P3, RET-EPHEMERAL)

## Interfaces

- Commands: `comms.meetup.check_in`, `comms.meetup.report_no_show`, `comms.meetup_share.create`, `comms.meetup_share.put`, `comms.meetup_share.revoke`
- Queries: `comms.meetup_share.view`, `comms.meetup.list_checkins`
- Emits: `comms.meetup.checked_in`, `comms.meetup.no_show`, `comms.meetup_share.created`, `comms.meetup_share.revoked`
- Consumes: `comms.meetup.agreed`, `comms.meetup.cancelled`, `comms.meetup.proposed`, `identity.block.added`

## Dependencies

F08.S03.M03, F08.S01.M01, F08.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-065-01 | [Domain schema](domain_schema.md) | 3 |
| PS-065-02 | [Validation rules](validation_rules.md) | 3 |
| PS-065-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-065-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-065-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-065-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-065-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-065-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-065-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-065-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/meetups/handoff/index.ts`.

## Acceptance criteria

- All tests T01 to T14 pass in CI.
- Network and storage captures show no location data and no share key reaching a server.
- No UI text states that someone was at the place; it states that they reported arriving.
- A no-show is always displayed as a claim of its reporter.
