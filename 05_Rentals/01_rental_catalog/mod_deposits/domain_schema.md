# PS-040-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-040-01. **Owner:** [05_Rentals/01_rental_catalog/mod_deposits](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_deposits. **Consumers:** notifications (state change events), moderation (disputes), observability, rental lifecycle (read of rental status), payment evidence (CTR-COM-001 references only).

## Purpose and scope
Define the persisted model for rental deposits: deposit terms, consent per terms revision, self-attested settlement claims, and an append-only history. The module does not assume successful external settlement and never holds, moves or converts money. Canonical ID, envelope, error and schema rules are referenced from planning/CONTRACTS.md (CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001) and are not duplicated here.

## Requirements
- PS-040-01.R01: Business outcome: a depositor and a receiver agree on one deposit amount for one rental. Each terms revision is accepted by the non-proposing party. Parties then record self-attested payment, receipt, return or withholding claims until the deposit is settled, expired or cancelled. Actors: depositor (renter who pays the deposit), receiver (lessor who holds and returns it), dispute_moderator (scoped resolver), operator (configuration only), system timer. Exclusions: payment processing, escrow, custody, FX, crypto assets, damage assessment, insurance, identity verification, rental booking lifecycle, notification delivery, dispute adjudication policy.
- PS-040-01.R02: Case coverage is specified in workflow_state_machine.md, validation_rules.md and failure_recovery_idempotency.md: normal, invalid, expired, duplicate, concurrent, offline replay, and adversarial cases (non-party access, forged party IDs, replayed commands).
- PS-040-01.R03: Amounts are always shown with currency code and locale formatting. Deposit state is conveyed by a text label, never by color alone. Error text is localized through message_key. Budgets are in observability_performance.md.
- PS-040-01.R04: Money is stored as int64 minor units plus currency_code. Floating point and decimal strings are forbidden. cap_minor(currency) = 1,000,000 × 10^exponent (A-deposits-03).
- PS-040-01.R05: Identifiers are a fixed prefix plus a 26-character Crockford base32 ULID. Prefixes: dep_, dtr_, dev_, evt_, tmr_ (own records); rnt_, lst_, par_ (references owned elsewhere) (A-deposits-01).
- PS-040-01.R06: Depositor and receiver identities are resolved server-side from rental_ref through the rental lifecycle read contract. Client-supplied party IDs are rejected.
- PS-040-01.R07: No free-text column exists in v1 deposit tables. Only enumerated codes are stored (A-deposits-06).
- PS-040-01.R08: Every row carries schema_version = 1, created_at and updated_at in UTC RFC 3339 with millisecond precision. The deposit row carries a monotonic revision.

## Entities

### deposit
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| deposit_id | string | no | `dep_` + 26 chars; primary key; immutable | generated | dep_01JZ8M3QF4T7X2K9R0W5ABCDEF |
| rental_ref | string | no | `rnt_` + 26 chars; unique while state is not terminal (A-deposits-04) | none | rnt_01JZ8M4A1B2C3D4E5F6G7H8J9K |
| listing_ref | string | no | `lst_` + 26 chars; immutable (A-deposits-31) | none | lst_01JZ8M5K2P3Q4R5S6T7V8W9X0Y |
| depositor_participant_id | string | no | `par_` + 26 chars; resolved from rental_ref; immutable | none | par_01JZ8N0A7B6C5D4E3F2G1H0J9K |
| receiver_participant_id | string | no | `par_` + 26 chars; must differ from depositor (CHECK) | none | par_01JZ8P1B2C3D4E5F6G7H8J9K0M |
| state | enum | no | one of 11 states in workflow_state_machine.md | draft | proposed |
| revision | int64 | no | >= 1; +1 on every committed change | 1 | 2 |
| term_revision_no | int32 | no | >= 1; equals the highest deposit_term_revision row | 1 | 1 |
| proposer_participant_id | string | yes | must be a party; null in draft | null | par_01JZ8N0A7B6C5D4E3F2G1H0J9K |
| amount_minor | int64 | no | 1 to cap_minor(currency_code) | none | 25000 |
| currency_code | char(3) | no | ISO 4217 uppercase, in allowlist (A-deposits-02) | none | EUR |
| method_code | enum | no | cash_in_person, bank_transfer_external, payment_app_external, other_external | none | bank_transfer_external |
| withheld_minor | int64 | no | 0 to amount_minor | 0 | 0 |
| returned_minor | int64 | no | 0 to amount_minor; returned + withheld = amount when settled | 0 | 0 |
| settlement_outcome | enum | yes | non-null only when state = settled: returned_full, returned_partial, returned_unconfirmed, withheld_accepted, withheld_upheld | null | returned_full |
| closure_reason | enum | yes | non-null only when state is expired or cancelled: expired, cancelled_by_depositor, cancelled_by_receiver, declined, withdrawn | null | declined |
| dispute_reason_code | enum | yes | non-null only when state = disputed: no_response, payment_disputed, return_disputed, withhold_disputed | null | withhold_disputed |
| expires_at | timestamp | yes | current timer deadline; null in settled, expired, cancelled | null | 2026-11-17T09:00:00.000Z |
| created_at / updated_at | timestamp | no | UTC, ms precision | now | 2026-11-10T09:00:00.000Z |
| settled_at | timestamp | yes | set on entry to settled, expired or cancelled | null | null |
| schema_version | int32 | no | 1 | 1 | 1 |

### deposit_term_revision (immutable terms per proposal)
| Field | Type | Null | Constraints |
|---|---|---|---|
| term_revision_id | string | no | `dtr_` + 26 chars; primary key |
| deposit_id | string | no | foreign key to deposit |
| term_revision_no | int32 | no | >= 1; unique with deposit_id |
| amount_minor | int64 | no | same bounds as deposit.amount_minor; immutable |
| currency_code / method_code | as deposit | no | immutable |
| proposer_participant_id | string | no | a party of the deposit; immutable |
| status | enum | no | open, accepted, superseded, withdrawn |
| proposed_at / resolved_at | timestamp | no / yes | resolved_at set once status leaves open |

### deposit_evidence (never changes state by itself)
| Field | Type | Null | Constraints |
|---|---|---|---|
| evidence_id | string | no | `dev_` + 26 chars; primary key |
| deposit_id | string | no | foreign key to deposit |
| submitted_by_participant_id | string | no | must be a party of the deposit |
| evidence_kind | enum | no | payment_claim, payment_receipt_signed, return_claim, withhold_claim, dispute_support_ref |
| external_ref | string | yes | 8 to 128 chars, `[A-Za-z0-9_-]`; opaque reference issued by CTR-COM-001 or a signature verifier; never raw account or card data |
| self_attested | boolean | no | default true |
| verification_source | enum | no | none, ctr_com_001, signature_verifier; default none |
| state_at_submit | enum | no | state of the deposit when evidence was attached |
| submitted_at | timestamp | no | UTC, ms |

### deposit_event (append-only, one row per committed change)
| Field | Type | Null | Constraints |
|---|---|---|---|
| event_id | string | no | `evt_` + 26 chars; primary key |
| deposit_id | string | no | foreign key |
| revision | int64 | no | equals deposit.revision after the change; unique with deposit_id |
| command | enum | no | a command name from commands_queries_events.md, or `system.timer` |
| from_state / to_state | enum | no / no | states from workflow_state_machine.md |
| actor_participant_id | string | yes | null for system timers |
| idempotency_key_hash | string | yes | SHA-256 hex; null for system timers |
| occurred_at | timestamp | no | UTC, ms |

### deposit_timer
| Field | Type | Null | Constraints |
|---|---|---|---|
| timer_id | string | no | `tmr_` + 26 chars; primary key |
| deposit_id | string | no | foreign key |
| timer_kind | enum | no | draft_expiry, proposal_expiry, payment_window, withhold_response, return_confirm |
| fire_at | timestamp | no | UTC, ms |
| scheduled_revision | int64 | no | deposit.revision when the timer was created |
| status | enum | no | pending, fired, cancelled, superseded |

### deposit_idempotency_record
| Field | Type | Null | Constraints |
|---|---|---|---|
| scope_key | string | no | unique tuple of actor_participant_id, command, idempotency_key |
| request_hash | string | no | SHA-256 hex of canonical JSON request body |
| response_snapshot | JSON | no | response body without personal data |
| expires_at | timestamp | no | created_at + 72 hours (A-deposits-14) |

## Relationships
deposit 1 to N deposit_term_revision; deposit 1 to N deposit_evidence; deposit 1 to N deposit_event; deposit 1 to N deposit_timer. deposit_idempotency_record is keyed by actor and command, not by deposit.

## Assumptions and open decisions
- A-deposits-01: ID format is prefix plus ULID. CTR-ID-001 may select UUID instead. Prefixes are fixed by this spec.
- A-deposits-02: v1 accepts only fiat ISO 4217 codes in an allowlist (default EUR, USD). No crypto assets, no FX conversion.
- A-deposits-03: cap_minor = 1,000,000 major units multiplied by 10^exponent of the currency.
- A-deposits-04: One non-terminal deposit per rental_ref. One amount per rental. No installments.
- A-deposits-05: Amounts are JSON integers only (see validation_rules.md).
- A-deposits-06: No free text in v1 records; reason codes only.
- A-deposits-30: rental_status values used here are provisional until 02_rental_lifecycle publishes its contract.
- A-deposits-31: listing_ref is resolved from the catalog listing owner. That contract is not yet in planning/CONTRACTS.md.
- Open: D09 (rentals/deposits, no platform custody) and D07 (retention) in DECISIONS.md. This file takes D09 as the working default.

## Test cases
- TEST-PS-040-01-T01: Insert a deposit with amount_minor = 0 is rejected by the database CHECK constraint. Pass: insert fails. Fail: row persists.
- TEST-PS-040-01-T02: Insert a second non-terminal deposit for the same rental_ref. Pass: unique index rejects it. Fail: second row persists.
- TEST-PS-040-01-T03: Update amount_minor on a deposit_term_revision row. Pass: update rejected. Fail: update succeeds.
