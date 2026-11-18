# PS-029-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_skills. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-029-02.R01 | Validation runs server-side before any write. Client checks are advisory only. | MVP |
| PS-029-02.R02 | `skill_code` must exist in the active `taxonomy_version` at attach time. Otherwise `SKILLS.TAXONOMY_UNKNOWN` unless the label is routed to `pending_review` (R05). | MVP |
| PS-029-02.R03 | Attach that would make row count > 20 → `SKILLS.LIMIT_EXCEEDED`, no partial write. | MVP |
| PS-029-02.R04 | Label input: trim, NFC, reject control characters and bidi overrides (`SKILLS.LABEL_INVALID`); length 1–64 scalars. | MVP |
| PS-029-02.R05 | Free-text label with no taxonomy match is accepted as `pending_review` only when the taxonomy flag `allow_pending` is true (default true, ASSUMPTION). | MVP |
| PS-029-02.R06 | Attaching a deprecated code → `SKILLS.CODE_DEPRECATED` (retryable false). Existing rows remain valid. | MVP |
| PS-029-02.R07 | `proficiency` outside the closed enum → `SKILLS.PROFICIENCY_INVALID`. | MVP |
| PS-029-02.R08 | Duplicate `(listing_id, skill_code)` → `SKILLS.DUPLICATE_ATTACHMENT`; the existing row is returned, no new event. | MVP |
| PS-029-02.R09 | Listing not owned by actor, or not in an editable state → `SYS.NOT_FOUND` for non-owners (CTR-ERR-001 R08). | MVP |

## Data / schema
Validation inputs are the `listing_skill` fields in [domain_schema.md](domain_schema.md). Rule versions are recorded on the event as `schema_version`.

## Commands / queries / events
Each command returns rule codes in `details[].rule` (closed enum: `max_length`, `charset`, `unknown_code`, `limit`, `duplicate`, `deprecated`). Input values are never echoed (CTR-ERR-001 R07).

## States & transitions
Validation precedes every transition in [workflow_state_machine.md](workflow_state_machine.md). Rejected input causes no transition.

## Validation & errors
| Code | Retryable | message_key | Diagnostic |
|---|---|---|---|
| SKILLS.TAXONOMY_UNKNOWN | false | err.skills.taxonomy_unknown | code not in version |
| SKILLS.LIMIT_EXCEEDED | false | err.skills.limit_exceeded | row count |
| SKILLS.LABEL_INVALID | false | err.skills.label_invalid | rule enum only |
| SKILLS.PROFICIENCY_INVALID | false | err.skills.proficiency_invalid | enum name |
| SKILLS.DUPLICATE_ATTACHMENT | false | err.skills.duplicate_attachment | row ID |
| SKILLS.CODE_DEPRECATED | false | err.skills.code_deprecated | code |

## Authorization
Validation does not grant access. Rules run after the capability check in [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Validation is deterministic for a given taxonomy version. Offline clients validate against the cached taxonomy version and the server re-validates on relay receipt (D08 PROVISIONAL).

## Privacy, retention, abuse
Rejected labels are not stored, except the normalized rule enum in logs. Repeated rejects from one account: rate limit after 30 per hour (ASSUMPTION).

## Observability & budgets
Counter per rule code. Validation p95 ≤ 5 ms excluding I/O (ASSUMPTION).

## Tests
- TEST-PS-029-02-01 unit: one case per rule code, including Unicode normalization of `café` in NFD and NFC.
- TEST-PS-029-02-02 property: any label with a bidi override is rejected.
- TEST-PS-029-02-03 negative: 21st attachment returns LIMIT_EXCEEDED and writes nothing.

## Acceptance criteria
1. Every rule in R01–R09 maps to exactly one error code or accept path.
2. No error response contains label text (CTR-ERR-001 R06).
3. All codes in the table exist in the CTR-ERR-001 registry with fixed `retryable`.

## Assumptions & open decisions
- ASSUMPTION: `allow_pending` default true.
- Module error prefix SKILLS follows CTR-ERR-001 R02 (2–8 uppercase letters).
- No payment or receipt checklist applies.
