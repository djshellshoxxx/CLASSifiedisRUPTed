# PS-113-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_languages. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-113-10.R01 | Account export includes the `language` profile field only. | MVP |
| PS-113-10.R02 | Import accepts `language` only if it passes PS-113-02 rules; otherwise it is set to null and reported. | MVP |
| PS-113-10.R03 | Catalogs are versioned artifacts, not user data; they are not exported per account. | MVP |
| PS-113-10.R04 | Rollback: serve previous catalog version; profile values remain valid if the tag is in the restored list, else resolve to null. | MVP |
| PS-113-10.R05 | Federation does not carry language preferences (no CTR-FED-001 mapping). | MVP |

## Data / schema
Export: `{ "language": "de" | null, "schema_version": "1.0.0" }`.

## Commands / queries / events
`account.export` includes `profile.language` in the profile section (F07).

## States & transitions
Rollback state: catalog `active` pointer moves to previous version.

## Validation & errors
Import errors: LANG.TAG_UNSUPPORTED.

## Authorization
Export self; rollback release sys grant with dual control.

## Failure, idempotency, concurrency, offline
Import idempotent by profile revision.

## Privacy, retention, abuse
Backups keep the profile field under profile retention.

## Observability & budgets
Export ≤ 200 ms p95.

## Tests
- TEST-PS-113-10-01 (contract): export contains only the language field.
- TEST-PS-113-10-02 (integration): import `fr` yields null and report entry.
- TEST-PS-113-10-03 (integration): rollback serves previous catalog; invalid tags become null.
- TEST-PS-113-10-04 (negative): federation mapping absent.

## Acceptance criteria
1. Export and import validated.
2. Rollback drill recorded (not yet run).
3. No catalog data in user exports.

## Assumptions & open decisions
- ASSUMPTION: catalogs are not user data.
- D07 PROVISIONAL (D07 default, unapproved).
