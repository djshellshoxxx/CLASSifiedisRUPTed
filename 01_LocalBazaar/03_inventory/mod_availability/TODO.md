# TODO — F01.S03.M01 availability

**Status:** SPEC-DRAFT-COMPLETE (pending approval).

- [x] Define ownership and directory contract.
- [x] Enumerate the 10 canonical process specifications.
- [x] PS-008-01: unit counters, invariant, hold record.
- [x] PS-008-02: rules V01–V13 and `AVAIL.*` codes.
- [x] PS-008-03: availability and hold state machines, SOLD_OUT derivation.
- [x] PS-008-04: owner and sys commands, queries, events.
- [x] PS-008-05: capability matrix for holder, owner, sys, moderator, federation peer.
- [x] PS-008-06: last-unit race, offer-hold saga, reconciliation, offline rules.
- [x] PS-008-07: retention, phantom-hold limits, count-scraping limit, deletion tombstones.
- [x] PS-008-08: budgets, metrics, log redaction.
- [x] PS-008-09: consumer contract tests (offers, archive, variants, cycle lock).
- [x] PS-008-10: owner export, restore order, compensating rollback, 14 d reversal.
- [ ] Register `avl` and `hld` prefixes in CTR-ID-001 (PENDING, F15).
- [ ] Add `hold.create` scope for F02.S03.M02 in CTR-CAP-001 (PENDING, F16).
- [ ] Record F01.S03.M01 as canonical owner of "listing unit availability" in planning/CONTRACTS.md (B-06, PENDING).
- [ ] Confirm `offer_ref` prefix and hold call path with F01.S04.M01.
- [ ] Confirm `variant_ref` prefix and boundary with F01.S03.M02.
- [ ] Decide D04 (hold-to-execution), D07 (retention), D08 (offline holds) — all OPEN.
- [ ] F10 review: count disclosure on private-visibility listings (OPEN).
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).
