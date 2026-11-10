# PS-043-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-043-01. **Owner:** [05_Rentals/02_rental_lifecycle/mod_return](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_return. **Consumers:** events and subscribers listed in [commands_queries_events.md](commands_queries_events.md).

## Purpose and scope
This module records one return per rental. The renter declares that the rented item went back to the owner; the owner confirms the return or disputes it. The module owns the `rental_return` record, its append-only transition log and its command idempotency records. It does not own the rental agreement.

**Business outcome:** at any time a participant or moderator can read one return record that shows who declared the return, when the declared return time falls relative to the agreed due time, whether the owner confirmed or disputed it, and whether the return reached a terminal outcome.

**Exclusions:** item handover (mod_handoff, PS-042); condition assessment, damage claims and evidence (mod_damage, PS-041); deposit hold, release or forfeiture (mod_deposits, PS-040); payment, late fees and any money movement (no platform custody, DECISIONS D09); exact addresses or coordinates; reputation scoring (F07 consumes signals only).

## Requirements
- PS-043-01.R01: Business outcome, actors and exclusions as stated above. Actors: renter, owner, moderator (dispute resolution only), system scheduler. A confirmed return does not imply that item condition, deposit or payment is settled.
- PS-043-01.R02: Case coverage. Normal: initiate, declare, confirm. Invalid: non-renter initiates, rental not handed off, malformed timestamp. Expired: initiation after window, owner response after window. Duplicate: same Idempotency-Key replayed; second active return for the same rental. Concurrent: two owner actions on the same revision. Offline: queued command replayed after reconnect. Adversarial: back-dated or future returned_at, replayed commands, owner dispute spam, actor acting on a rental they are not party to.
- PS-043-01.R03: Accessibility and localization: the returned-at control has an accessible label and states its time zone; the server stores UTC; the PWA renders times in the participant's device time zone. Budgets are defined in PS-043-08.
- PS-043-01.R04: Field-level schema in Table 1 is complete. No column may hold a legal name, email address, telephone number, postal address or coordinates. A schema lint test enforces this (TEST-PS-043-01-T02).
- PS-043-01.R05: Timing classification. At declaration the server computes `timing` and `lateness_minutes` from `returned_at` and `due_at` using the rule in Section "Timing rule".
- PS-043-01.R06: Every state change increments `revision` by exactly 1 and writes exactly one `rental_return_transition` row in the same database transaction.

## Timing rule
`grace` = 60 minutes (A-return-04).
- `early` if `returned_at < due_at - grace`.
- `late` if `returned_at > due_at + grace`.
- `on_time` otherwise.
- `lateness_minutes` = 0 unless `timing = late`; then `ceil((returned_at - due_at) / 60 s)`.

## Table 1 — rental_return (aggregate root)
| name | type | null | constraints | default | example |
|---|---|---|---|---|---|
| return_id | text (ULID, 26 chars) | no | PK; `^[0-9A-HJKMNP-TV-Z]{26}$` | generated | 01J8XRTN000000000000000001 |
| rental_id | text (ULID) | no | FK to rental_agreement projection; immutable | none | 01J8XRNT000000000000000001 |
| renter_participant_id | text (ULID, F07 pseudonym) | no | immutable | none | 01J8XPART00000000000000001 |
| owner_participant_id | text (ULID, F07 pseudonym) | no | immutable; must differ from renter_participant_id | none | 01J8XPART00000000000000002 |
| state | enum (9 values, Section "State enum") | no | see workflow_state_machine.md | initiated | declared |
| revision | integer | no | >= 1; +1 per transition; optimistic lock | 1 | 2 |
| due_at | timestamptz (UTC) | no | copied from rental_agreement at initiation; immutable | none | 2026-11-14T18:00:00Z |
| handoff_at | timestamptz (UTC) | no | copied from rental_agreement at initiation; immutable | none | 2026-11-10T09:00:00Z |
| return_point_ref | text (ULID) | yes | must be one of the agreement's return_point_refs; no coordinates | null | 01J8XRPT000000000000000001 |
| initiated_at | timestamptz (UTC) | no | server clock | now() | 2026-11-14T17:40:13Z |
| returned_at | timestamptz (UTC) | yes | set at declare; handoff_at <= returned_at <= declared_at + 300 s | null | 2026-11-14T17:35:00Z |
| declared_at | timestamptz (UTC) | yes | server clock at declare | null | 2026-11-14T17:40:20Z |
| timing | enum: early, on_time, late | yes | set at declare | null | on_time |
| lateness_minutes | integer | yes | >= 0; 0 unless timing = late | null | 0 |
| condition_declared | enum: unchanged, changed_noted | yes | required at declare | null | unchanged |
| renter_note | text | yes | 0-280 code points after NFC; no control or bidi characters | null | Returned in same condition. |
| owner_note | text | yes | same as renter_note | null | Received, matches agreement. |
| dispute_reason_code | enum: not_received, condition_differs, timing_disputed, other | yes | required when state enters disputed | null | condition_differs |
| dispute_opened_at | timestamptz (UTC) | yes | set at dispute | null | 2026-11-15T10:02:00Z |
| owner_responded_at | timestamptz (UTC) | yes | set at confirm or dispute | null | 2026-11-15T10:02:00Z |
| resolution_ref | text (ULID) | yes | moderation decision reference (A-return-08) | null | 01J8XMOD000000000000000001 |
| terminal_at | timestamptz (UTC) | yes | set when state is terminal | null | 2026-11-15T10:05:00Z |
| legal_hold_ref | text (ULID) | yes | set only by F10 legal-hold service; blocks retention jobs | null | 01J8XHLD000000000000000001 |
| schema_version | integer | no | 1 for this spec | 1 | 1 |
| created_at | timestamptz (UTC) | no | server clock | now() | 2026-11-14T17:40:13Z |
| updated_at | timestamptz (UTC) | no | server clock on every transition | now() | 2026-11-14T17:40:20Z |

## Table 2 — rental_return_transition (append-only)
| name | type | null | constraints | example |
|---|---|---|---|---|
| transition_id | text (ULID) | no | PK | 01J8XTRN000000000000000001 |
| return_id | text (ULID) | no | FK to rental_return | 01J8XRTN000000000000000001 |
| revision | integer | no | unique with return_id; equals rental_return.revision after the transition | 2 |
| from_state | enum (9 values) | yes | null only for the initial row | initiated |
| to_state | enum (9 values) | no | must be an allowed transition | declared |
| actor_role | enum: renter, owner, moderator, system | no | | renter |
| actor_participant_id | text (ULID) | yes | null when actor_role = system | 01J8XPART00000000000000001 |
| command_idempotency_key | text (26-128 chars) | yes | null for system transitions | 01J8XIDK0000000000000000A1 |
| reason_code | text | yes | dispute_reason_code, moderation outcome or timer name | window_elapsed |
| occurred_at | timestamptz (UTC) | no | server clock | 2026-11-14T17:40:20Z |

Rows are never updated or deleted by application code. The retention job (PS-043-07) is the only deleter.

## Table 3 — rental_agreement projection (read-only, owner mod_handoff, A-return-02)
| name | type | null | notes |
|---|---|---|---|
| rental_id | text (ULID) | no | key |
| renter_participant_id | text (ULID) | no | |
| owner_participant_id | text (ULID) | no | |
| handoff_state | enum: pending, handed_off, closed | no | initiation requires handed_off |
| handed_off_at | timestamptz (UTC) | yes | copied to rental_return.handoff_at |
| due_at | timestamptz (UTC) | no | copied to rental_return.due_at |
| return_point_refs | array of ULID | no | at most 20 entries |

## State enum
`initiated`, `declared`, `unconfirmed`, `disputed`, `confirmed`, `cancelled`, `abandoned`, `closed_unconfirmed`, `closed_disputed`.

## Key constraints (PostgreSQL-compatible DDL is illustrative; storage choice is F15)
```sql
CHECK (state IN ('initiated','declared','unconfirmed','disputed','confirmed','cancelled','abandoned','closed_unconfirmed','closed_disputed'))
CHECK (renter_participant_id <> owner_participant_id)
CHECK (timing IS NULL OR timing IN ('early','on_time','late'))
CHECK (lateness_minutes IS NULL OR lateness_minutes >= 0)
CREATE UNIQUE INDEX rental_return_one_active ON rental_return (rental_id)
  WHERE state IN ('initiated','declared','unconfirmed','disputed');
CREATE UNIQUE INDEX rental_return_transition_rev ON rental_return_transition (return_id, revision);
```

## Dependencies and predecessor specifications
Parent [module SPEC](SPEC.md); [project trust model](../../../PROJECT_SPEC.md); [decisions](../../../DECISIONS.md) D07, D08, D09. Canonical contracts referenced, not duplicated: CTR-ID-001 (IDs), CTR-SCH-001 (schema_version), CTR-EVT-001 (envelope), CTR-ERR-001 (typed errors), CTR-CAP-001 (capabilities), CTR-PRV-001 (classes), see [planning/CONTRACTS.md](../../../planning/CONTRACTS.md). Shared: F07 (participant pseudonyms, blocks), F10 (privacy classes, legal hold), F15 (storage, outbox, configuration), F16 (authorization, transport security).

## Open decisions
- A-return-01: Identifiers are ULIDs (26 chars, Crockford base32) until CTR-ID-001 is resolved by F15.
- A-return-02: The rental agreement is owned by mod_handoff. This module holds the read-only projection in Table 3, fed by handoff events. No rental_agreement contract exists in CONTRACTS.md; a cross-module contract is required.
- A-return-03: Initiation is allowed from `handoff_at` until `due_at + 30 days`.
- A-return-04: Timing grace is 60 minutes, configurable 0-240 under the rental_return configuration namespace.
