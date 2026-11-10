# PS-042-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-042-01. **Owner:** [05_Rentals/02_rental_lifecycle/mod_handoff](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Consumers:** provisional, per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and sibling [mod_return](../mod_return/SPEC.md); subscriber map confirmed in Prompt 3.

## Purpose and scope
Defines the persisted records of a rental handover: the `handoff` record, its condition `handoff_attestation` records, and an append-only `handoff_transition` log. A handoff records that lessor and renter each made a timestamped, attributable, self-attested statement that the item changed hands in an agreed window. It does not prove physical transfer, does not start or settle payment, and holds no deposit.

## Requirements
- PS-042-01.R01 — Business outcome: each rental agreement has at most one active handoff. Each party's handover confirmation is stored as a self-attested, attributable record. A handoff reaches `completed` only after both parties confirm (or a moderator resolves a dispute in favour of completion).
- PS-042-01.R02 — Cases covered: normal (create, both confirm); invalid (window outside agreement bounds, non-party actor, lessor equals renter); expired (no second confirmation before grace end); duplicate (replayed command, second active handoff for same agreement); concurrent (two confirmations racing on one revision); offline (client-timestamped confirmation delivered late); adversarial (forged participant IDs, oversize or contact-bearing notes, evidence refs owned by others).
- PS-042-01.R03 — Presentation and budgets: stored times are UTC RFC 3339 with milliseconds and displayed in the viewer's locale and timezone. Text fields are Unicode NFC. Record reads meet the budgets in [observability_performance.md](observability_performance.md).
- PS-042-01.R04 — This field table is the complete v1 schema (`schema_version = 1`). Adding a field requires a schema version change under CTR-SCH-001 (see [A-handoff-15](commands_queries_events.md)).
- PS-042-01.R05 — Invariants: (a) at most one handoff in states `scheduled`, `reschedule_proposed`, `lessor_confirmed`, `renter_confirmed` or `disputed` per `rental_agreement_id`; (b) `lessor_participant_id` ≠ `renter_participant_id`; (c) at most one attestation per (`handoff_id`, `role`); (d) `handoff_transition.sequence` is gap-free per handoff; (e) terminal records change only through retention or deletion jobs ([privacy_retention_abuse.md](privacy_retention_abuse.md)).

## Exclusions
No money amounts, currency, prices or deposit balances. No escrow or custody. No identity verification of people. No item inventory (owned by 01_rental_catalog). No return or damage records (sibling modules mod_return and mod_damage). No GPS or carrier tracking. Exact addresses are never stored here.

## Entity `handoff`
| Field | Type | Null | Constraints / default | Example |
|---|---|---|---|---|
| handoff_id | string (ULID) | no | PK; server-generated; opaque ([A-handoff-01](#assumptions-and-open-decisions)) | `01HZX3K8Q2M7V9R4T6N1P5C8D0` |
| schema_version | integer | no | constant `1` in v1 | `1` |
| rental_agreement_id | string (ULID) | no | immutable; reference only ([A-handoff-02](#assumptions-and-open-decisions)) | `01HZX3M1B5W0E6Y8R2K4T9N7QA` |
| item_ref | string | no | 1–64 chars, `[A-Za-z0-9_.-]`; catalog-owned | `catalog_item_example_001` |
| item_version | integer | no | ≥ 1; snapshot at create ([A-handoff-03](#assumptions-and-open-decisions)) | `3` |
| lessor_participant_id | string (ULID) | no | pseudonymous; must equal agreement lessor | `01HZX3P4D7E2F9G1H6J3K8N5MR` |
| renter_participant_id | string (ULID) | no | pseudonymous; must equal agreement renter; ≠ lessor | `01HZX3Q9R1S5T8V2W4X6Y0Z3AB` |
| state | enum | no | one of 8 values in [workflow_state_machine.md](workflow_state_machine.md); default `scheduled` | `scheduled` |
| window_start_utc | timestamp | no | rules in [validation_rules.md](validation_rules.md) | `2026-11-20T16:00:00.000Z` |
| window_end_utc | timestamp | no | > window_start; duration 15 min to 7 days ([A-handoff-04](#assumptions-and-open-decisions)) | `2026-11-20T18:00:00.000Z` |
| proposed_window_start_utc | timestamp | yes | non-null only in `reschedule_proposed` | `null` |
| proposed_window_end_utc | timestamp | yes | non-null only in `reschedule_proposed`; same bounds as window | `null` |
| proposed_by_participant_id | string (ULID) | yes | non-null only in `reschedule_proposed`; must be a party | `null` |
| reschedule_proposed_at | timestamp | yes | non-null only in `reschedule_proposed`; drives 48 h auto-decline | `null` |
| reschedule_count | integer | no | 0–3; default 0; +1 per accepted-for-review proposal ([A-handoff-06](#assumptions-and-open-decisions)) | `0` |
| handoff_mode | enum | no | `in_person_meeting` (default), `lessor_premises_pickup`, `renter_premises_delivery` | `in_person_meeting` |
| region_code | string | yes | coarse region from F10 region catalog, privacy class P1; 4–16 chars | `REG-0042` |
| meeting_note | string | yes | 0–140 chars, NFC; no URLs or contact patterns; class P2 ([A-handoff-12](#assumptions-and-open-decisions)) | `North entrance, ring once` |
| deposit_ref | string (ULID) | yes | opaque reference to mod_deposits record; amounts never read ([A-handoff-10](#assumptions-and-open-decisions)) | `null` |
| dispute_reason_code | enum | yes | `item_not_received`, `item_not_as_agreed`, `handover_not_occurred`, `other`; set on dispute | `null` |
| dispute_opened_by_participant_id | string (ULID) | yes | must be a party | `null` |
| lessor_confirmed_at | timestamp | yes | server time of lessor attestation | `2026-11-20T16:04:12.330Z` |
| renter_confirmed_at | timestamp | yes | server time of renter attestation | `null` |
| completed_at | timestamp | yes | set only when state = `completed` | `null` |
| terminal_reason_code | enum | yes | non-null only in `completed`, `cancelled`, `expired`: `both_parties_confirmed`, `dispute_resolved_completed`, `cancel_requested`, `agreement_cancelled`, `window_expired_unconfirmed`, `dispute_resolved_cancelled` | `null` |
| created_by_participant_id | string (ULID) | no | must be a party at create | `01HZX3P4D7E2F9G1H6J3K8N5MR` |
| revision | integer | no | ≥ 1; +1 on every state-changing write; optimistic lock | `3` |
| created_at | timestamp | no | server time | `2026-11-10T09:12:00.000Z` |
| updated_at | timestamp | no | server time; ≥ created_at | `2026-11-10T09:15:31.000Z` |

## Entity `handoff_attestation`
| Field | Type | Null | Constraints / default | Example |
|---|---|---|---|---|
| attestation_id | string (ULID) | no | PK | `01HZX3S6F0G3H8J2K5L7M9N1PQ` |
| handoff_id | string (ULID) | no | FK to `handoff` | `01HZX3K8Q2M7V9R4T6N1P5C8D0` |
| participant_id | string (ULID) | no | must equal lessor or renter of the handoff | `01HZX3P4D7E2F9G1H6J3K8N5MR` |
| role | enum | no | `lessor` or `renter` | `lessor` |
| kind | enum | no | `handover_confirmed` only in v1 | `handover_confirmed` |
| condition_code | enum | no | `as_described`, `minor_wear_noted`, `issue_noted`, `not_assessed` | `as_described` |
| condition_note | string | yes | 0–500 chars, NFC, no URLs or contact patterns; class P2 | `No visible marks` |
| evidence_refs | array of ULID | no | 0–5 items; IDs owned by an evidence store outside this module | `[]` |
| client_recorded_at | timestamp | yes | advisory only; offline capture time ([A-handoff-19](#assumptions-and-open-decisions)) | `2026-11-20T16:03:55.000Z` |
| server_recorded_at | timestamp | no | authoritative time of acceptance | `2026-11-20T16:04:12.330Z` |
| signature | string | yes | reserved; stored if supplied, not validated in v1 ([A-handoff-08](#assumptions-and-open-decisions)) | `null` |
| created_at | timestamp | no | equals server_recorded_at | `2026-11-20T16:04:12.330Z` |

## Entity `handoff_transition` (append-only)
| Field | Type | Null | Constraints | Example |
|---|---|---|---|---|
| transition_id | string (ULID) | no | PK | `01HZX3T2V4W6X8Y0Z1A3B5C7D9` |
| handoff_id | string (ULID) | no | FK; unique with `sequence` | `01HZX3K8Q2M7V9R4T6N1P5C8D0` |
| sequence | integer | no | ≥ 1; gap-free per handoff | `2` |
| from_state | enum | yes | null only for the create transition | `scheduled` |
| to_state | enum | no | one of 8 states | `lessor_confirmed` |
| transition_id_ref | string | no | transition ID from [workflow_state_machine.md](workflow_state_machine.md) (T01–T15) | `T06` |
| actor_kind | enum | no | `participant`, `moderator`, `system` | `participant` |
| actor_participant_id | string (ULID) | yes | null when `actor_kind` = `system` | `01HZX3P4D7E2F9G1H6J3K8N5MR` |
| reason_code | enum | yes | from the transition's reason set | `null` |
| revision_after | integer | no | equals `handoff.revision` after the write | `3` |
| occurred_at | timestamp | no | server time | `2026-11-20T16:04:12.330Z` |

## Assumptions and open decisions
- **Assumption A-handoff-01:** Handoff, attestation and transition IDs are 26-character ULIDs (Crockford base32), treated as opaque by clients. Final choice follows CTR-ID-001, which is OPEN.
- **Assumption A-handoff-02:** The rental agreement record is owned outside this module (rental lifecycle parent or booking flow). This module stores only `rental_agreement_id` and reads agreement status and party IDs by query. The agreement contract is not in CONTRACTS.md and is a cross-module need.
- **Assumption A-handoff-03:** `item_ref` and `item_version` are a snapshot from 01_rental_catalog taken at create, so a later listing edit does not change what was handed over.
- **Assumption A-handoff-08:** Confirmations are self-attested. No signature is required in v1; the `signature` field is reserved. This follows D06 (signed statements only) and does not verify real-world transfer.
- **Assumption A-handoff-10:** `deposit_ref` is an opaque pointer. This module never stores or reads deposit amounts or state (D09 is OPEN).
- **Assumption A-handoff-19:** All timestamps are UTC RFC 3339 with milliseconds. Server time is authoritative. A `client_recorded_at` more than 5 minutes ahead of server time is logged as a skew flag and stored unchanged.
- Open decisions in this file: D05 (region granularity), D09 (deposit ownership), CTR-ID-001 (ID format), CTR-SCH-001 (schema registry).
