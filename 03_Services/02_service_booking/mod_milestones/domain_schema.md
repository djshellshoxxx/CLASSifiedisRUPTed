# PS-031-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review.
**Requirement ID:** PS-031-01. **Owner:** [03_Services/02_service_booking/mod_milestones](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_milestones. **Consumers:** F07 identity, F10 privacy, F15 platform, F16 security (per [dependency matrix](../../../DEPENDENCY_MATRIX.md)); mod_quotes (PS-032) for accepted quote references; mod_disputes (PS-030) for dispute outcomes.

## Purpose and scope
Business outcome: a service provider and a client record an ordered plan of up to 50 milestones attached to one booking and one accepted quote. Both parties give explicit consent to each agreed revision. The module keeps the agreed plan, each submission of evidence, and each accept or reject decision, in append-only form.

Exclusions: no payment, escrow, custody or fund release; amounts are informational allocations only. No proof that work was performed; submissions are self-attested. No dispute adjudication (mod_disputes, PS-030). No quote pricing (mod_quotes, PS-032). No scheduling, service location or booking lifecycle (parent booking record). No deliverable byte storage. No federation (F11).

## Requirements
- PS-031-01.R01: The schema defines six persisted families: `milestone_plan` (mutable), `milestone` (mutable), `milestone_plan_revision` (append-only), `milestone_plan_consent` (append-only), `milestone_submission` (append-only), `milestone_decision` (append-only), plus `milestone_command_log` (idempotency) and `milestone_outbox` (events). No family stores personal data beyond pseudonymous participant IDs.
- PS-031-01.R02: Edge cases enforced by schema alone: duplicate `sequence_no` in a plan is rejected by unique index; a second non-terminal plan for the same `booking_ref` is rejected by partial unique index; provider equal to client is rejected by CHECK; a row with `plan_state` other than `proposed` and a non-null `proposed_revision` is rejected by CHECK; any UPDATE or DELETE on an append-only table is rejected by database permission (see failure_recovery_idempotency.md).
- PS-031-01.R03: Budgets: a milestone row excluding `description_text` is at most 1 KiB; a full plan read with 50 milestones returns in p95 150 ms (see observability_performance.md). Accessibility: all stored text is plain text in NFC form; no stored string is UI copy; presentation text comes from error codes and localized client resources.
- PS-031-01.R04: Every row carries `schema_version` = 1 (CTR-SCH-001). Identifiers are ULID strings of 26 characters, Crockford base32 (A-MILESTONES-01, CTR-ID-001 open).
- PS-031-01.R05: Money is stored as `BIGINT` integer minor units with a single `currency_code` per plan. No floating-point type is used anywhere in this module (A-MILESTONES-04).
- PS-031-01.R06: The schema has no location, address, coordinate, contact, legal-name or government-identifier column. Service location stays in the parent booking record. Any `*_lat`, `*_lon`, `*_address`, `*_email` or `*_phone` column fails review.

## Entity tables

### milestone_plan
| Field | Type | Null | Constraint | Default | Example |
|---|---|---|---|---|---|
| plan_id | CHAR(26) | no | PK, ULID | generated | 01J9Z3K7Q4M2W8X6R1T5V0N8BC |
| booking_ref | CHAR(26) | no | reference to parent booking (A-MILESTONES-02) | none | 01J9Z2B0YH6T3D8F5KQ1N7WSMA |
| quote_ref | CHAR(26) | no | reference to accepted mod_quotes quote | none | 01J9Z2C4R8PX0E6G2MN9Q3VTKD |
| provider_participant_id | CHAR(26) | no | pseudonymous F07 ID | none | 01J9Z1P0W2XK7H4Q9RB5D6JE3F |
| client_participant_id | CHAR(26) | no | pseudonymous F07 ID, not equal to provider | none | 01J9Z1S8M3VN2T6Y0CA4G7HZ9J |
| currency_code | CHAR(3) | no | uppercase ISO 4217 alpha-3 on operator allow-list | none | EUR |
| total_amount_minor | BIGINT | no | 0 to 999999999999 | 0 | 45000 |
| sequencing | VARCHAR(10) | no | `sequential` or `parallel` | sequential | sequential |
| plan_state | VARCHAR(16) | no | enum in workflow_state_machine.md | draft | agreed |
| resume_state | VARCHAR(16) | yes | `agreed` or `active`; set only while proposed from agreed or active | NULL | active |
| plan_revision | INTEGER | no | >= 1; highest revision number issued | 1 | 2 |
| agreed_revision | INTEGER | yes | effective agreed revision; NULL while draft and first proposed | NULL | 1 |
| agreed_digest | CHAR(64) | yes | SHA-256 hex of agreed revision content | NULL | 9f2c...e41a |
| proposed_revision | INTEGER | yes | pending revision; NULL unless plan_state = proposed | NULL | 2 |
| mutual_cancel_requested_by | CHAR(26) | yes | participant_id of requester | NULL | 01J9Z1P0W2XK7H4Q9RB5D6JE3F |
| mutual_cancel_requested_at | TIMESTAMP(3) | yes | UTC, RFC 3339 with `Z` | NULL | 2026-11-12T10:00:00.000Z |
| cancel_reason_code | VARCHAR(40) | yes | enum from validation_rules.md | NULL | MUTUAL_CANCEL_CONFIRMED |
| row_version | BIGINT | no | optimistic lock; +1 per update | 1 | 7 |
| created_at | TIMESTAMP(3) | no | UTC | now | 2026-11-10T09:15:00.000Z |
| updated_at | TIMESTAMP(3) | no | UTC | now | 2026-11-10T09:20:00.000Z |
| completed_at | TIMESTAMP(3) | yes | set once when plan_state = completed | NULL | NULL |
| cancelled_at | TIMESTAMP(3) | yes | set once when plan_state = cancelled | NULL | NULL |
| schema_version | SMALLINT | no | 1 | 1 | 1 |

Constraints: `CHECK (provider_participant_id <> client_participant_id)`; `CHECK ((plan_state = 'proposed') = (proposed_revision IS NOT NULL))`; `CHECK (resume_state IS NULL OR resume_state IN ('agreed','active'))`; partial unique index on `booking_ref` WHERE `plan_state NOT IN ('completed','cancelled')`.

### milestone
| Field | Type | Null | Constraint | Default | Example |
|---|---|---|---|---|---|
| milestone_id | CHAR(26) | no | PK, ULID | generated | 01J9Z4A1BD5RG8N2TQ6XW0YKEM |
| plan_id | CHAR(26) | no | FK milestone_plan | none | 01J9Z3K7Q4M2W8X6R1T5V0N8BC |
| sequence_no | SMALLINT | no | 1 to 50; unique per plan_id; never reused | none | 1 |
| title | VARCHAR(120) | no | 1 to 120 characters after trim; no control characters | none | Site survey report |
| description_text | VARCHAR(1000) | yes | max 1000 characters | NULL | Photos and measurements of the back room |
| amount_minor | BIGINT | no | 0 to 999999999999 | 0 | 15000 |
| due_date | DATE | yes | UTC calendar date; non-decreasing by sequence_no among non-cancelled rows | NULL | 2026-12-01 |
| deliverable_kind | VARCHAR(24) | no | `text_note`, `file_digest`, `external_link`, `on_site_completion`, `other` | other | file_digest |
| milestone_state | VARCHAR(16) | no | enum in workflow_state_machine.md | pending | in_progress |
| plan_revision | INTEGER | no | revision that last changed this row | 1 | 1 |
| submission_count | SMALLINT | no | 0 to 5 | 0 | 0 |
| current_submission_id | CHAR(26) | yes | FK milestone_submission | NULL | NULL |
| dispute_ref | CHAR(26) | yes | reference to mod_disputes record (PS-030) | NULL | NULL |
| cancel_reason_code | VARCHAR(40) | yes | enum from validation_rules.md | NULL | REVISION_REMOVED |
| started_at, accepted_at, rejected_at, expired_at, cancelled_at | TIMESTAMP(3) | yes | UTC; each set at most once per row | NULL | NULL |
| row_version | BIGINT | no | optimistic lock | 1 | 3 |
| created_at, updated_at | TIMESTAMP(3) | no | UTC | now | 2026-11-10T09:15:00.000Z |
| schema_version | SMALLINT | no | 1 | 1 | 1 |

Constraint: `UNIQUE (plan_id, sequence_no)`. Money total rule (checked at propose and at agreement, not by a row constraint): `SUM(amount_minor)` over non-cancelled rows equals `plan.total_amount_minor`.

### milestone_plan_revision (append-only)
| Field | Type | Null | Constraint | Example |
|---|---|---|---|---|
| plan_id | CHAR(26) | no | PK part | 01J9Z3K7Q4M2W8X6R1T5V0N8BC |
| revision | INTEGER | no | PK part; >= 1; strictly increasing | 2 |
| content_json | JSON | no | canonical JSON (RFC 8785), max 256 KiB, see A-MILESTONES-15 | {"items":[...]} |
| content_digest | CHAR(64) | no | lowercase hex SHA-256 of content_json | 9f2c...e41a |
| proposed_by | CHAR(26) | no | participant_id of the proposing party | 01J9Z1S8M3VN2T6Y0CA4G7HZ9J |
| change_summary_code | VARCHAR(40) | no | enum: `INITIAL`, `ADD_ITEM`, `EDIT_ITEM`, `REMOVE_ITEM`, `SEQUENCING_CHANGE`, `AMOUNT_CHANGE`, `DUE_DATE_CHANGE` | ADD_ITEM |
| proposed_at | TIMESTAMP(3) | no | UTC | 2026-11-11T08:00:00.000Z |

### milestone_plan_consent (append-only)
Columns: `consent_id` CHAR(26) PK; `plan_id` CHAR(26) FK; `revision` INTEGER; `content_digest` CHAR(64) (must equal the digest of that revision); `participant_id` CHAR(26); `role` VARCHAR(8) enum `provider` or `client`; `consented_at` TIMESTAMP(3) UTC. Constraint: `UNIQUE (plan_id, revision, role)`. Example row: plan 01J9Z3K7Q4M2W8X6R1T5V0N8BC, revision 2, role client, consented_at 2026-11-11T09:02:44.118Z.

### milestone_submission (append-only)
Columns: `submission_id` CHAR(26) PK; `milestone_id` CHAR(26) FK; `plan_id` CHAR(26); `sequence_no` SMALLINT 1 to 5, `UNIQUE (milestone_id, sequence_no)`; `submitted_by` CHAR(26) (must equal provider); `evidence_digest` CHAR(64) lowercase hex SHA-256, NOT NULL; `evidence_uri` VARCHAR(512) NULL, https scheme only; `note_text` VARCHAR(500) NULL; `submitted_at` TIMESTAMP(3). Example evidence_digest: `3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b`.

### milestone_decision (append-only)
Columns: `decision_id` CHAR(26) PK; `milestone_id` CHAR(26) FK; `submission_id` CHAR(26) NULL; `decided_by` CHAR(26); `decision` VARCHAR(24) enum `accept`, `reject`, `dispute_outcome_accept`, `dispute_outcome_cancel`; `reason_code` VARCHAR(40) NULL, required when decision = `reject`; `reason_text` VARCHAR(500) NULL; `dispute_ref` CHAR(26) NULL, required for the two dispute outcomes; `decided_at` TIMESTAMP(3) UTC.

### milestone_command_log (idempotency)
Columns: `actor_participant_id` CHAR(26); `command_name` VARCHAR(64); `idempotency_key` CHAR(26) ULID; `request_digest` CHAR(64); `result_status` SMALLINT; `result_ref` CHAR(26) NULL; `created_at` TIMESTAMP(3); `expires_at` = created_at + 7 days. PK (`actor_participant_id`, `command_name`, `idempotency_key`).

### milestone_outbox (append-only, publisher cursor only)
Columns: `event_id` CHAR(26) PK; `event_type` VARCHAR(64); `event_version` SMALLINT (1); `plan_id` CHAR(26); `aggregate_row_version` BIGINT; `payload_json` JSON, max 8 KiB, IDs and codes only (no title, description, note, or URI); `created_at` TIMESTAMP(3); `published_at` TIMESTAMP(3) NULL (the only mutable column).

## Assumptions and open decisions
- A-MILESTONES-01: IDs are ULID (26 characters). CTR-ID-001 is open; ULID is chosen because it is time-sortable and string-safe.
- A-MILESTONES-02: `booking_ref` and `quote_ref` are references only. This module validates them through query contracts and keeps no copy of booking or quote records.
- A-MILESTONES-04: Amounts are informational; no settlement. One currency per plan. Mixed-currency valuation is deferred (D03 open).
- A-MILESTONES-13: Participants are pseudonymous F07 IDs. No names, emails, phones or addresses are stored here.
- Open: CTR-ID-001 final choice (ULID vs UUID); storage owner for deliverable bytes (see A-MILESTONES-11 in import_export_backup_rollback.md); booking record owner contract is not in CONTRACTS.md.
