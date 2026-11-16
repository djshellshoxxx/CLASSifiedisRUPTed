# PS-008-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [01_LocalBazaar/03_inventory/mod_availability](SPEC.md) (F01.S03.M01; accountable role: Privacy Lead for review, Marketplace Lead for owner). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, retention, disclosure), CTR-FED-001 (federation default), CTR-CAP-001.

**Decisions:** Retention defaults are PROVISIONAL (D07 default, unapproved). Holds are never federated (CTR-FED-001 R02 default; PROVISIONAL, unapproved). Jurisdiction review of retention is OPEN (R07).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-008-07.R01 | Counts are PUBLIC. `holder_ref` is PSEUDONYMOUS. No field of this module is PRIVATE_PERSONAL or higher. | MVP |
| PS-008-07.R02 | No holder ref in logs, analytics, push previews or federation. | MVP |
| PS-008-07.R03 | A holder may hold at most 3 open holds per listing and the listing at most 50 (PS-008-02 V11–V12). | MVP |
| PS-008-07.R04 | Availability counts and holds are never federated. | MVP |
| PS-008-07.R05 | Account deletion withdraws the account's open holds and replaces `holder_ref` with a tombstone digest. | MVP |

## Data classes and retention
| Record | Class | Retention |
|---|---|---|
| `availability.record` | PUBLIC | RET-ACC (listing lifetime + 30 d) |
| `hold` PLACED | PSEUDONYMOUS | until terminal, max 72 h + 1 h |
| `hold` terminal (WITHDRAWN, EXPIRED) | PSEUDONYMOUS | RET-OPS, 30 d |
| `hold` EXECUTED | PSEUDONYMOUS | RET-OPS, 30 d; the transaction record is owned by F09 under RET-EVD |

Retention boundary: this module keeps no transaction evidence beyond the hold reference.

## Abuse controls
- Phantom holds (reserving stock without intent): TTL, per-holder limit, per-listing limit, and holder must hold a real offer (PS-008-02).
- Scraping of counts: `availability.read` is rate-limited (SYS.RATE_LIMITED, ASSUMPTION 300 req/min per principal).
- Sybil reservation: holder accounts under F07 identity limits. Residual risk recorded; pseudonyms do not guarantee anonymity.
- Enumeration of hidden listings: uniform SYS.NOT_FOUND (CTR-ERR-001 R08).

## Privacy checks
- Owner export: own records and holds; other holders redacted (CTR-PRV-001 R11).
- Deletion completion record: IDs and counts only (CTR-PRV-001 R12).
- Logs carry `availability_id` and `hold_id` only.

## Threats
Holder linkage through hold timing (mitigated: `hold_id` is opaque). Count inference of private sales (ASSUMPTION: counts are coarse only when listing is private; PENDING F10 review). Forged commits: counts are seller-attested, not evidence.

## Tests
- TEST-PS-008-07-01 (lint): no PRIVATE_PERSONAL or higher field in schemas.
- TEST-PS-008-07-02 (log scan): `holder_ref` absent from logs and analytics fixtures.
- TEST-PS-008-07-03 (abuse): 4th hold by one holder on one listing rejected.
- TEST-PS-008-07-04 (deletion): deleting an account withdraws its holds and leaves tombstones.
- TEST-PS-008-07-05 (federation): export of listing with availability omits all counts unless listing is federated under CTR-FED-001.

## Acceptance criteria
1. TEST-PS-008-07-01 to -05 pass.
2. Zero holder refs in the log corpus.
3. Retention table matches CTR-PRV-001 classes.

## Assumptions & open decisions
- PROVISIONAL (D07 default, unapproved): per-class retention above.
- ASSUMPTION: 300 req/min read limit; 72 h maximum hold life.
- OPEN: F10 review of count disclosure on private-visibility listings.
