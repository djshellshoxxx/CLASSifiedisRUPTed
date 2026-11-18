# PS-041-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-041-01. **Owner:** [05_Rentals/02_rental_lifecycle/mod_damage](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_damage. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); named in the Dependencies section of this file.

## Purpose and scope
After a rental item is returned, the lender records one damage claim per item per return. The claim carries a category, a claimed amount in integer minor units, a description and optional evidence metadata. The renter accepts, counters or disputes it. The module stores these as self-attested assertions plus an append-only event log.

Exclusions: no deposit custody, payments, refunds or currency conversion (D09, D03 remain OPEN and are not decided here); no ownership of rental agreement, return or item records (mod_handoff, mod_return, 05_Rentals/01_rental_catalog); no storage of evidence bytes; no verification of physical condition; no legal liability decision; no federated payloads (CTR-FED-001 not used).

## Requirements
- **PS-041-01.R01** Outcome and actors. Actors are lender (party to the rental), renter (party to the rental), moderator (role issued by F12) and system scheduler (service identity). Each claim has exactly one lender and one renter, and they must differ.
- **PS-041-01.R02** Case coverage. The schema must represent normal (open, respond, resolve), invalid (out-of-range values, unknown enums), expired (passed deadlines), duplicate (second open for the same item and return), concurrent (two commands on one revision), offline (queued command with a stale revision), and adversarial cases (non-party reads, hash mismatch, replayed keys). Enforcement rules live in validation_rules.md, workflow_state_machine.md and failure_recovery_idempotency.md.
- **PS-041-01.R03** Accessibility, localization, performance. Text fields are stored as UTF-8 in Unicode NFC. Amounts are integers in the minor units of the ISO 4217 currency (exponent 2 for USD, 0 for JPY). No locale-formatted strings are stored; the client resolves labels from keys. Indexes must support claim read p95 at or below 200 ms (observability_performance.md).
- **PS-041-01.R04** Canonical IDs and versions. IDs follow CTR-ID-001. Every record and event carries `schema_version` "1.0" under CTR-SCH-001. This file lists fields only and does not duplicate the registry.

## Entities

### damage_claim
| Field | Type | Null | Constraints | Default | Example (illustrative) |
|---|---|---|---|---|---|
| claim_id | string(26) | no | ULID, primary key, immutable | generated | 01J9ZCMX0000000000000000A1 |
| rental_ref_id | string(26) | no | opaque reference (A-damage-02) | none | 01J9ZRNT0000000000000000B2 |
| return_ref_id | string(26) | no | opaque reference; return must be recorded before open | none | 01J9ZRTN0000000000000000D4 |
| rental_item_ref | string(26) | no | opaque reference to the rented item | none | 01J9ZITM0000000000000000E5 |
| lender_participant_id | string(26) | no | pseudonymous ID from F07; immutable | none | participant_id_lender |
| renter_participant_id | string(26) | no | pseudonymous ID from F07; differs from lender | none | participant_id_renter |
| state | enum | no | one of the 8 states in workflow_state_machine.md | OPEN | OPEN |
| category | enum | no | cosmetic, functional, missing_part, cleaning, total_loss, other | none | functional |
| description_text | string | no | 1–2000 code points after NFC and trim; no control characters except LF | none | "Left hinge bent." |
| claimed_amount_minor | int64 | no | 1 to 100000000 inclusive (A-damage-04) | none | 4500 |
| currency_code | char(3) | no | uppercase ISO 4217; equals rental agreement currency | none | USD |
| counter_amount_minor | int64 | yes | 1 to claimed_amount_minor; non-null only in COUNTER_PROPOSED | NULL | 3000 |
| agreed_amount_minor | int64 | yes | 0 to 100000000; required when resolution_kind is agreed_amount, moderated_agreed or external_arrangement | NULL | 3000 |
| resolution_kind | enum | no | none, agreed_amount, agreed_no_charge, withdrawn, expired, moderated_agreed, moderated_no_charge, external_arrangement | none | none |
| state_due_at | timestamp | yes | deadline for the current state; NULL in terminal states | opened_at + 14 days | 2026-11-24T10:00:00.000Z |
| response_due_at | timestamp | no | reminder only (opened_at + 72 hours); does not close the response window | opened_at + 72 hours | 2026-11-13T10:00:00.000Z |
| opened_at | timestamp | no | server UTC, RFC 3339, millisecond precision, `Z` suffix | server clock | 2026-11-10T10:00:00.000Z |
| resolved_at | timestamp | yes | set when state is terminal | NULL | NULL |
| hold_active | boolean | no | set only by moderation (damage.moderation.hold) | false | false |
| hold_remaining_ms | int64 | yes | timer time left while a hold is active (A-damage-11) | NULL | NULL |
| revision | int | no | 1 or greater; incremented by every claim-changing command | 1 | 3 |
| lender_revision_count | int | no | 0 to 2 (A-damage-10) | 0 | 1 |
| schema_version | string | no | "1.0" | "1.0" | "1.0" |
| created_at | timestamp | no | server UTC | server clock | 2026-11-10T10:00:00.000Z |
| updated_at | timestamp | no | server UTC; equals occurred_at of the latest event | server clock | 2026-11-10T10:05:00.000Z |

Constraints:
- At most one non-terminal claim per (rental_ref_id, return_ref_id, rental_item_ref). Enforced by a unique partial index.
- Terminal states (AGREED, WITHDRAWN, EXPIRED, CLOSED_NO_CHARGE, CLOSED_EXTERNAL) have `state_due_at` NULL and `resolved_at` set.
- `counter_amount_minor` is non-null if and only if `state` is COUNTER_PROPOSED.

### damage_evidence
| Field | Type | Null | Constraints | Default |
|---|---|---|---|---|
| evidence_id | string(26) | no | ULID, primary key | generated |
| claim_id | string(26) | no | foreign key to damage_claim | none |
| submitted_by_participant_id | string(26) | no | must be a party to the claim | none |
| kind | enum | no | photo, document, note | none |
| media_ref | string(1–128) | yes | opaque storage reference (A-damage-03); never a URL; NULL when kind = note | NULL |
| sha256_hex | char(64) | yes | lowercase hex of media bytes; NULL when kind = note | NULL |
| content_type | enum | yes | image/jpeg, image/png, image/webp, application/pdf; NULL when kind = note | NULL |
| byte_size | int64 | yes | 1 to 15728640 (A-damage-06); NULL when kind = note | NULL |
| exif_stripped | boolean | no | must be true for images; false is rejected | true |
| caption_text | string | yes | 0–200 code points, NFC; text alternative for assistive tech | NULL |
| note_text | string | yes | 1–1000 code points, NFC; required when kind = note | NULL |
| attached_at | timestamp | no | server UTC | server clock |

### damage_response
| Field | Type | Null | Constraints |
|---|---|---|---|
| response_id | string(26) | no | ULID, primary key |
| claim_id | string(26) | no | foreign key to damage_claim |
| responder_participant_id | string(26) | no | must be the renter of the claim |
| response_kind | enum | no | accept, counter, dispute |
| seen_revision | int | no | equals expected_revision supplied with the command |
| counter_amount_minor | int64 | yes | required if and only if response_kind = counter; 1 to claimed_amount_minor |
| comment_text | string | yes | 0–1000 code points, NFC |
| submitted_at | timestamp | no | server UTC |

A claim accepts at most one effective response per revision (unique on claim_id and seen_revision).

### damage_attestation (external arrangement)
| Field | Type | Null | Constraints |
|---|---|---|---|
| attestation_id | string(26) | no | ULID, primary key |
| claim_id | string(26) | no | foreign key to damage_claim |
| role | enum | no | lender or renter; unique with claim_id, replaceable by the same role |
| attested_by_participant_id | string(26) | no | must be the participant holding that role |
| amount_minor | int64 | no | 0 to 100000000 |
| currency_code | char(3) | no | equals claim currency_code |
| attested_at | timestamp | no | server UTC |

An attestation is a self-attested statement. It creates no payment, transfer or custody.

### damage_event (append-only)
| Field | Type | Null | Constraints |
|---|---|---|---|
| event_id | string(26) | no | ULID, primary key |
| claim_id | string(26) | no | foreign key to damage_claim |
| sequence | int | no | 1 or greater; unique with claim_id; gap-free per claim |
| event_type | enum | no | values listed in commands_queries_events.md |
| actor_kind | enum | no | participant, moderator, system |
| actor_participant_id | string(26) | yes | NULL when actor_kind = system |
| idempotency_key | string(26) | yes | NULL for system events |
| occurred_at | timestamp | no | server UTC |
| payload_json | json | no | identifiers, states, amounts and enums only; no free text (A-damage-13) |
| payload_sha256 | char(64) | no | hash of canonical payload_json |
| schema_version | string | no | "1.0" |

## Provenance and ownership
- This module owns the rows for damage_claim, damage_evidence (metadata), damage_response, damage_attestation and damage_event.
- The event log is the source of truth for history. Claim rows are projections updated in the same transaction as the event append.
- This module does not own: rental agreements, return records, rental items (other 05_Rentals modules), participant identity (F07), evidence media bytes (A-damage-03), moderation cases (F12), notifications (F13) or payment evidence (F09).

## Dependencies and consumers
- Upstream: F07 (participant IDs, blocks), mod_handoff (rental_ref_id), mod_return (return_ref_id), F10 (data classes), F12 (holds and resolutions), F15 (platform), F16 (capabilities).
- Downstream: F13 (opened, counter, deadline and expiry notices), F12 (escalations and holds), F09 (resolutions as assertions only; no payment initiated), F10 (export and deletion).

## Assumptions
- **Assumption A-damage-01:** Identifiers are 26-character uppercase Crockford base32 ULIDs until CTR-ID-001 closes (the UUID/ULID choice is OPEN).
- **Assumption A-damage-02:** `rental_ref_id`, `return_ref_id` and `rental_item_ref` are opaque references owned by mod_handoff, mod_return and 05_Rentals/01_rental_catalog. This module never writes those records.
- **Assumption A-damage-03:** Evidence bytes are stored in shared evidence storage addressed by `media_ref`. This module keeps only metadata and the SHA-256 digest.
- **Assumption A-damage-04:** Claimed amounts are in the currency of the rental agreement. The cap is 100000000 minor units per claim. No FX conversion happens in this module.
- **Assumption A-damage-05:** A claim may be opened only within 7 days after the return is recorded.
- **Assumption A-damage-06:** A claim has at most 10 evidence items. Each item is at most 15728640 bytes (15 MiB). Allowed content types are image/jpeg, image/png, image/webp and application/pdf.

## Open decisions
- D03 (mixed-currency valuation) remains OPEN. A-damage-04 avoids the question by requiring one currency per claim.
- D09 (rentals and deposits) remains OPEN. This module assumes no deposit custody; any money movement happens outside the platform.
- A-damage-01 is blocked until CTR-ID-001 is decided.
- A-damage-02 and A-damage-05 depend on the return and handoff specs, which are not yet written.
