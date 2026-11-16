# TODO

**Status:** SPEC-DRAFT-COMPLETE (pending approval).

## Specification (done)
- [x] Ten canonical process specs authored (PS-003-01 to PS-003-10).
- [x] Requirement IDs, test IDs and error codes assigned per process.
- [x] Editable field set and data classes fixed (six fields; coarse region only).
- [x] Transition table for `draft`, `published`, `archived`, `hidden` written.

## Open items before approval
- [ ] Confirm listing lifecycle states with mod_publish and mod_archive owners (blocks PS-003-03; CTR-LST-001 PENDING).
- [ ] Confirm open-offer flag contract with 04_pricing/mod_offers (blocks R03 of PS-003-03).
- [ ] Confirm category and region registry owner and change process (blocks PS-003-01 R04–R05).
- [ ] Confirm giveaway price rule with 02_listing_types/mod_giveaway (PS-003-02 R04).
- [ ] Register `listing.updated` 1.0.0 in CTR-SCH-001 registry (PS-003-04).
- [ ] Confirm consumer list (mod_index, moderation re-screen) via dependency matrix (PS-003-09 R02).
- [ ] Set rate-limit and churn-threshold values with F12 and F15 (PS-003-07 R05–R06).
- [ ] Resolve D01, D03, D05, D07, D08 (open in DECISIONS.md; PROVISIONAL defaults used).

## Verification (future phases)
- [ ] Implement `listing.edit` and `listing.get_for_edit` (future prompt only).
- [ ] Verify conflict, replay and offline tests (PS-003-06, PS-003-09).
- [ ] Verify mobile and screen-reader behavior for conflict and blocked-edit messages.
- [ ] Privacy and security review of log redaction and rate limits.
