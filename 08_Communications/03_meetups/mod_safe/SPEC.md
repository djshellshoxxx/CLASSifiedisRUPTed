# F08.S03.M01 — Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S03](../SPEC.md). **Process IDs:** PS-066-01…PS-066-10. **Code:** `packages/comms/src/meetups/safe`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Curated public meetup spots (police station lobbies, shopping centres, libraries, transit hubs, busy cafes) per L2 region cell, plus a safety checklist. Spots are signed public statements that curators draft and sign in their own vault and publish on a relay whose operators list them in a relay-signed curator list owned by this module; every spot carries only venue information at L2 precision (name, kind, hours, an access note and a geohash-5 cell that passes assertPublicCell), never a street address or a finer cell. The app ships an unsigned starter set labelled "app starter list" that users and relays can hide or override, and bundles no trusted curator keys. Vaults show where trust comes from on every spot, pin curator keys on first use and warn when a relay's curator list changes. Suggestions are computed in the vault from cached spots for a region cell the user picks, so no user location is sent anywhere and none is stored. The module never claims a spot is safe, only that a named curator listed it as a public place with stated opening hours.

## Responsibilities

- Own the SafeSpot record as a curator-signed public statement and its lifecycle from draft (curator vault) to active to retired, including expiry at validUntil.
- Provide curator vault commands to draft and sign spots, relay commands for curators to publish and retire spots, for operators to maintain the relay-signed curator list, and for members to report spots, plus public relay queries for spots of an L2 cell and the curator list.
- Provide the vault command that suggests up to 5 spots for a chosen L2 cell and meeting time from the local cache without contacting the relay with any location, labelled with their trust source.
- Ship and version the safety checklist (10 items, localized keys) and the unsigned starter spot set per region labelled app starter list.
- Let users report a spot as unsuitable through comms.safe_spot.report, which the relay operator or curator handles under their own policy.
- Keep the user's local trust settings (pinned curator keys per relay, hidden starter entries) and warn when a relay's curator list changes.

## Not responsible for

- Agreeing on time and place between two members (F08.S03.M03).
- Check-in, no-show and trusted-contact sharing (F08.S03.M02).
- Region cells, L2 geometry and the public-cell guard (F06.S02.M01 and F06.S02.M02).
- Relay roles (F16.S01.M01 operator); curator status is not an F16 role but a listing in this module's relay-signed curator list.
- Global curation or global takedown of spots; each relay and community curates its own list.
- Future: crowd-sourced spot ratings, live opening hours, per-spot CCTV or staffed-hours attestations, public street addresses after a CTR-PRV-001 amendment for curator-signed non-residential venues.

## User stories

- As a buyer arranging a pickup, I can see up to 5 public spots in the region we chose, ordered by opening hours that cover our window, without sharing where I am.
- As a seller, I can read a short safety checklist before I go and tick items off.
- As a relay curator, I can draft and sign a police-station lobby as a spot in my vault, publish it on my relay and retire it later, with a reason.
- As a member, I can report a spot that is closed or unsuitable.
- As a member, I can see who listed a spot and through which relay, and I am warned when my relay starts trusting a new curator.

## Edge cases

- Region has no curated spots; the app shows the safety checklist and a prompt to pick a public place with staff, never a map search that would reveal location.
- Spot opening hours do not cover the meeting window; the spot is shown below spots that do and labelled outside hours.
- Curator retires a spot after members already agreed to meet there; the agreed Meetup keeps the spot snapshot, and its owner is told the spot was retired.
- Two curators publish the same venue; spots with equal venue key are deduplicated by the newer valid statement and the older is shown as superseded.
- Relay serves a statement with an invalid signature or a curator key not in its signed curator list; the vault discards it with reason and keeps the cached version.
- Cached list older than 30 days; the app still suggests but marks the list as possibly outdated.
- A curator drafts a spot with a 6-character venue cell or a street number in the access note; signing is refused by assertPublicCell or the house-number check before anything leaves the vault.
- A spot's validUntil passes; every vault filters it from suggestions on its own clock and the relay retires it with reason expired.
- A hostile relay adds its own key to its curator list and publishes a fake police station; the spot is shown as "listed by a curator delegated by relay R", ranked below pinned curators and starter entries, and the user sees a curator-list-changed warning.

## UX and accessibility

- Suggest spots sheet: region cell label, list of up to 5 spots with name, kind, access note, opening hours, trust source (pinned curator, app starter list, or curator delegated by relay R) and Use this spot button.
- Safety checklist: 10 checkable items (public place, tell a friend, daylight, inspect before paying, keep payment claim terms, no exact home address, trust your judgment to leave, bring a companion, keep chat in app, report problems).
- Report spot dialog: reason picker and free text up to 280 characters.
- Spot trust settings: pinned curators per relay, curator-list change warnings, hide or restore app starter list entries.
- Curator workspace: draft, sign, publish and retire spots of the curator's relay.

**States:** loading; empty-region; cached-stale; ready; reported; offline; curator-list-changed; draft; signed

**Accessibility:** Spots are a list; each item has an accessible name with name, kind, hours status and trust source, and the Use button is at least 44 by 44 px.; The checklist uses native checkboxes with labels and progress is announced politely.; Hours are rendered as text such as Open 08:00 to 20:00 and not only by color.

## Owned data

- `SafeSpot` (classrup.comms.safe_spot/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `comms.safe_spot.draft`, `comms.safe_spot.sign`, `comms.safe_spot.publish`, `comms.safe_spot.retire`, `comms.safe_spot.report`, `comms.curator_list.update`, `comms.safe_spot.suggest`, `comms.safe_spot.set_trust`
- Queries: `comms.safe_spot.list_for_cell`, `comms.curator_list.get`, `comms.safe_spot.checklist`
- Emits: `comms.safe_spot.suggested`
- Consumes: `security.role.assigned`, `security.role.revoked`

## Dependencies

F06.S02.M01, F16.S01.M01, F16.S02.M03, F11.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-066-01 | [Domain schema](domain_schema.md) | 5 |
| PS-066-02 | [Validation rules](validation_rules.md) | 4 |
| PS-066-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-066-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-066-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-066-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-066-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-066-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-066-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-066-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/meetups/safe/index.ts`.

## Acceptance criteria

- All tests T01 to T21 pass in CI.
- Network and storage captures show zero user location data in any flow of this module, and no spot statement contains a cell finer than L2 or a street address.
- The UI never describes a listed spot as safe or verified safe and always shows the trust source.
