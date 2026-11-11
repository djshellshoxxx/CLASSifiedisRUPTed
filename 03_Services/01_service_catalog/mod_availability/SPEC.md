# F03.S01.M02 — Service availability

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F03.S01](../SPEC.md). **Process IDs:** PS-028-01…PS-028-10. **Code:** `packages/services/src/service_catalog/availability`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The provider's availability calendar lives in the provider's local vault (schema classrup.services.calendar/v1). It holds weekly recurring windows and dated exceptions in the provider's IANA time zone and turns them into DST-safe UTC slots. While a quote is outstanding the provider vault places a slot hold that lasts until the quote's validUntil plus 5 minutes and is extended once to 24 hours after the client's acceptance arrives; holds, and the conflict checks that protect them, exist only in that one vault (ADR-0016 section 5, IDM-8). Rule, exception and tz database changes flag affected holds for reconfirmation. An optional signed availability summary (classrup.services.availability_summary/v1) built from the rules only lets clients see candidate windows; it is advisory, reserves nothing and never reveals holds or bookings. Quotes and bookings are F03.S02.M01.

## Responsibilities

- Own AvailabilityCalendar (weekly rules, exceptions, buffers, notice and horizon) and SlotHold records in the provider vault.
- Expand local wall-clock rules into UTC slots with the bundled IANA tz database, skipping nonexistent local times and resolving repeated local times to the first occurrence.
- Prevent double allocation inside the provider vault - a slot overlapping a held or committed slot (including buffers) is refused.
- Sign and publish an optional availability summary statement (classrup.services.availability_summary/v1, expiry 14 days) built from rules and exceptions only, to user-selected relays (P0, after federation_publish consent per relay) or end-to-end encrypted to a client (P2).
- Tie hold lifetimes to quotes - hold until quote validUntil plus 5 minutes, extend once to acceptance receipt plus 24 hours, re-hold a still-free interval when an acceptance or confirmation finds the hold expired, and refuse to commit a hold that needs reconfirmation.

## Not responsible for

- Quote, booking and cancellation statements (F03.S02.M01) - this module only holds, extends and commits slots on its command.
- Cross-vault guarantees - a client or relay copy of the summary can be stale; only the provider's signed quote or confirmation promises a slot.
- The offering record (F03.S01.M01); a calendar references an offering by id only and summaries are verified against the provider DID they carry.
- Consent decisions (F10.S01.M01) and block lists (F07.S02.M02); this module calls them before acting.
- Rental calendars (F05.S01.M01).
- Future: external calendar import (ICS/CalDAV) and multi-staff providers.

## User stories

- As a provider in Berlin, I set Monday to Friday 09:00-17:00 local with 15 minute buffers and my clients see correct local times in their own zone.
- As a provider, I add a closed exception for a holiday and an extra Saturday window and see the affected quotes flagged for reconfirmation.
- As a client, I see candidate windows from the provider's summary and understand they are not reserved until the provider's quote.

## Edge cases

- Spring-forward day (Europe/Berlin 2027-03-28) - a 02:30 local slot does not exist; it is skipped and no slot is shifted silently.
- Fall-back day (Europe/Berlin 2026-10-25) - 02:30 occurs twice; only the first occurrence (UTC+2) is generated, the repeated hour offers no extra slot.
- Provider changes time zone; existing holds and bookings keep their UTC instants and display in the new zone, new slots use the new zone.
- The bundled tz database changes a zone rule; affected future slots are regenerated and held holds whose local time moved are marked needsReconfirmation and cannot commit until the provider reconfirms them.
- Two quotes are issued for overlapping slots at the same moment in two tabs; a Web Locks lock serializes them and the second gets SERVICES_SLOT_UNAVAILABLE.
- Hold expires while the client's acceptance is in transit; at acceptance receipt or at confirmation the provider vault re-holds the same interval when it is still free (new hold with reholdOf), otherwise it refuses with a signed booking_cancellation reason slot_taken and the client sees declined.
- A quote valid for 72 hours is accepted at hour 71; the hold is extended to receipt plus 24 hours, so a confirmation at hour 80 still commits it.
- Client device clock is wrong; the summary carries UTC instants and the signer's zone, so display remains correct, while expiry uses the receiver's own clock plus a stated 5 minute tolerance.
- A summary is published while slots are held or booked; windows come from rules and exceptions only, so the summary never reveals that a slot is held or booked.
- Summary destinations include a relay without federation_publish consent; publish fails with SERVICES_PUBLISH_CONSENT_MISSING before anything is signed.
- Two summaries with seq 4 and 5 arrive out of order; receivers keep seq 5 and ignore the older one.

## UX and accessibility

- Weekly planner: seven day rows with time windows, slot length selector (15, 30, 45, 60, 90, 120 minutes), buffer before and after (0 to 120 minutes), minimum notice (0 to 14 days) and horizon (1 to 180 days).
- Exceptions list: closed dates and extra windows, each shown in provider local time with the UTC offset in effect that day.
- Slot preview: next 14 days of generated slots, with a banner on DST change days stating the lost or repeated hour.
- Holds needing reconfirmation: list of held slots moved or removed by a rule change, with Keep and Release actions.
- Publish summary sheet: destinations (relays and clients), granularity slot or day part, a preview of exactly the allowlisted fields, and the PRV-6 notice that fetched copies cannot be recalled.

**States:** loading; empty; saved-local; publish-prepared; publish-acknowledged; tz-warning; needs-reconfirmation; conflict

**Accessibility:** Time inputs are native time fields with visible labels that name the zone (for example Monday start, Europe/Berlin).; DST banners are role=status text, not colour alone.; Slot grid is a keyboard-navigable table with row and column headers; each slot button has an accessible name with weekday, local time and offset.

## Owned data

- `AvailabilityCalendar` (classrup.services.calendar/v1, P3, RET-STANDARD)
- `SlotHold` (classrup.services.slot_hold/v1, P2, RET-SHORT)

## Interfaces

- Commands: `services.calendar.set_rules`, `services.calendar.add_exception`, `services.calendar.remove_exception`, `services.calendar.publish_summary`, `services.slot.hold`, `services.slot.extend`, `services.slot.reconfirm`, `services.slot.release`, `services.slot.commit`
- Queries: `services.calendar.list_slots`, `services.calendar.get`
- Emits: `services.availability.changed`, `services.slot.held`, `services.slot.committed`, `services.slot.released`
- Consumes: `services.quote.declined`, `services.quote.expired`, `services.booking.cancelled`, `identity.block.added`, `identity.device_key.revoked`, `privacy.deletion.completed`

## Dependencies

F07.S01.M01, F07.S02.M02, F08.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-028-01 | [Domain schema](domain_schema.md) | 3 |
| PS-028-02 | [Validation rules](validation_rules.md) | 3 |
| PS-028-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-028-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-028-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-028-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-028-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-028-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-028-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-028-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/services/src/service_catalog/availability/index.ts`.

## Acceptance criteria

- All tests T01–T22 pass in CI.
- Property test finds no overlapping committed intervals and no slot inside a DST gap for any zone in 2026-2028.
- Hold and commit work fully offline, a hold needing reconfirmation never commits, and the UI never shows peer_accepted without a signed acknowledgement.
