# PS-028-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-028-07. **Owner:** [03_Services/01_service_catalog/mod_availability](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_availability. **Consumers:** privacy F10 (classes and retention, CTR-PRV-001); security F16 (abuse controls, CTR-CAP-001); identity F07; 03_Services/02_service_booking.

## Purpose and scope
Defines the data classes stored by this module, where they live, how long they are kept, what may be disclosed and to whom, and the abuse controls that protect availability inventory. Exact home addresses are never stored here. Pseudonyms do not guarantee anonymity against network metadata, counterparties or legal process (PROJECT_SPEC).

Exclusions: moderation case handling (moderation feature), legal hold process (F10), and IP-level network controls (F16 edge).

## Data classes
Class labels are provisional until CTR-PRV-001 is expanded by F10 (A-availability-12).

| Field | Label | Location | Disclosure |
|---|---|---|---|
| provider_ref, claimant_ref | pseudonymous_ref | this module, same region as service | provider sees own; booking_service sees claimant_ref for own claims; never public |
| region_code | coarse_region | this module | public for PUBLISHED windows |
| timezone | coarse_region (timezone label) | this module | public for PUBLISHED windows; not in event payloads |
| start_at, end_at, local_date | operational | this module | public for PUBLISHED windows |
| capacity fields, status | operational | this module | owner full; public sees available and remaining_bucket only |
| note | free_text | this module | public for PUBLISHED windows after validation; subject to moderation |
| release_reason, suspension_code | operational | this module | owner sees; moderator sees suspension_code |
| audit rows | operational | this module | operator counts only; availability.audit.read with claimant_ref removed |

Forbidden in this module: exact home address, precise coordinates, IP address, device identifiers, legal names, contact details, payment identifiers. Validation rejects contact patterns in notes (AVAILABILITY_NOTE_CONTAINS_CONTACT_DATA).

## Location and disclosure rules
- Public search returns region_code at subdivision level only (ISO 3166-2). No city, postal code or coordinates.
- Discovery regions are deliberately coarse (PROJECT_SPEC; D05, OPEN). Subdivisions with fewer than 5 active providers in a 7-day window are merged into a parent subdivision in public search results. This limits single-provider location inference.
- Timezone is shown to viewers only as a display label. It is not used for distance or location filtering.
- Precise provider location, if ever needed, is user-initiated and owned by F10. It is not in this module.

## Retention
| Record | Retention after trigger | Trigger | Deletion mode |
|---|---|---|---|
| UNPUBLISHED window | 30 days | created_at | hard delete |
| DISCARDED window | 30 days | terminal_at | hard delete |
| PUBLISHED, SOLD_OUT, SUSPENDED window | until end_at plus 180 days | end_at | hard delete after window |
| WITHDRAWN, EXPIRED window | 180 days | terminal_at | hard delete |
| Schedule ACTIVE or PAUSED | while provider account exists | account state | cascade to windows per rules |
| ARCHIVED schedule | 180 days | archive time | hard delete |
| AvailabilityClaim terminal (RELEASED, EXPIRED) | 365 days | terminal_at | hard delete; pseudonymous ref kept for dispute evidence within window |
| AvailabilityClaim CONFIRMED | until booking-side retention ends, then 365 days | booking_ref closure | hard delete |
| AvailabilityAudit | 365 days | occurred_at | hard delete |
| Idempotency record | 24 hours | created_at | hard delete |
| Operational logs | 14 days | emitted_at | hard delete |

Defaults are proposals under D07 (OPEN). Legal hold suspends deletion for matched records. Holds are placed by F10 only.

## Provider deletion and export
- Provider deletion request: all UNPUBLISHED and PUBLISHED windows are withdrawn or discarded first. Confirmed claims block deletion until booking-side closure. Then schedules are archived and records follow the retention table, with `provider_ref` replaced by a tombstone token in claims and audit rows that must be kept.
- Provider export: JSON Lines of own schedules and windows (see import_export_backup_rollback.md). Claim records are exported only as claim counts and booking_ref values, not claimant_ref.

## Abuse threats and controls
| Threat | Control | Limit (A-availability-11) |
|---|---|---|
| Inventory hoarding by holding all windows | per-claimant hold rate and active hold cap | 30 holds per minute per claimant_ref; 10 active HELD per claimant_ref |
| Fake availability to attract bookings | region and offering ownership checks; moderation suspend | 60 window writes per minute per provider; 2000 per day |
| Schedule flooding | expansion limit and schedule cap | 10 schedule creates per day per provider; 1000 windows per schedule per 90 days |
| Scraping of public inventory | remaining_bucket instead of counts; search pagination cap | 60 search requests per minute per origin key (F16 edge); limit at most 100 per page |
| Contact harvesting via notes | note validation | rejected patterns in validation_rules.md |
| Replay of commands | idempotency keys | 24-hour window |
| Sybil providers | account trust from F07 and F16; out of scope here | this module enforces per-provider limits only |
| Abuse of hold to block competitors | short TTL, per-claimant cap, moderation review of pattern | TTL 15 minutes |
| Enumeration of claim IDs | ULID with uniqueness check; 404 for non-owner | not applicable |

Rate-limit numbers are defaults. F16 owns enforcement and may tighten them per abuse signal. Over-limit responses use AVAILABILITY_RATE_LIMITED.

## Metadata leakage
- Event payloads and public responses exclude timezone, note and claimant_ref (except claim events to booking_service).
- Error responses never confirm whether a non-owned window exists.
- Logs use opaque IDs only (observability_performance.md).

## Requirements
- [ ] PS-028-07.R01: Every stored field is assigned a class, location, retention and disclosure rule in the tables above.
- [ ] PS-028-07.R02: Public search cannot reveal exact provider addresses, precise coordinates or claimant identities. Covered by TEST-PS-028-07-T01.
- [ ] PS-028-07.R03: Subdivisions below the provider threshold are merged in public results. Covered by TEST-PS-028-07-T02.
- [ ] PS-028-07.R04: Deletion and retention jobs remove records at the stated time and respect legal hold. Covered by TEST-PS-028-07-T03.
- [ ] PS-028-07.R05: Abuse limits return AVAILABILITY_RATE_LIMITED and do not change state. Covered by TEST-PS-028-07-T04.

## Open decisions
- A-availability-06: Region granularity is ISO 3166-2 subdivision. The 5-provider merge threshold is a proposal (D05, OPEN).
- A-availability-07: Retention defaults above are proposals for D07 (OPEN). Booking-side retention may be longer and governs CONFIRMED claims.
- A-availability-11: Rate-limit numbers are defaults owned by F16 enforcement.
- A-availability-12: CTR-PRV-001 class labels are provisional.
