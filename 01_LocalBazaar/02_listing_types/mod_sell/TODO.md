# TODO

**Status:** SPEC-DRAFT-COMPLETE (pending approval). PS-006-01 to PS-006-10 written. Approval, cross-feature validation and implementation remain open.

- [x] Define ownership and directory contract.
- [x] Enumerate module process specifications.
- [x] Write the 10 process specs (PS-006-01 to PS-006-10): requirements, states, error codes, tests.
- [ ] Register the `prq` ID prefix in CTR-ID-001 (PENDING).
- [ ] Confirm F09 transaction-level event for `trx_` create and cancel (PENDING CTR-COM-001).
- [ ] Register the `sell` extension and sell events in CTR-SCH-001 (PENDING, at implementation).
- [ ] Confirm F07 account-tier signal used to gate `request_purchase` (ASSUMPTION in PS-006-07).
- [ ] Confirm F12 account-suspension flag readable at decision time (ASSUMPTION in PS-006-05).
- [ ] Decide D07 retention for `prq_` records (PROVISIONAL, unapproved).
- [ ] Privacy review of `region_cell` and buyer visibility (F10).
- [ ] Abuse review of request limits and reservation caps (F12).
- [ ] Validate lst_ lifecycle boundary with F01.S01 and sale-recording contract with F09.
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).
