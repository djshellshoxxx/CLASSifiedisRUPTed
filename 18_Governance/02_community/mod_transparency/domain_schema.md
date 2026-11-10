# PS-148-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-148-01. **Owner:** [18_Governance/02_community/mod_transparency](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_transparency. **Consumers:** F12 moderation (MODERATION_ACTION source), [mod_governance](../mod_governance/SPEC.md) (GOVERNANCE_DECISION source), 18_Governance/01_policy (POLICY_CHANGE source), F13 notifications (explanation notice), F07 identity (actor references); declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
Define the persisted records that make governance and moderation decisions visible in a privacy-safe, versioned and auditable form. The module publishes three things: (1) decision log entries that explain a decision and the policy it applied, (2) quarterly transparency reports built from aggregate metrics, and (3) participant-only explanations for the subject of a decision.

Exclusions: this module does not decide moderation outcomes (F12 owns them), does not own identities, credentials or actor records (F07), does not own payment or delivery evidence, does not store precise locations (F10 owns geolocation precision), and does not publish security event logs (F16). It never implies platform custody or real-world settlement of any transaction.

## Requirements
- PS-148-01.R01: Business outcome: a reviewer can publish one decision log entry per governance or moderation decision, and the public can see the category, outcome, policy version and a redacted summary. Actors: transparency author, governance reviewer, subject participant, public reader, auditor. Exclusions as stated above.
- PS-148-01.R02: Cases covered: normal publish; invalid field values; expired review (REVIEW older than 14 days); duplicate submission of the same source_ref; concurrent edits (revision conflict); offline client writes (rejected until server acknowledgement, per D08); adversarial input (PII in summary, forged source_ref, oversized text).
- PS-148-01.R03: Accessibility and localization: summary and explanation text are stored with a BCP 47 `locale` tag; state and category labels are returned as codes so clients render text, not colour, for status. Performance budgets are defined in PS-148-08.R05.
- PS-148-01.R04: Ownership: this module owns `transparency_report`, `transparency_metric_snapshot`, `transparency_decision_entry`, `transparency_redaction_profile`, `transparency_audit_entry` and `transparency_idempotency_record`. Source records (moderation actions, governance decisions, policy versions) are referenced by `source_ref` and never copied as canonical data.
- PS-148-01.R05: Every entity carries `schema_version` (MAJOR.MINOR, see A-TRANSPARENCY-17) and a monotonically increasing `revision` for optimistic concurrency.
- PS-148-01.R06: Fail-closed defaults: `disclosure_class` defaults to `INTERNAL_ONLY`; a record is invisible to the public until it reaches `PUBLISHED` with a permitted disclosure class.
- PS-148-01.R07: Identifiers are ULIDs (26 characters, Crockford base32, no I, L, O or U). Participant identity is never stored in public fields; it is represented only by `subject_token` (PS-148-07.R06).
- PS-148-01.R08: No free-text field may contain a direct identifier; the validation rules in PS-148-02 enforce this at write time.

## Entity: transparency_decision_entry
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| entry_id | string | no | PK; ULID 26 chars | generated | 01J9Z3K8Q4M2W7X5T1R6N0BVCD |
| schema_version | string | no | regex `^[0-9]+\.[0-9]+$` | "1.0" | "1.0" |
| source_type | enum | no | MODERATION_ACTION, GOVERNANCE_DECISION, POLICY_CHANGE | none | GOVERNANCE_DECISION |
| source_ref | string | no | ULID of the record in its owning module; unique together with source_type | none | 01J9Z3M0A6H4D8F2K5N7P9Q1RS |
| category_code | enum | no | CONTENT_REMOVAL, ACCOUNT_RESTRICTION, LISTING_OVERRIDE, APPEAL_OUTCOME, GOVERNANCE_DECISION, POLICY_CHANGE, RECORD_CORRECTION | none | CONTENT_REMOVAL |
| outcome | enum | no | UPHELD, REVERSED, REMOVED, RESTRICTED, NO_ACTION, POLICY_UPDATED; allowed set depends on category (PS-148-02) | none | REMOVED |
| policy_version_ref | string | no | regex `^POL-[0-9]{4}\.[0-9]{2}$` | none | POL-2026.02 |
| subject_token | string | yes | 43 chars base64url; null when category is POLICY_CHANGE | null | (43-char token from PS-148-07.R06) |
| disclosure_class | enum | no | PUBLIC_AGGREGATE, PUBLIC_REDACTED, PARTICIPANT_ONLY, INTERNAL_ONLY | INTERNAL_ONLY | PUBLIC_REDACTED |
| public_summary | string | yes | 1 to 500 code points; required iff PUBLIC_REDACTED; no PII pattern | null | "Listing removed after community reports were upheld on review." |
| participant_explanation | string | yes | 0 to 1000 code points; required when subject_token is set | null | "Your listing was removed under POL-2026.02. Contact the review team through the appeal path." |
| redaction_profile_id | string | yes | required iff PUBLIC_REDACTED; FK to transparency_redaction_profile | null | RP-DEFAULT |
| region_code | string | yes | regex `^REG-[A-Z0-9]{2,6}$`; must be on the F10 coarse region list | null | REG-A01 |
| locale | string | no | BCP 47 tag | "en" | "en-GB" |
| state | enum | no | PREPARING, REVIEW, PUBLISHED, SUPERSEDED, WITHDRAWN | PREPARING | PUBLISHED |
| supersedes_entry_id | string | yes | ULID of a PUBLISHED entry with the same source_type | null | null |
| author_actor_ref | string | no | ULID of the F07 actor who created the entry | none | 01J9Z3N4E7P1R8T2V5W9X0Y3ZA |
| reviewer_actor_ref | string | yes | ULID; must differ from author_actor_ref | null | 01J9Z3P6F2Q4S7U9W1X3Y5Z8BC |
| legal_hold | boolean | no | blocks purge and hard delete | false | false |
| revision | integer | no | >= 1; incremented on every write | 1 | 3 |
| content_hash | string | yes | 64 hex chars (SHA-256 of canonical public fields); set at PUBLISHED | null | (64 hex chars) |
| created_at | timestamp | no | UTC, millisecond precision | now | 2026-11-02T09:14:07.318Z |
| updated_at | timestamp | no | UTC; >= created_at | now | 2026-11-03T16:02:44.901Z |
| published_at | date | yes | UTC day only in all public payloads (A-TRANSPARENCY-13) | null | 2026-11-04 |

## Entity: transparency_report
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| report_id | string | no | PK; ULID | generated | 01J9Z4A1B2C3D4E5F6G7H8J9KM |
| schema_version | string | no | as above | "1.0" | "1.0" |
| period_start | date | no | UTC day | none | 2026-07-01 |
| period_end | date | no | >= period_start; span 1 to 366 days inclusive | none | 2026-09-30 |
| state | enum | no | PREPARING, FROZEN, PUBLISHED, SUPERSEDED, WITHDRAWN | PREPARING | FROZEN |
| snapshot_id | string | yes | set at FROZEN; FK to transparency_metric_snapshot | null | 01J9Z4B7M2N5P8Q1R4S7T0V3WX |
| content_hash | string | yes | 64 hex chars; set at FROZEN | null | (64 hex chars) |
| supersedes_report_id | string | yes | PUBLISHED report with an identical period | null | null |
| author_actor_ref | string | no | ULID | none | 01J9Z3N4E7P1R8T2V5W9X0Y3ZA |
| approver_actor_ref | string | yes | ULID; must differ from author_actor_ref | null | 01J9Z3P6F2Q4S7U9W1X3Y5Z8BC |
| revision | integer | no | >= 1 | 1 | 2 |
| created_at, updated_at | timestamp | no | UTC | now | 2026-10-01T08:00:00.000Z |
| published_at | date | yes | UTC day | null | 2026-10-05 |

## Entity: transparency_metric_snapshot
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| snapshot_id | string | no | PK; ULID | generated | 01J9Z4B7M2N5P8Q1R4S7T0V3WX |
| report_id | string | no | FK; one snapshot per report | none | 01J9Z4A1B2C3D4E5F6G7H8J9KM |
| metric_key | enum | no | ENTRIES_PUBLISHED, ENTRIES_WITHDRAWN, ENTRIES_BY_CATEGORY, ENTRIES_BY_OUTCOME | none | ENTRIES_BY_CATEGORY |
| dimension_value | string | yes | category or outcome code; null for totals | null | CONTENT_REMOVAL |
| value_int | integer | yes | >= 0; null iff suppressed is true | null | 42 |
| suppressed | boolean | no | true when the underlying count is below min_cell_size | false | false |

## Entity: transparency_redaction_profile
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| profile_id | string | no | PK; regex `^RP-[A-Z0-9-]{2,30}$` | none | RP-DEFAULT |
| version | integer | no | >= 1; new version for every change | 1 | 1 |
| min_cell_size | integer | no | 5 to 100 | 10 | 10 |
| max_summary_chars | integer | no | 1 to 500 | 500 | 500 |
| allowed_fields | set of enum | no | subset of category_code, outcome, policy_version_ref, region_code, source_type | category_code, outcome, policy_version_ref | category_code, outcome, policy_version_ref |
| pii_detector_set | set of enum | no | EMAIL, PHONE, STREET_ADDRESS, URL, DIRECT_NAME_HEURISTIC; all five by default | all five | all five |
| active | boolean | no | inactive profiles cannot be newly assigned | true | true |

## Entity: transparency_audit_entry (append-only)
| Field | Type | Null | Constraints | Example |
|---|---|---|---|---|
| audit_id | string | no | PK; ULID | 01J9Z5C0D1E2F3G4H5J6K7M8NP |
| occurred_at | timestamp | no | UTC | 2026-11-03T16:02:44.901Z |
| command | string | no | command name from PS-148-04 | ApproveDecisionLogEntry |
| actor_ref | string | no | ULID or the literal `system` | 01J9Z3P6F2Q4S7U9W1X3Y5Z8BC |
| target_type | enum | no | decision_entry, report, redaction_profile | decision_entry |
| target_id | string | no | ULID | 01J9Z3K8Q4M2W7X5T1R6N0BVCD |
| from_state, to_state | string | yes | state names from PS-148-03 | REVIEW, PUBLISHED |
| outcome_code | string | no | `OK` or a code from PS-148-02 | OK |
| request_hash | string | no | 64 hex chars | (64 hex chars) |

Audit rows never contain summary, explanation or subject data. Update and delete of audit rows are denied to every role, including operators.

## Entity: transparency_idempotency_record
Composite key (actor_ref, command, idempotency_key); columns `request_hash`, `response_snapshot` (JSON, at most 8 KB), `created_at`, `expires_at` (created_at + 72 hours, A-TRANSPARENCY-07).

## Open decisions
- A-TRANSPARENCY-01: Identifiers are ULIDs pending the CTR-ID-001 decision (UUID or ULID, OPEN in [CONTRACTS.md](../../../planning/CONTRACTS.md)). If CTR-ID-001 selects UUIDv7, only the pattern constraints change.
- A-TRANSPARENCY-16: A report covers at most 5000 decision entries and a quarterly period is the default. Larger periods are split into several reports.
- Decision D07 (retention) remains OPEN in [DECISIONS.md](../../../DECISIONS.md); defaults used here are listed in PS-148-07.
