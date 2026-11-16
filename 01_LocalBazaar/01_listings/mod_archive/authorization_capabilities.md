# PS-001-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (action vocabulary, scopes, privileged grants, field visibility), CTR-ID-001, CTR-ERR-001 (`SYS.FORBIDDEN` vs `SYS.NOT_FOUND`). **Pending:** CTR-LST-001 (participant rights in listings held by cycles). **Decisions:** D10 (defaults PROVISIONAL, unapproved). Grant model is PROVISIONAL (CTR-CAP-001).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-05.R01 | Module capabilities: `lst.read`, `lst.update` (owner archive and restore), `lst.moderate` (case-scoped archive and restore). No other verbs are declared. | MVP |
| PS-001-05.R02 | Default deny. Owner rule evaluated on `acc_` from the listing aggregate at decision time (CTR-CAP-001 R05). | MVP |
| PS-001-05.R03 | Moderator capability requires `case` scope, `constraints.purpose`, `case_id`, and expiry ≤ 72 h after `not_before` (CTR-CAP-001 R06). | MVP |
| PS-001-05.R04 | Global operators hold no archive capability. Platform staff act only through a case grant. | MVP |
| PS-001-05.R05 | Every archive, restore and privileged read writes a `aud_` record with listing ID, decision ID, actor kind (CTR-CAP-001 R08). | MVP |
| PS-001-05.R06 | Decision cache TTL is zero for all archive writes (CTR-CAP-001 R09). | MVP |

## Authorization matrix
| Actor | Action | Resource | Result | Code if denied |
|---|---|---|---|---|
| owner `acc_` | `archive_listing` | own `lst_` in PUBLISHED | ALLOW | — |
| owner `acc_` | `restore_listing` | own `lst_`, `archived_by_kind=user` | ALLOW | — |
| owner `acc_` | `restore_listing` | own `lst_`, `archived_by_kind=mod` | DENY | `ARCHIVE.MODERATION_LOCKED` |
| non-owner, can see listing | any archive command | `lst_` | DENY | `SYS.FORBIDDEN` |
| non-owner, cannot see listing | any archive command | `lst_` | DENY | `SYS.NOT_FOUND` |
| counterparty in open cycle | `get_archive_state` | `lst_` | ALLOW, fields `public` only | — |
| counterparty in open cycle | archive command | `lst_` | DENY | `SYS.FORBIDDEN` |
| `mod_` with active case | `archive_listing_by_moderator` | `lst_` in case scope | ALLOW | — |
| `mod_` without case | any moderator command | `lst_` | DENY | `SYS.FORBIDDEN` |
| `ope_` global | any archive command | any | DENY | `SYS.FORBIDDEN` |
| `sys_` federation adapter | archive event import | `lst_` of peer origin | ASSUMPTION: Future, see PS-001-10 | `FED.PEER_NOT_TRUSTED` |

## Field visibility
| Field | Owner | Counterparty | Public | Case |
|---|---|---|---|---|
| `lifecycle_state`, `revision` | public | public | never ARCHIVED (not found) | case |
| `archive_reason_code` | owner | never | never | case |
| `archived_by_ref` | owner (user only) | never | never | case |
| `archive_case_ref` | never | never | never | case |

Fields without an allowing rule are omitted, not returned as null (CTR-CAP-001 R10).
