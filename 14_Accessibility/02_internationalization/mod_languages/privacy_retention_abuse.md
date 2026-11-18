# PS-113-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-113-07. **Owner:** [14_Accessibility/02_internationalization/mod_languages](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_languages. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); specific subscribers unresolved.

## Purpose and scope
Classifies each record by location, retention and disclosure class per CTR-PRV-001 (owner F10), and defines abuse controls. A language list is personal data: it can hint at origin or community. It is therefore self-only and never published with a participant identifier.

## Requirements to specify
- [x] PS-113-07.R01: Describe observable business outcome, actors and exclusions.
- [x] PS-113-07.R02: Enumerate normal, invalid, expired, duplicate, concurrent, offline and adversarial cases.
- [x] PS-113-07.R03: Specify accessibility, localization, performance and operational budgets where applicable.
- [x] PS-113-07.R04: Location, retention and disclosure class for each record type.
- [x] PS-113-07.R05: Retention schedule, legal-hold interaction and erasure timing.
- [x] PS-113-07.R06: Abuse controls with numeric limits and enumeration protection.
- [x] PS-113-07.R07: Data minimisation rules for logs, events and device storage.

## Business outcome and exclusions
**Outcome:** Participants can see, change and erase their language choices, and no public surface reveals which participant chose which language. Catalog data is public so that clients can work offline and so that content can be filtered.

**Exclusions:** location data of any kind (none is collected); inference of language from IP, device, location or name; sale or sharing of preference data; use of preferences for ranking, targeting or pricing; any federation of participant preference records (CTR-FED-001 does not apply to this module's personal data).

## Classes (CTR-PRV-001 working labels)
A-languages-12: CTR-PRV-001 has not yet fixed label names. This file uses working labels that F10 must confirm or map.

| Record | Location class | Retention class | Disclosure class |
|---|---|---|---|
| `language_catalog_entry` | `LOC-NONE` (no location) | `RET-CATALOG` (lifetime of entry, plus 365 days after retirement) | `DISC-PUBLIC` for `active` and `deprecated`; `DISC-OPERATOR` for `draft` and `retired` metadata |
| `language_preference` | `LOC-NONE` | `RET-ACCOUNT` (account lifetime; erased on F07 deletion) | `DISC-SELF` only |
| `language_preference_revision` | `LOC-NONE` | `RET-SHORT` (365 days rolling, A-languages-19) | `DISC-SELF`; `DISC-AUDITOR-PURPOSE` for auditor reads |
| audit event for auditor reads and erasure | `LOC-NONE` | `RET-AUDIT` (400 days, A-languages-25) | `DISC-OPERATOR` |
| rate-limit counters | `LOC-NONE` | `RET-TRANSIENT` (60 minutes) | not disclosed |

Location: all records live in the region of the platform's primary store only; no regional replication of personal data is planned. Disclosure `DISC-SELF` data never appears in listing, search, federation or analytics payloads.

## Retention schedule and legal hold
- Catalog: retained for the life of the entry and 365 days after retirement so that historical content keeps a resolvable tag name.
- Preference: retained while the account exists. Erasure runs within 30 days of the F07 account-deletion event (A-languages-20). The row and all revisions are deleted in one transaction.
- Revision history: 365 days rolling from `recorded_at`, deleted by the daily sweep at 02:00 UTC. Erasure removes all revisions earlier.
- Legal hold: F10 may place a hold on a participant's `participant_id`. While a hold is active, the erasure job defers deletion of the preference and revisions and records `erasure_deferred` with `erasure_ref`. The hold cannot widen disclosure; it only defers deletion.
- Backups: erased data is purged from backups within 35 days (see [import_export_backup_rollback.md](import_export_backup_rollback.md)).

## Data minimisation
- Logs never contain `participant_id`, tags, `native_name` or `command_id`. Logs use `correlation_id` and an error code only (see [observability_performance.md](observability_performance.md)).
- Events carry tags only where needed for the subscriber, and never `native_name`.
- Device storage: the pending queue and the cached catalog are stored locally with no name or location. The queue is removed on sign-out.
- Device locale is a suggestion only and is not sent to the server unless the participant saves it (A-languages-15).
- Auditor reads record `purpose_code`, `auditor_ref`, `participant_id`, `recorded_at`; the returned rows are not logged.

## Abuse controls
| Control | Limit | Response |
|---|---|---|
| `languages.preference.set` per participant | 20 per hour (A-languages-14) | `LANGUAGES_RATE_LIMITED` with `retry_after_s` |
| `languages.preference.resolve` per participant | 600 per hour | same |
| `languages.catalog.list` per client IP | 120 per minute, cached responses exempt | HTTP 429 |
| `languages.catalog.transition` per operator | 30 per hour | `LANGUAGES_RATE_LIMITED` |
| Enumeration of participant ids through error timing | responses padded to a constant 50 ms minimum for ownership checks | none |
| Free-text abuse in preferences | not possible: list accepts only catalog tags (V-02) | none |
| Catalog abuse by compromised operator | two-person approval for `transition` to `active` (A-languages-26) | second operator must approve within 24 hours |

Repeated rate-limit hits (more than 5 in 24 hours for one participant) raise an abuse signal to F16 for review. The signal carries `participant_id` and count only.

## Adversarial cases (R02)
- Scraping the public catalog: allowed by design; the catalog contains no participant data.
- Attempt to learn another participant's language by probing `get`: returns `LANGUAGES_NOT_FOUND` with constant timing.
- Insertion of script or markup in `native_name`: rejected (V-05); the client also renders with text nodes only.
- Using preferences to reveal a participant's pseudonym: pseudonyms are not stored here; `participant_id` is never shown to other participants.
- Crafted `candidate_tags` to probe catalog contents: limited to 8 entries per call and rate-limited through the resolve limit.

## Accessibility and localisation of privacy notices (R03)
- The privacy notice for this capability is shown in the participant's preferred language with fallback to `en`.
- Erasure and export confirmations are text and do not rely on colour.
- Notices are read at 16 px minimum and keep 4.5:1 contrast in both themes.

## Performance budget (R03)
- Erasure job: completes within 30 days of the trigger; per-participant transaction p95 <= 1 s.
- Retention sweep: must finish within 1 hour per day for 10 million revision rows.

## Assumptions
**Assumption A-languages-12:** CTR-PRV-001 working labels above are used until F10 confirms names. This is a cross-module item: F10 must publish the label set.

**Assumption A-languages-14:** Participant write limit is 20 per hour (also in [failure_recovery_idempotency.md](failure_recovery_idempotency.md)).

**Assumption A-languages-15:** Device locale is a UI suggestion, not stored server-side unless saved as a list.

**Assumption A-languages-19:** Revision history is kept 365 days rolling, or until erasure, whichever is first.

**Assumption A-languages-20:** Erasure completes within 30 days of the F07 deletion event; backups purge within 35 days.

**Assumption A-languages-25:** Audit events are kept 400 days.

**Assumption A-languages-26:** Activation of a catalog entry needs approval from a second operator within 24 hours. This is a recommended default, not an approved control.

## Open decisions
- A-languages-12 (CTR-PRV-001 labels, owner F10), A-languages-14, A-languages-15, A-languages-19, A-languages-20, A-languages-25, A-languages-26.
- Whether legal holds are F10 or F16 records is unresolved; default is F10.
- Whether the 600 per hour resolve limit is too high for background notification rendering is unresolved; default is 600.

## Test references
Privacy and abuse tests `TEST-PS-113-07-Tnn` in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).
