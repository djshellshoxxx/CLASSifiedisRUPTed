# PS-039-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-039-07. **Owner:** [05_Rentals/01_rental_catalog/mod_availability](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_availability. **Consumers:** 05_Rentals/02_rental_lifecycle, moderation, observability; shared F10 privacy (CTR-PRV-001), F16 security, F07 identity per [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Requirements
- PS-039-07.R01: Every stored field has a location class, retention class and disclosure class. No field stores exact home address, coordinates or free text.
- PS-039-07.R02: Public disclosure is limited to day-level availability. Claim-level detail is disclosed only to the parties of that claim.
- PS-039-07.R03: Abuse controls bound hold spam, calendar scraping, enumeration and self-dealing. Each control has a stated default and an error code.

## Classes
Class labels are provisional until CTR-PRV-001 is expanded by F10 (A-AVAIL-23).

| Field group | Location class | Retention class | Disclosure class |
|---|---|---|---|
| listing_id, timezone_id | LOC-COARSE (listing region only) | operational | public |
| window and block intervals | LOC-NONE | operational, then evidence (see below) | public at day granularity; owner in full |
| owner_participant_id, requester_participant_id | LOC-NONE | evidence | party-only |
| claim intervals and states | LOC-NONE | evidence | party-only |
| source_ref | LOC-NONE | evidence | party-only, lifecycle internal |
| idempotency records | LOC-NONE | short | internal |
| operational logs | LOC-NONE | short | internal, no personal data |

No exact address, coordinates or device location is stored here. Requester location is never required to request a period.

## Retention
| Record | Active retention | After terminal or end | Legal hold |
|---|---|---|---|
| window | while active | 365 days after `ends_at_utc` | suspends deletion |
| block | while active | 365 days after `ends_at_utc` | suspends deletion |
| claim held and expired | until expiry | 90 days after `hold_expires_at_utc` | suspends deletion |
| claim committed and released | until release | 730 days after release (A-AVAIL-22) | suspends deletion |
| idempotency record | 7 days | deleted at expiry | not applicable |
| operational logs | 30 days | deleted | not applicable |

Retention is evaluated by a daily job. Deletion is logical first, physical after 30 days, and is recorded as an event without personal data.

## Deletion and account closure
- Participant deletion replaces `owner_participant_id` and `requester_participant_id` with the sentinel `deleted_participant` on all records. Intervals and listing IDs remain so that calendars stay consistent.
- A deleted participant's held claims are released with reason `requester_withdrew`. Commitments are not released by deletion; they follow the lifecycle path, and retention applies after that.
- Deletion is blocked only by an active legal hold, and the block is reported to the caller as a typed status, not a failure.

## Disclosure rules
- Public calendar: `open`, `requested`, `unavailable` only. A `requested` interval never reveals whether it is held or committed, or who requested it.
- Owner: may see claim IDs, intervals, states and requester pseudonym for claims on their own listing.
- Requester: may see only their own claims.
- Operators: see listing suspension reason codes and aggregate counters. No claim bodies.
- Notifications carry error keys and claim IDs only; no pseudonym of the other party is sent in the notification body.
- Export of a participant's own claims follows import_export_backup_rollback.md and excludes other parties' pseudonyms.

## Abuse controls
| Control | Default | Error code |
|---|---|---|
| Active held claims per requester | 5 across all listings | AVAIL_RATE_LIMITED |
| Hold creations per requester | 20 per hour | AVAIL_RATE_LIMITED |
| Requester cooldown after repeated expiries | 3 expired holds within 30 days triggers 7-day hold cooldown (A-AVAIL-24) | AVAIL_RATE_LIMITED |
| Owner-side writes per listing | 200 per hour | AVAIL_RATE_LIMITED |
| Public calendar reads per client token | 60 per minute | AVAIL_RATE_LIMITED |
| Public calendar range | 92 days maximum | AVAIL_QUERY_RANGE_TOO_LARGE |
| Self-hold | forbidden | AVAIL_SELF_REQUEST_FORBIDDEN |
| Blocked participant | cannot hold; existing holds released | AVAIL_NOT_AUTHORIZED |
| Hold-squatting on a listing | owner may release a held claim with reason owner_declined at any time | none (owner action) |

Anomaly signals (many holds across many listings from one actor within an hour) are sent to moderation as aggregate counters. They do not block the actor automatically in this version.

## Threats covered
- Hold spam to block a listing: caps above, expiry, cooldown.
- Calendar scraping for surveillance: day granularity, range cap, rate limit, no IDs in public view.
- Enumeration of requesters: public view has no identifiers; owner view is limited to own listing.
- Forged or replayed commands: capability checks, idempotency and signed service principal for commit.
- Stale federated records: out of scope for this version.

## Open decisions
- A-AVAIL-22: Evidence retention of 730 days after release is assumed. D07 (retention defaults) is OPEN in DECISIONS.md.
- A-AVAIL-23: Location, retention and disclosure class labels are provisional until CTR-PRV-001 is expanded.
- A-AVAIL-24: Requester cooldown threshold (3 expiries in 30 days, 7-day cooldown) is a default for tuning, not a validated figure.
