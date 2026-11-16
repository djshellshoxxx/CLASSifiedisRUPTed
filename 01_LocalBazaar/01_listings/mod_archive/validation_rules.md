# PS-001-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (envelope, categories, codes), CTR-EVT-001 (revision, timestamps), CTR-CAP-001 (visibility), CTR-SCH-001 (command schema). **Pending:** CTR-LST-001 (active-reference query).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-02.R01 | `reason_code` must be in the closed enum of PS-001-01. Otherwise `ARCHIVE.REASON_INVALID`. Free text is rejected. | MVP |
| PS-001-02.R02 | `expected_revision` required, integer 1 to 2^53−1. Mismatch → `EVT.REVISION_CONFLICT`. | MVP |
| PS-001-02.R03 | Archive requires `PUBLISHED`. Restore requires `ARCHIVED`. Otherwise `ARCHIVE.INVALID_STATE`. | MVP |
| PS-001-02.R04 | Archive refused with `ARCHIVE.ACTIVE_REFERENCE` while an open cycle proposal (`cyc_`) or open exchange (`trx_`) references the listing (D04 PROVISIONAL). | MVP |
| PS-001-02.R05 | Restore re-runs F01 publish validators (owned by mod_publish). Failure → `ARCHIVE.RESTORE_VALIDATION_FAILED` with `details[].rule` enum values only. | MVP |
| PS-001-02.R06 | Unknown or extra request fields → `SYS.REQUEST_MALFORMED`. | MVP |
| PS-001-02.R07 | Moderator command requires `case_ref` (`cas_`) in active case scope. Missing → `ARCHIVE.CASE_REQUIRED`. | MVP |
| PS-001-02.R08 | Owner restore of a moderator-archived listing → `ARCHIVE.MODERATION_LOCKED`. | MVP |
| PS-001-02.R09 | Client `occurred_at` checked per CTR-EVT-001 R04. Failure → `EVT.TIMESTAMP_OUT_OF_RANGE`. | MVP |
| PS-001-02.R10 | Listing not visible to actor → `SYS.NOT_FOUND`. Visible but not owner → `SYS.FORBIDDEN`. | MVP |

## Data / schema
Inputs: `listing_id` (`^lst_[0-7][0-9A-HJKMNPQRSTVWXYZ]{25}$`; lowercase prefix, uppercase body after normalization, CTR-ID-001 R03), `expected_revision` (integer), `reason_code` (enum), `case_ref` (`^cas_[0-7][0-9A-HJKMNPQRSTVWXYZ]{25}$`), `idempotency_key` (16–64 chars, `[A-Za-z0-9_-]`), `occurred_at` (RFC3339 UTC ms).

## Commands / queries / events
Validation runs inside each command in [commands_queries_events.md](commands_queries_events.md). Order: visibility (R10), authorization, malformed (R06), reason (R01), revision (R02), state (R03), moderation lock (R08), references (R04), publish revalidation (R05).

## States & transitions
Guards referenced here are the state-table guards in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Code | Category | Retryable | Rule |
|---|---|---|---|
| `ARCHIVE.REASON_INVALID` | validation | false | R01 |
| `ARCHIVE.CASE_REQUIRED` | validation | false | R07 |
| `SYS.REQUEST_MALFORMED` | validation | false | R06 |
| `EVT.TIMESTAMP_OUT_OF_RANGE` | validation | false | R09 |
| `EVT.REVISION_CONFLICT` | conflict | false | R02 |
| `ARCHIVE.INVALID_STATE` | unprocessable_state | false | R03 |
| `ARCHIVE.ACTIVE_REFERENCE` | unprocessable_state | true | R04 |
| `ARCHIVE.RESTORE_VALIDATION_FAILED` | precondition_failed | false | R05 |
| `ARCHIVE.MODERATION_LOCKED` | forbidden | false | R08 |
| `SYS.NOT_FOUND`, `SYS.FORBIDDEN` | not_found, forbidden | false | R10 |

Input values are never echoed (CTR-ERR-001 R07).

## Authorization
Validation R10 depends on visibility rules in [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Validation runs before any write; a rejected request writes nothing and emits no event. Concurrency rules: [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Validation errors carry no input values, case IDs or account IDs (CTR-ERR-001 R06). Abuse limit is R03 of [workflow_state_machine.md](workflow_state_machine.md).

## Observability & budgets
Each error code is counted by `archive_commands_total{outcome}` (PS-001-08 R01).

## Tests
- TEST-PS-001-02-01 — unit: each code in the table is returned for its rule and nothing else.
- TEST-PS-001-02-02 — unit: validation order holds when several rules fail (visibility wins).
- TEST-PS-001-02-03 — integration: `ARCHIVE.ACTIVE_REFERENCE` clears after the reference closes.

## Acceptance criteria
1. Every code in the table has a negative test asserting category and retryable flag.
2. No error response echoes an input value (test by fuzzed input).
3. Validation order is deterministic and documented in this file.

## Assumptions & open decisions
- D04 PROVISIONAL: archive blocked while a cycle or exchange references the listing.
- D01 PROVISIONAL: federated archive events are signature-validated before this checks run (Future).
- ASSUMPTION: idempotency key length 16–64 chars.
- PENDING CTR-LST-001: reference query for open cycles and exchanges.
