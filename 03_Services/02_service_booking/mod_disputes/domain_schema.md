# PS-030-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-030-01. **Owner:** [03_Services/02_service_booking/mod_disputes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_disputes. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); event subscribers in [commands_queries_events.md](commands_queries_events.md).

## Purpose and scope
Defines the persisted records owned by this module: the dispute header, statements, evidence references, settlement proposals, resolutions, an append-only transition log and an idempotency store. A dispute is a structured, time-bounded claim by one booking party that the other party did not meet an agreed service obligation. It is an evidence and workflow record only. The platform never holds funds, never moves money, and never confirms that an external settlement took place.

Exclusions: booking, quote and milestone records (parent service_booking, sibling [mod_quotes](../mod_quotes/SPEC.md) and [mod_milestones](../mod_milestones/SPEC.md)); identity credentials and block records (F07); binary evidence storage (shared upload service, A-disputes-05); payment evidence and finality (CTR-COM-001, F09); federated dispute exchange (deferred, A-disputes-15); legal-hold workflow (F10 governance).

## Requirements
- **PS-030-01.R01**: Business outcome: a claimant records a structured dispute against one booking, or one milestone of it. The respondent answers. Either party attaches evidence and may propose a mutual settlement. A moderator records an advisory outcome visible to both parties. Actors: claimant, respondent, moderator, system timer. Exclusions as above.
- **PS-030-01.R02**: Cases covered: normal open, respond, decide; booking in an ineligible state; response window expired; second active dispute on the same booking or milestone; concurrent respond and withdraw; oversized evidence; forged evidence hash; non-party actor. Each maps to a code in [validation_rules.md](validation_rules.md) and a test in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).
- **PS-030-01.R03**: UI strings are referenced by message key, never stored translated. Record budgets: dispute header at most 2 KB; all statements for one dispute at most 64 KB; evidence metadata at most 1 KB per item, excluding binaries. Read-path latency budget is in [observability_performance.md](observability_performance.md).
- **PS-030-01.R04**: Every record carries `schema_version` and `revision` (CTR-SCH-001, CTR-ID-001). Revision starts at 1 and increments on every accepted write to the aggregate.
- **PS-030-01.R05**: Money is stored as integer minor units with an ISO 4217 code. This module never converts currency (A-disputes-11).
- **PS-030-01.R06**: Transition, statement and resolution rows are append-only. Corrections are new rows. Only retention purges (per [privacy_retention_abuse.md](privacy_retention_abuse.md)) delete rows.
- **PS-030-01.R07**: Identifiers are opaque. Records never contain names, contact details, exact addresses or precise coordinates. Participants appear only as pseudonymous `pid_` references (A-disputes-02).

## Entities

### dispute (aggregate root)
| Field | Type | Null | Constraint / default | Example |
|---|---|---|---|---|
| dispute_id | text | no | PK; `dsp_` + ULID (26 chars, Crockford base32); immutable | `dsp_01J9ZQ3M7H2K4V8W6X0R5T1N3E` |
| schema_version | smallint | no | constant `1` for v1 | `1` |
| booking_ref | text | no | `bkg_` + ULID; reference only | `bkg_01J9ZQ2A1B3C4D5E6F7G8H9J0K` |
| milestone_ref | text | yes | `mls_` + ULID; null means whole booking | `null` |
| category | text enum | no | `non_delivery`, `scope_mismatch`, `quality`, `provider_no_show`, `client_no_show`, `cancellation_terms`, `payment_claim`, `other` | `non_delivery` |
| status | text enum | no | state set in [workflow_state_machine.md](workflow_state_machine.md); default `open` | `open` |
| claimant_ref | text | no | `pid_` + ULID | `pid_01J9ZQ4R0S1T2U3V4W5X6Y7Z8A` |
| respondent_ref | text | no | `pid_` + ULID; must differ from `claimant_ref` | `pid_01J9ZQ5B9C0D1E2F3G4H5J6K7M` |
| requested_remedy | text enum | no | `none`, `redo_service`, `partial_credit`, `refund`, `apology`, `other_described`; default `none` | `redo_service` |
| claimed_amount_minor | bigint | yes | 0 to 99999999999; required together with `claimed_currency` | `4500` |
| claimed_currency | char(3) | yes | ISO 4217 uppercase, in F09 allowlist | `EUR` |
| opened_at | timestamptz | no | server UTC | `2026-11-10T08:15:00Z` |
| response_due_at | timestamptz | no | `opened_at` + 7 days (A-disputes-07) | `2026-11-17T08:15:00Z` |
| evidence_due_at | timestamptz | yes | set on entry to `responded`: `responded_at` + 7 days | `null` |
| current_reviewer_ref | text | yes | `pid_`; set while `under_review` | `null` |
| reopen_count | smallint | no | 0 to 1; default 0 | `0` |
| appeal_count | smallint | no | 0 to 1; default 0 | `0` |
| revision | integer | no | starts at 1; +1 per accepted write | `3` |
| closed_at | timestamptz | yes | set on entry to a terminal state | `null` |
| created_at, updated_at | timestamptz | no | server UTC | `2026-11-10T08:15:00Z` |

### statement
| Field | Type | Null | Constraint / default | Example |
|---|---|---|---|---|
| statement_id | text | no | PK; `stm_` + ULID | `stm_01J9ZR1A2B3C4D5E6F7G8H9J0K` |
| dispute_id | text | no | FK to dispute | `dsp_01J9ZQ3M7H2K4V8W6X0R5T1N3E` |
| sequence | integer | no | 1 and up, unique per dispute | `1` |
| author_ref | text | no | `pid_` or moderator `pid_` | `pid_01J9ZQ4R0S1T2U3V4W5X6Y7Z8A` |
| author_role | text enum | no | `claimant`, `respondent`, `moderator` | `claimant` |
| kind | text enum | no | `claim`, `response`, `rebuttal`, `settlement_note`, `reviewer_note` | `claim` |
| visibility | text enum | no | `counterparty` or `moderator_only`; `reviewer_note` is always `moderator_only` | `counterparty` |
| body | text | no | 1 to 2000 chars after NFC and trim; `reviewer_note` 1 to 1000 | `Item arrived two weeks late.` |
| created_at | timestamptz | no | server UTC | `2026-11-10T08:15:00Z` |

Cardinality: exactly one `claim` (sequence 1, claimant author); at most one `response` (respondent author); at most 5 `rebuttal` per party.

### evidence
| Field | Type | Null | Constraint / default | Example |
|---|---|---|---|---|
| evidence_id | text | no | PK; `evd_` + ULID | `evd_01J9ZR2C3D4E5F6G7H8J9K0M1N` |
| dispute_id | text | no | FK to dispute | `dsp_01J9ZQ3M7H2K4V8W6X0R5T1N3E` |
| submitted_by_ref | text | no | `pid_` of a party only | `pid_01J9ZQ5B9C0D1E2F3G4H5J6K7M` |
| kind | text enum | no | `image`, `pdf`, `text_note`, `external_link` | `image` |
| state | text enum | no | `pending`, `available`, `withdrawn`, `quarantined` | `available` |
| content_type | text | yes | `image/jpeg`, `image/png`, `image/webp`, `application/pdf`; null for text and link kinds | `image/jpeg` |
| content_text | text | yes | `text_note` up to 2000 chars; `external_link` https URL up to 2048 chars | `null` |
| upload_ref | text | yes | `upl_` + ULID; binary kinds only; cleared on finalize | `upl_01J9ZR3D4E5F6G7H8J9K0M1N2P` |
| size_bytes | integer | yes | 0 to 20971520 for binary kinds | `1843200` |
| sha256 | char(64) | yes | lowercase hex; binary kinds only; computed server-side | `9f86d081884c7d659a2feaa0c55ad015...` (64 chars) |
| label | text | yes | up to 120 chars | `Photo of damage` |
| created_at, finalized_at, withdrawn_at | timestamptz | yes (last two) | server UTC | `null` |

### settlement_proposal
| Field | Type | Null | Constraint / default | Example |
|---|---|---|---|---|
| settlement_id | text | no | PK; `stl_` + ULID | `stl_01J9ZR4E5F6G7H8J9K0M1N2P3Q` |
| dispute_id | text | no | FK to dispute | `dsp_01J9ZQ3M7H2K4V8W6X0R5T1N3E` |
| proposed_by_ref | text | no | `pid_` of a party | `pid_01J9ZQ4R0S1T2U3V4W5X6Y7Z8A` |
| note | text | yes | up to 1000 chars | `Agreed to a partial refund outside the platform.` |
| status | text enum | no | `proposed`, `accepted`, `rejected`, `expired`, `superseded` | `proposed` |
| proposed_at | timestamptz | no | server UTC | `2026-11-12T10:00:00Z` |
| expires_at | timestamptz | no | `proposed_at` + 72 hours | `2026-11-15T10:00:00Z` |
| decided_by_ref, decided_at | text, timestamptz | yes | set on accept or reject | `null` |

### resolution
| Field | Type | Null | Constraint / default | Example |
|---|---|---|---|---|
| resolution_id | text | no | PK; `rsl_` + ULID | `rsl_01J9ZR5F6G7H8J9K0M1N2P3Q4R` |
| dispute_id | text | no | FK to dispute | `dsp_01J9ZQ3M7H2K4V8W6X0R5T1N3E` |
| outcome | text enum | no | `claimant_upheld`, `respondent_upheld`, `partially_upheld`, `no_fault_recorded`, `mutual_settlement`, `withdrawn`, `rejected_at_intake` | `partially_upheld` |
| decided_by | text enum | no | `moderator`, `mutual`, `claimant`, `system` | `moderator` |
| decided_by_ref | text | yes | `pid_` for moderator, claimant or respondent; null for `mutual` and `system` | `pid_01J9ZQ6H0J1K2M3N4P5Q6R7S8T` |
| reason_code | text enum | no | list in [validation_rules.md](validation_rules.md) | `evidence_mixed` |
| decision_text | text | yes | up to 1000 chars; counterparty-visible | `Photos support damage; delivery date unclear.` |
| decided_at | timestamptz | no | server UTC | `2026-11-20T12:00:00Z` |
| appeal_deadline_at | timestamptz | yes | `decided_at` + 14 days when `decided_by` is `moderator` | `2026-12-04T12:00:00Z` |
| appeal_round | smallint | no | 0 for first decision, 1 for appeal decision | `0` |
| superseded_by_ref | text | yes | `rsl_` of a later row | `null` |

### transition (append-only log)
| Field | Type | Null | Constraint / default | Example |
|---|---|---|---|---|
| transition_id | text | no | PK; `trn_` + ULID | `trn_01J9ZR6G7H8J9K0M1N2P3Q4R5S` |
| dispute_id | text | no | FK; unique with `revision` | `dsp_01J9ZQ3M7H2K4V8W6X0R5T1N3E` |
| revision | integer | no | aggregate revision after the write | `2` |
| from_status | text enum | yes | null on creation | `open` |
| to_status | text enum | no | state set | `responded` |
| trigger | text | no | command or timer name | `RespondToDispute` |
| actor_role | text enum | no | `claimant`, `respondent`, `moderator`, `system` | `respondent` |
| actor_ref | text | yes | null for `system` | `pid_01J9ZQ5B9C0D1E2F3G4H5J6K7M` |
| reason_code | text | yes | from validation rules | `null` |
| occurred_at | timestamptz | no | server UTC | `2026-11-11T09:30:00Z` |
| correlation_id | text | no | ULID | `01J9ZR7H8J9K0M1N2P3Q4R5S6T` |

### idempotency_record
| Field | Type | Null | Constraint / default | Example |
|---|---|---|---|---|
| actor_ref | text | no | part of PK | `pid_01J9ZQ4R0S1T2U3V4W5X6Y7Z8A` |
| command_name | text | no | part of PK | `OpenDispute` |
| idempotency_key | text | no | part of PK; 16 to 64 chars, `[A-Za-z0-9_-]` | `01J9ZR8J9K0M1N2P3Q4R5S6T7U` |
| request_hash | char(64) | no | SHA-256 of canonical JSON payload | `e3b0c44298fc1c149afbf4c8996fb924...` |
| state | text enum | no | `in_progress`, `completed` | `completed` |
| response_ref | text | yes | resource ID only, never payload text | `dsp_01J9ZQ3M7H2K4V8W6X0R5T1N3E` |
| created_at | timestamptz | no | server UTC | `2026-11-10T08:15:00Z` |
| expires_at | timestamptz | no | `created_at` + 72 hours | `2026-11-13T08:15:00Z` |

## Keys and constraints
```sql
-- One active dispute per booking (or booking+milestone). Terminal states excluded.
CREATE UNIQUE INDEX disputes_one_active
  ON dispute (booking_ref, COALESCE(milestone_ref, '-'))
  WHERE status NOT IN ('closed', 'resolved_mutual', 'withdrawn', 'rejected_at_intake');

-- One pending settlement proposal per dispute.
CREATE UNIQUE INDEX settlements_one_proposed
  ON settlement_proposal (dispute_id) WHERE status = 'proposed';

-- Transition log is ordered and gap-free per dispute.
CREATE UNIQUE INDEX transitions_revision ON transition (dispute_id, revision);
```
A second dispute on the same booking or milestone after `closed` or `resolved_mutual` is rejected with `DISPUTES_ALREADY_RESOLVED` (see validation_rules.md). After `withdrawn` or `rejected_at_intake`, a new dispute is allowed inside the open window.

## Open decisions
- A-disputes-01: IDs are ULID with type prefixes. CTR-ID-001 (UUID/ULID choice) is OPEN; this module adopts ULID until F15 decides.
- A-disputes-02: `booking_ref`, `milestone_ref` and participant refs are owned by the parent service_booking, sibling modules and F07. This module needs a read-only eligibility query (`GetBookingEligibility`) that is not yet in [CONTRACTS.md](../../../planning/CONTRACTS.md).
- A-disputes-11: Money fields are informational. No FX or valuation (D03 is OPEN).
