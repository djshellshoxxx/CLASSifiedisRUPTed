# F08.S03.M01 — Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S03](../SPEC.md). **Process IDs:** PS-066-01…PS-066-10. **Code:** `packages/comms/src/meetups/safe`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Curated public meetup spots (police station lobbies, shopping centres, libraries, transit hubs, busy cafes) per L2 region cell, plus a safety checklist. Spots are signed public statements published by curators that a relay operator or community chooses; the app ships a bundled starter set per supported region and refreshes it from the user's selected relay. Suggestions are computed in the vault from cached spots for a region cell the user picks, so no user location is sent anywhere and none is stored. The module never claims a spot is safe, only that a curator listed it as a public place with stated opening hours.

## Responsibilities

- Own the SafeSpot record as a curator-signed public statement and its lifecycle from draft to active to retired.
- Provide relay commands for curators to publish and retire spots and for anyone to list spots of an L2 cell, served from the relay's public projection index.
- Provide the vault command that suggests up to 5 spots for a chosen L2 cell and meeting time from the local cache without contacting the relay with any location.
- Ship and version the safety checklist (10 items, localized keys) and the bundled starter spot set per region.
- Let users report a spot as unsuitable, which the relay operator or curator handles under their own policy.

## Not responsible for

- Agreeing on time and place between two members (F08.S03.M03).
- Check-in, no-show and trusted-contact sharing (F08.S03.M02).
- Region cells and L2 geometry (F06.S02.M01 and F06.S02.M02).
- Global curation or global takedown of spots; each relay and community curates its own list.
- Future: crowd-sourced spot ratings, live opening hours, per-spot CCTV or staffed-hours attestations.

## User stories

- As a buyer arranging a pickup, I can see up to 5 public spots in the region we chose, ordered by opening hours that cover our window, without sharing where I am.
- As a seller, I can read a short safety checklist before I go and tick items off.
- As a relay curator, I can publish a police-station lobby as a spot and retire it later, with a reason.
- As a member, I can report a spot that is closed or unsuitable.

## Edge cases

- Region has no curated spots; the app shows the safety checklist and a prompt to pick a public place with staff, never a map search that would reveal location.
- Spot opening hours do not cover the meeting window; the spot is shown below spots that do and labelled outside hours.
- Curator retires a spot after members already agreed to meet there; the agreed Meetup keeps the spot snapshot, and its owner is told the spot was retired.
- Two curators publish the same venue; spots with equal venue key are deduplicated by the newer valid statement and the older is shown as superseded.
- Relay serves a statement with an invalid signature or an untrusted curator key; the vault discards it with reason and keeps the cached version.
- Cached list older than 30 days; the app still suggests but marks the list as possibly outdated.

## UX and accessibility

- Suggest spots sheet: region cell label, list of up to 5 spots with name, kind, public address, opening hours, curator name, and Use this spot button.
- Safety checklist: 10 checkable items (public place, tell a friend, daylight, inspect before paying, keep payment claim terms, no exact home address, trust your judgment to leave, bring a companion, keep chat in app, report problems).
- Report spot dialog: reason picker and free text up to 280 characters.

**States:** loading; empty-region; cached-stale; ready; reported; offline

**Accessibility:** Spots are a list; each item has an accessible name with name, kind and hours status, and the Use button is at least 44 by 44 px.; The checklist uses native checkboxes with labels and progress is announced politely.; Hours are rendered as text such as Open 08:00 to 20:00 and not only by color.

## Owned data

- `SafeSpot` (classrup.comms.safe_spot/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `comms.safe_spot.publish`, `comms.safe_spot.retire`, `comms.safe_spot.suggest`
- Queries: `comms.safe_spot.list_for_cell`, `comms.safe_spot.checklist`
- Emits: `comms.safe_spot.suggested`
- Consumes: `security.role.assigned`, `security.role.revoked`

## Dependencies

F06.S02.M01, F16.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-066-01 | [Domain schema](domain_schema.md) | 3 |
| PS-066-02 | [Validation rules](validation_rules.md) | 3 |
| PS-066-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-066-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-066-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-066-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-066-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-066-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-066-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-066-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/meetups/safe/index.ts`.

## Acceptance criteria

- All tests T01 to T13 pass in CI.
- Network and storage captures show zero user location data in any flow of this module.
- The UI never describes a listed spot as safe or verified safe.
