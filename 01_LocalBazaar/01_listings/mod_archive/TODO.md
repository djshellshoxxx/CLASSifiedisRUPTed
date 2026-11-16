# TODO

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Module: F01.S01.M04 archive.

- [x] Define ownership and directory contract.
- [x] Write PS-001-01 domain schema (archive fields on `lst_`, invariants, classes).
- [x] Write PS-001-02 validation rules (reason enum, revision, state, moderation lock, publish revalidation on restore).
- [x] Write PS-001-03 state machine (PUBLISHED ↔ ARCHIVED, moderator path, rate limit).
- [x] Write PS-001-04 commands, queries, events (`listing.archived`, `listing.restored`).
- [x] Write PS-001-05 authorization (owner, moderator case scope, counterparty, operator deny).
- [x] Write PS-001-06 failure and idempotency (7-day key window, offline queue, revision conflict).
- [x] Write PS-001-07 privacy and retention (no free text, case ID hidden from owner, RET-ACC/RET-AUD).
- [x] Write PS-001-08 observability and budgets (archive latency, de-index lag, pseudonymous logs).
- [x] Write PS-001-09 contract and acceptance tests (TEST-PS-001-09-01 to -15).
- [x] Write PS-001-10 import, export, backup, rollback (flag-off rollback, golden migrations).
- [ ] Resolve PENDING CTR-LST-001 (active-reference query and lifecycle owner for `lst_`).
- [ ] Resolve PENDING CTR-NTF-001 (owner notice on moderator archive).
- [ ] Confirm D04 default: archive blocked during open cycle or exchange.
- [ ] Confirm D07 retention defaults with F10 (RET-ACC for archive fields, RET-AUD for events).
- [ ] Confirm D08 offline queue behavior for archive and restore with F15.
- [ ] Confirm 10-per-24 h transition limit and 60 s de-index budget (ASSUMPTION) with Marketplace Lead.
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt; F10, F14, F16, F17 gates).
