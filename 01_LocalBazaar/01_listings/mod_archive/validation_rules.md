# PS-001-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (envelope, categories, codes), CTR-EVT-001 (revision, timestamps), CTR-CAP-001 (`lst.update`, `lst.moderate`, visibility), CTR-SCH-001 (command schema). **Pending:** CTR-LST-001 (listing reference query for active proposals and transactions; not yet written). **Decisions:** D01, D04 (defaults PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-02.R01 | `reason_code` must be in the closed enum of PS-001-01. Otherwise `ARCHIVE.REASON_INVALID`. No free text accepted. | MVP |
| PS-001-02.R02 | `expected_revision` is required, integer 1 to 2^53−1. Mismatch with stored revision → `EVT.REVISION_CONFLICT`. | MVP |
| PS-001-02.R03 | Archive requires state `PUBLISHED`. Restore requires `ARCHIVED`. Otherwise `ARCHIVE.INVALID_STATE`. | MVP |
| PS-001-02.R04 | Archive is refused with `ARCHIVE.ACTIVE_REFERENCE` while the listing is referenced by an open cycle proposal (`cyc_`) or an open exchange (`trx_`). Reference query owned by PENDING CTR-LST-001. Default blocks (D04 PROVISIONAL). | MVP |
| PS-001-02.R05 | Restore re-runs the F01 publish validators (owned by mod_publish) on current content. Any failure → `ARCHIVE.RESTORE_VALIDATION_FAILED`, with `details[].rule` enum values only. | MVP |
| PS-001-02.R06 | Unknown or extra request fields → `SYS.REQUEST_MALFORMED`. | MVP |
| PS-001-02.R07 | Moderator archive requires `case_ref` (`cas_`) in active case scope. Missing → `ARCHIVE.CASE_REQUIRED`. | MVP |
| PS-001-02.R08 | Owner restore of a moderator-archived listing → `ARCHIVE.MODERATION_LOCKED`. | MVP |
| PS-001-02.R09 | Client `occurred_at` is checked per CTR-EVT-001 R04. Failure → `EVT.TIMESTAMP_OUT_OF_RANGE`. | MVP |
| PS-001-02.R10 | Listing not visible to actor → `SYS.NOT_FOUND` (body identical to nonexistent). Visible, not owner → `SYS.FORBIDDEN`. | MVP |

## Data / schema
Validation inputs: `listing_id` (`^lst_[0-7][0-9A-HJKMNPQRSTVWXYZ]{25}$`, lowercase prefix, uppercase body normalized per CTR-ID-001 R03), `expected_revision` (integer), `reason_code` (enum), `case_ref` (`^cas_[0-7][0-9A-HJKMNPQRSTVWXYZ]{25}$`), `idempotency_key` (16–64 chars, `[A-Za-z0-9_-]`).

## Validation & errors
| Code | Category | Retryable | Trigger (rule) |
|---|---|---|---|
| `ARCHIVE.REASON_INVALID` | validation | false | R01 |
| `ARCHIVE.CASE_REQUIRED` | validation | false | R07 |
| `SYS.REQUEST_MALFORMED` | validation | false | R06 |
| `EVT.REVISION_CONFLICT` | conflict | false | R02 |
| `ARCHIVE.INVALID_STATE` | unprocessable_state | false | R03 |
| `ARCHIVE.ACTIVE_REFERENCE` | unprocessable_state | true | R04 |
| `ARCHIVE.RESTORE_VALIDATION_FAILED` | precondition_failed | false | R05 |
| `ARCHIVE.MODERATION_LOCKED` | forbidden | false | R08 |
| `EVT.TIMESTAMP_OUT_OF_RANGE` | validation | false | R09 |
| `SYS.NOT_FOUND`, `SYS.FORBIDDEN` | not_found, forbidden | false | R10 |

Validation order: authentication, visibility (R10), authorization, malformed (R06), reason (R01), revision (R02), state (R03), moderation lock (R08), references (R04), publish revalidation (R05). Input values are never echoed (CTR-ERR-001 R07).
