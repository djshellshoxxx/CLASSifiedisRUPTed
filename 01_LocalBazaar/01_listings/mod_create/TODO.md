# TODO — F01.S01.M01 create

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Process specifications written; review and implementation pending.

## Specification (done)
- [x] PS-002-01 domain schema: `listing.draft` fields and data classes.
- [x] PS-002-02 validation rules: size, location-key, text, type, price and region checks.
- [x] PS-002-03 state machine: `none → draft` only; offline client states.
- [x] PS-002-04 commands and events: `listing.create`, `listing.created`, `content_digest`.
- [x] PS-002-05 authorization: `lst.create` with owner relation; eligibility denials.
- [x] PS-002-06 idempotency and offline: 7-day key window; 5 s commit deadline; client-ID collision.
- [x] PS-002-07 privacy and abuse: quota 20/day, cap 50 drafts, 90-day expiry.
- [x] PS-002-08 observability: latency, log redaction, location-leak alert.
- [x] PS-002-09 contract and acceptance tests: contract fixtures, mobile and offline flows.
- [x] PS-002-10 import, export, backup and rollback: draft export, restore replay, flag-off behavior.

## Open items before review
- [ ] Name the category taxonomy owner (not in any registry). Blocks `category_code` finalization.
- [ ] Agree the region-cell scheme with F06 and F10 (D05). Blocks `region_cell` format.
- [ ] Confirm the fiat currency list and minor-unit exponents for `asking_price` (D03).
- [ ] F10 to confirm reuse of `PRV.PRECISE_LOCATION_FORBIDDEN` on the create input path.
- [ ] F07 and F12 to decide whether suspended accounts may read their own drafts.
- [ ] Confirm the 7-day idempotency window and the 5 s commit deadline with F15.
- [ ] Owners for CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001 are UNASSIGNED; review cannot close until they are named.

## Implementation and verification (future prompt only)
- [ ] Implement `listing.create` with atomic commit and idempotency rows.
- [ ] Verify tests PS-002-01 to PS-002-10, including the mobile, a11y and offline suites.
- [ ] Privacy and security review of logs, events and error bodies.
