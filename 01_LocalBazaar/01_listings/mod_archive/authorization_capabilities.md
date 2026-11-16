# PS-001-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (vocabulary, scopes, privileged grants, field visibility), CTR-ID-001, CTR-ERR-001 (`SYS.FORBIDDEN` vs `SYS.NOT_FOUND`). **Pending:** CTR-LST-001 (counterparty rights on listings held by cycles). Grant model PROVISIONAL (CTR-CAP-001).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-05.R01 | Module capabilities: `lst.read`, `lst.update` (owner archive and restore), `lst.moderate` (case-scoped archive and restore). No other verbs. | MVP |
| PS-001-05.R02 | Default deny. Owner rule evaluated on the `acc_` in the aggregate at decision time (CTR-CAP-001 R05). | MVP |
| PS-001-05.R03 | Moderator capability requires `case` scope, `constraints.purpose`, `case_id`, expiry ≤ 72 h after `not_before` (CTR-CAP-001 R06). | MVP |
| PS-001-05.R04 | Global operators hold no archive capability. Staff act only through a case grant. | MVP |
| PS-001-05.R05 | Each archive, restore and privileged read writes one `aud_` record with listing ID, decision ID, actor kind. | MVP |
| PS-001-05.R06 | Decision cache TTL is zero for archive writes (CTR-CAP-001 R09). | MVP |

## Data / schema
Visibility inputs are the fields in [domain_schema.md](domain_schema.md). Decision records store outcome and reason code only (CTR-CAP-001 R13).

## Commands / queries / events
Capabilities per command: [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Owner rule is re-evaluated against the current state in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Denial codes per row are defined in [validation_rules.md](validation_rules.md) (PS-001-02).

## Authorization
### Decision matrix
| Actor | Action | Resource | Result | Code if denied |
|---|---|---|---|---|
| owner `acc_` | archive | own `lst_` PUBLISHED | ALLOW | — |
| owner `acc_` | restore | own `lst_`, `archived_by_kind=user` | ALLOW | — |
| owner `acc_` | restore | own `lst_`, `archived_by_kind=mod` | DENY | `ARCHIVE.MODERATION_LOCKED` |
| non-owner, can see listing | any archive command | `lst_` | DENY | `SYS.FORBIDDEN` |
| non-owner, cannot see listing | any archive command | `lst_` | DENY | `SYS.NOT_FOUND` |
| counterparty in open cycle | `get_archive_state` | `lst_` | ALLOW, `public` fields only | — |
| counterparty in open cycle | archive command | `lst_` | DENY | `SYS.FORBIDDEN` |
| `mod_` with active case | moderator command | `lst_` in case scope | ALLOW | — |
| `mod_` without case | moderator command | `lst_` | DENY | `SYS.FORBIDDEN` |
| `ope_` global | any archive command | any | DENY | `SYS.FORBIDDEN` |

### Field visibility
Fields without an allowing rule are omitted, not returned as null (CTR-CAP-001 R10).

| Field | Owner | Counterparty | Public | Case |
|---|---|---|---|---|
| `lifecycle_state`, `revision` | yes | yes | ARCHIVED = not found | yes |
| `archive_reason_code` | yes | no | no | yes |
| `archived_by_ref` | yes (user only) | no | no | yes |
| `archive_case_ref` | no | no | no | yes |

## Failure, idempotency, concurrency, offline
Recovery never grants archive capability (CTR-CAP-001 R12). After account recovery, owner actions require the standard proof (D10 PROVISIONAL). Federation adapter (`sys_`) scope is Future, see [import_export_backup_rollback.md](import_export_backup_rollback.md).

## Privacy, retention, abuse
Case IDs are shown only in case scope. Privileged reads are audited (R05).

## Observability & budgets
Deny counts by code only, no actor IDs (PS-001-08 R05).

## Tests
- TEST-PS-001-05-01 — authorization: every row of the matrix.
- TEST-PS-001-05-02 — authorization: expired moderator grant denies at next decision.
- TEST-PS-001-05-03 — privacy: owner view omits `archive_case_ref` and `archived_by_ref` of moderator archives.

## Acceptance criteria
1. Every matrix row has one passing test.
2. Default deny verified by a test with no grant.
3. No `ope_` path grants archive.

## Assumptions & open decisions
- D10 PROVISIONAL: recovery requires standard proof before owner actions.
- Grant model PROVISIONAL (CTR-CAP-001).
- PENDING CTR-LST-001: counterparty rights.
