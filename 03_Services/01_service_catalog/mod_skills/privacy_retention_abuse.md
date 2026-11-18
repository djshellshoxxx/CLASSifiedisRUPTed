# PS-029-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-029-07. **Owner:** [03_Services/01_service_catalog/mod_skills](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_skills (module ID F03.S01.M01). **Consumers:** shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); module-level notifications, evidence, moderation and observability per [module SPEC](SPEC.md).

## Purpose and scope
Defines the location, retention and disclosure class of every data element in skill offers, the data that must never be disclosed, and the abuse controls that protect the catalog from spam, scraping and harassment. Location, retention and disclosure classes are owned by F10 under CTR-PRV-001 ([CONTRACTS](../../../planning/CONTRACTS.md)); the class labels below are provisional until that contract is published.

Exclusions: exact home addresses (never collected here, see PROJECT_SPEC trust boundaries), network-level anonymity (not provided), legal-hold processes (platform policy), and moderation decisions on content meaning (moderation module).

## Requirements
- PS-029-07.R01: Business outcome: participants can publish skills without exposing their home address, contact details or draft text, and can remove or export their offers. Actors: owner participant, public searcher, moderator, operator, data-subject request handler. Exclusions as above.
- PS-029-07.R02: Case coverage: draft leaked through search; contact data typed into description; exact coordinates typed into title; bulk scraping of public search; spam burst of creates; repeated publish and retire to game ranking; blocked participant attempting writes; erasure request for a participant with published offers; export request for a participant with retired offers.
- PS-029-07.R03: Accessibility and budgets: privacy notices for publish and region selection use plain language with a localized key; no dark patterns on the retire and erase controls (retire is one tap plus one confirmation). Abuse controls must not block a legitimate publish in the normal path beyond the documented rate limits.
- PS-029-07.R04: Every data element has exactly one class, one storage location and one retention rule. Undeclared fields are rejected at the schema boundary.
- PS-029-07.R05: Public payloads never contain owner_participant_id, revision, draft fields, retire reason, precise location or contact data.
- PS-029-07.R06: Abuse controls are enforced server-side. Client-side limits are advisory only.
- PS-029-07.R07: Erasure and retirement follow the retention table below. Legal-hold exceptions are recorded with `hold_ref` and do not extend retention for unrelated fields (D07 open).

## Data classes and retention
Class labels: `PSEUDONYM` (identifier linked to a participant, not public), `PUBLIC-CONTENT` (shown to any catalog visitor once published), `LOC-COARSE` (approximate region only, CTR-PRV-001), `OPERATIONAL` (system records without personal content).

| Element | Class | Storage | Disclosure | Retention |
|---|---|---|---|---|
| `owner_participant_id` | PSEUDONYM | Primary store | Owner only; never in public payload | Life of offer plus tombstone (below) |
| `title`, `description`, `tags`, `proficiency`, `rate_*` (draft or retired) | PSEUDONYM | Primary store | Owner only | Purged 30 days after `retired_at` |
| `title`, `description`, `tags`, `proficiency`, `rate_*` (published, paused, expired) | PUBLIC-CONTENT | Primary store and search index | Public while published | Life of offer; purged at retire plus 30 days |
| `discovery_region_code` | LOC-COARSE | Primary store and search index | Public while published (region only) | Same as content |
| Tombstone (`skill_id`, `state`, `retired_at`, `retire_reason_code`, `category_code`) | OPERATIONAL | Primary store | Operator aggregate only | 365 days (A-skills-19) |
| `skill_offer_transition` rows | OPERATIONAL | Primary store | Owner summaries; moderator case-bound | 180 days, then aggregated counts only (A-skills-19) |
| `skill_offer_idempotency` rows | OPERATIONAL | Primary store | None | 24 hours |
| Structured logs | OPERATIONAL | Log store | Operator | 30 days, fields per [observability](observability_performance.md) |
| Export bundles | PSEUDONYM | Owner download only | Owner | Deleted from server after 24 hours |

Retention jobs run daily. Purge is hard delete of content fields; the tombstone is the only remaining record of a retired offer. Erasure of a participant (F07 closure) moves all their non-retired offers to `retired` with `participant_closed` and starts the same purge timers.

## Disclosure rules
- Public search returns only published offers in the requested region, with `owner_display_pseudonym` from F07. It never returns exact location, home address, contact data, revision, or any state other than published.
- Owner views return the owner's own draft fields. No other participant can read them.
- Events and logs never carry title, description, tags, or rate values. `SkillOfferUpdated` carries field names only.
- Moderator views are case-bound and logged. Operators get aggregate counts by region and category only, with a minimum group size of 10 to avoid singling out participants (A-skills-19).

## Abuse controls
| Control | Default | Response on breach | Assumption |
|---|---|---|---|
| Write rate per participant | 30 writes per minute | `SKILLS_RATE_LIMITED` with `Retry-After` | A-skills-20 |
| Search rate per client session | 120 requests per minute | `SKILLS_RATE_LIMITED` | A-skills-20 |
| Published and non-retired quota | 5 and 20 | `SKILLS_QUOTA_EXCEEDED` | A-skills-10 |
| Contact-data and precision detection | Blocked on write | `SKILLS_CONTACT_DATA_DETECTED` or `SKILLS_LOCATION_PRECISION_REJECTED` | A-skills-06 |
| Duplicate detection on publish | Blocked | `SKILLS_DUPLICATE_OFFER` | A-skills-26 |
| Search pagination | Max 50 per page, cursor expires in 10 min | `SKILLS_CURSOR_INVALID` | Commands file |
| Publish and retire churn | More than 10 publish or retire pairs per day for one offer triggers review | Moderation queue entry, offer stays in current state | Heuristic |
| Blocked participant | Writes denied, search hidden | `SKILLS_PARTICIPANT_BLOCKED` | A-skills-11 |
| Enumeration | Missing and foreign IDs return the same response | `SKILLS_NOT_FOUND` | Authorization file |

Reporting: any visitor may report a published offer. Report intake and review belong to the moderation module. This module receives only the resulting `moderate_remove` command with a `case_ref`.

## Assumptions
- A-skills-19: Retention periods: tombstone 365 days; transition rows 180 days; content purge 30 days after retire; export bundles deleted after 24 hours; operator aggregates use a minimum group size of 10. Final values depend on D07.
- A-skills-20: Write rate 30 per minute and search rate 120 per minute per client session, to be confirmed against load tests.
- A-skills-21: Structured logs use a keyed HMAC of `owner_participant_id` (30-day key rotation) in place of the raw ID. No raw IP address is logged by this module.

## Open decisions
- D07 (retention): the periods above are recommended defaults, not approved policy. Legal-hold scope is not defined.
- CTR-PRV-001 class names: `PSEUDONYM`, `PUBLIC-CONTENT`, `LOC-COARSE`, `OPERATIONAL` are provisional labels; F10 must confirm or map them.
- D05 (geoprivacy): region-only disclosure is assumed. Precision upgrade by user request is not part of this module.

## Testing
- TEST-PS-029-07-T01: Public search response for a published offer contains none of: `owner_participant_id`, `revision`, `retire_reason_code`, draft fields, contact data. Pass when a key scan finds zero matches.
- TEST-PS-029-07-T02: Search of a draft returns nothing. Pass when the result set for that region excludes the draft's `skill_id`.
- TEST-PS-029-07-T03: Retire then wait 30 days (time-travel fixture): content fields are null and the tombstone remains. Pass when the purge job result matches the table.
- TEST-PS-029-07-T04: Log sample for a full publish flow contains no title, description, tag, or rate value, and the participant field is an HMAC. Pass when a regex scan finds no matches.
- TEST-PS-029-07-T05: Search scraper simulation at 300 requests per minute from one session. Pass when requests above 120 per minute receive `SKILLS_RATE_LIMITED` and no result set exceeds 50 items.
- TEST-PS-029-07-T06: Erasure of a participant with three published offers: all three move to retired with `participant_closed` and no content is returned by search afterward. Pass when all checks match.
