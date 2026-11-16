# PS-005-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_giveaway. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, R04 cells, R06 retention, R09 logs, R10 previews, R11 export), CTR-EVT-001 R08, CTR-CAP-001 R06–R07.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-005-07.R01 | Claim record max class PRIVATE_PERSONAL; no field of class LOCATION_PRECISE exists in this module. | MVP |
| PS-005-07.R02 | Pickup is region-only (LOCATION_COARSE, registered cells). Exchange point and time are agreed in F08 threads, not stored here. | MVP |
| PS-005-07.R03 | Terminal claims purged 90 days after terminal state (PROVISIONAL D07 default, unapproved). Open claims purged at expiry or listing removal, whichever first. | MVP |
| PS-005-07.R04 | Claim-spam limits: PS-005-02 R07. Pseudonym farms: rate limits per credential/device via F07 (PENDING). | MVP |
| PS-005-07.R05 | Listing text cannot ask for fees, deposits or off-platform payment; detection flags go to F12 (case). | MVP |
| PS-005-07.R06 | Giver sees claimant pseudonym (`prf_`) only; claimant list endpoints are giver-only and rate-limited. | MVP |
| PS-005-07.R07 | Push and in-app text is generic ("New claim on your giveaway") (CTR-PRV-001 R10). | MVP |
| PS-005-07.R08 | Automated matching of claimants by location or interest profile is not in scope. | Future |

## Data / schema
Retention per field: claim rows as in R03; history events redacted to digest on purge (CTR-EVT-001 R08). Logs carry `gcl_` ID and code only.

## Commands / queries / events
Events carry no free text, so purge needs no payload scrubbing beyond redaction.

## States & transitions
Purge is a `sys` transition on terminal states; see [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Abuse-related rejections use `GIVE.CLAIM_LIMIT_EXCEEDED`; no reason text is returned.

## Authorization
Moderator access only via case scope with dual control ([authorization_capabilities](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Purge is idempotent and resumable. Backups follow [import_export_backup_rollback](import_export_backup_rollback.md).

## Privacy, retention, abuse
Abuse cases:
- Bait listings (fake giveaway to lure people to meetups or collect contact data): F12 report, listing removal, claimant notice.
- Doxxing via pickup: no precise field exists; F08 safe-meetup guidance.
- Sybil claims from many pseudonyms: per-credential limits; claims do not decide the giveaway, giver does.
- Harvesting interest lists: giver-only views, no public claim counts per claimant.

## Observability & performance
Log redaction test: no `acc_`, `prf_` or coordinates in logs (CTR-ERR-001 R10). Purge job lag ≤ 24 h (CTR-PRV-001 R06).

## Tests
- TEST-PS-005-07-01: schema scan finds no LOCATION_PRECISE or free-text field.
- TEST-PS-005-07-02: purge removes claim rows and derived views within 24 h fixture.
- TEST-PS-005-07-03: abuse fixtures: fee-request listing text is flagged and routed to F12.

## Acceptance criteria
1. Field class annotations pass CTR-PRV-001 R01 CI check.
2. No API response lists claimants to non-givers.
3. Purge and redaction are verifiable in fixtures within the 24 h budget.

**Assumptions and open decisions:** 90-day purge and 7-day expiry are PROVISIONAL (D07 default, unapproved). D05 (PROVISIONAL default: coarse public regions, user-initiated precision, unapproved) governs pickup. Retention periods need R07 jurisdiction review (OPEN). See [DECISIONS.md](../../../DECISIONS.md).
