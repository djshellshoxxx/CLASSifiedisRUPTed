# F08.S03.M03 — Meetup coordination

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S03](../SPEC.md). **Process IDs:** PS-064-01…PS-064-10. **Code:** `packages/comms/src/meetups/coordination`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Two (or more) members agree a time window and a place for handing over goods. A proposal is a signed statement from the proposer's vault naming a window of 15 minutes to 4 hours and a place that is either a curated safe spot or a coarse L3 area label; each party agrees by signing a consent statement (F08.S02.M02) on the exact proposal revision. The meetup is agreed in a vault only when it holds valid agreement statements from every party, so the UI says "you agreed, waiting for the other party" until the peer's signature arrives. Either party can reschedule up to 5 times or cancel. No exact home address and no live location are ever part of a meetup.

## Responsibilities

- Own the Meetup record and its revisions (window, place, party list, reschedule count) inside each party's vault.
- Produce and verify signed proposal statements classrup.comms.meetup/v1 carried through encrypted messages of F08.S01.M01.
- Collect agreement from every party as comms.consent.sign statements on the exact revision hash and compute agreed only from verified statements.
- Enforce the reschedule limit of 5 per meetup, the window rules, and the place rules (safe spot or L3 area label).
- Cancel or expire meetups when their context closes, a party blocks another, or the window passes.
- Detect forked proposals (two different proposals with the same revision number from one proposer) and freeze the meetup for renegotiation instead of picking one.

## Not responsible for

- Curating spots (F08.S03.M01) and check-in or no-show (F08.S03.M02).
- Consent signing primitives (F08.S02.M02).
- Transport and encryption (F08.S01.M01) and thread membership (F08.S01.M02).
- Deals, payment claims and receipts (F09); a meetup is not evidence that a trade was completed.
- Future: recurring meetups, multi-stop routes, calendar file export with reminders, shared live ETA.

## User stories

- As a seller, I propose a Saturday 14:00 to 15:00 window at a library lobby and see exactly which parties have agreed.
- As a buyer, I can ask to move the meetup to Sunday and the earlier agreement stops counting for the new time.
- As a cycle participant, I agree to a handover meetup with the next person in the cycle at a spot we both picked.
- As a member, I can cancel with a short reason and the other party sees it as cancelled by me.

## Edge cases

- Both parties reschedule at the same time with different windows; two proposals share a revision number, the meetup freezes as conflicted and both must re-propose, no last-writer-wins.
- The agreement of one party arrives after the window start; the meetup is not agreed because the window already began, and the proposer is asked to propose a new window.
- A safe spot is retired after agreement; the meetup keeps the spot snapshot and shows a notice that the spot is no longer listed.
- Reschedule number 6 is attempted; the command is refused with COMMS_MEETUP_RESCHEDULE_LIMIT and the parties must cancel and create a new meetup.
- Party is blocked by the other after proposing; the blocker's vault drops the meetup silently and the other side sees no state change.
- Clock of a party is off by 2 hours; window times are agreed in UTC with a zone label, the claimed times are shown as claims, and the local clock decides when a window has passed.
- Place given as an L3 area label that contains a street address; the validator rejects any label that matches a house-number pattern.

## UX and accessibility

- Propose meetup: date, start, end (15 minutes to 4 hours), place picker (suggested safe spots or L3 area with label up to 80 characters), review summary, Send proposal.
- Meetup card in thread: window with time zone, place, party agreement list (You agreed, waiting for Alex), reschedule counter (2 of 5 used), Agree, Reschedule, Cancel.
- Conflict view: two competing proposals side by side with Pick one to propose again.

**States:** loading; proposed; waiting-for-others; agreed; conflicted; cancelled; expired; elapsed; offline-queued

**Accessibility:** Date and time inputs are native controls with visible labels and time zone shown as text.; Agreement status for each party is text, not only icons, and is announced in a polite live region.; Agree, Reschedule and Cancel are buttons of at least 44 by 44 px with distinct accessible names.

## Owned data

- `Meetup` (classrup.comms.meetup/v1, P2, RET-STANDARD)

## Interfaces

- Commands: `comms.meetup.propose`, `comms.meetup.agree`, `comms.meetup.reschedule`, `comms.meetup.cancel`
- Queries: `comms.meetup.list_for_thread`
- Emits: `comms.meetup.proposed`, `comms.meetup.agreed`, `comms.meetup.cancelled`
- Consumes: `comms.consent.received`, `comms.consent.revoked`, `comms.thread.archived`, `identity.block.added`, `mutiny.cycle.cancelled`, `services.booking.cancelled`, `rentals.reservation.cancelled`

## Dependencies

F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-064-01 | [Domain schema](domain_schema.md) | 3 |
| PS-064-02 | [Validation rules](validation_rules.md) | 3 |
| PS-064-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-064-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-064-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-064-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-064-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-064-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-064-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-064-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/meetups/coordination/index.ts`.

## Acceptance criteria

- All tests T01 to T14 pass in CI.
- A meetup is shown as agreed only when every party's consent verifies for the current proposal hash.
- No meetup field or event ever contains an exact address or live location.
