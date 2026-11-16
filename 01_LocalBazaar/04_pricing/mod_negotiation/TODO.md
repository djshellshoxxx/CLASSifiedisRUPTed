# TODO

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Process specifications PS-010-01 to PS-010-10 written; open registry, contract and decision items below.

- [x] Define ownership and directory contract.
- [x] Enumerate module process specifications.
- [x] Expand PS-010-01 domain schema: negotiation record, terms, `neg_` ID.
- [x] Expand PS-010-02 validation rules: amount, quote, listing version, ratio bounds, round cap.
- [x] Expand PS-010-03 state machine: six states, turn rule, 72 h window, 14-day lifetime.
- [x] Expand PS-010-04 commands and events: `neg.*` and seven `negotiation.*` events.
- [x] Expand PS-010-05 authorization: action matrix, seller-view rule for initiator `acc_`.
- [x] Expand PS-010-06 failure and idempotency: unique active pair, accept-vs-expiry and accept-vs-edit races.
- [x] Expand PS-010-07 privacy and abuse: pseudonym-only views, no free text, 90/180-day and 24-month retention.
- [x] Expand PS-010-08 observability: latency budgets, must-be-zero alerts, log redaction.
- [x] Expand PS-010-09 contract and property tests: lifecycle, invariants, listing-edit race.
- [x] Expand PS-010-10 import, export and rollback: owner export, no import path, flag-off freeze.
- [ ] PENDING CTR-ID-001: register `neg` prefix (ulid class, owner F01) and aggregate `negotiation`.
- [ ] PENDING CTR-SCH-001: register seven `negotiation.*` event schemas and `negotiation.export`.
- [ ] Confirm `lst_` listing version field and snapshot semantics with F01 (`PS-010-02 R08`).
- [ ] Confirm handoff contract from `AGREED` to F09 `trx_` creation (no auto-create; PS-010-03 R04).
- [ ] PENDING B-06: name canonical owner ID for consent records used on acceptance; link it from PS-010-03.
- [ ] PROVISIONAL D03 (unapproved): confirm pinned quote at accept for cross-currency terms.
- [ ] PROVISIONAL D07 (unapproved): confirm 90/180-day and 24-month retention for negotiation records.
- [ ] PROVISIONAL D08 (unapproved): confirm offline accept and reject replay behavior.
- [ ] ASSUMPTION review: 72 h window, 14-day lifetime, 10 rounds, 0.10×–10.00× bounds, 20 active per initiator.
- [ ] F10 review: classify negotiated terms as PSEUDONYMOUS (PS-010-01 R06).
- [ ] F14 review: accessible status announcements and "not applied" copy (PS-010-09 TEST-09-09).
- [ ] Build PS-010 to TEST-PS-010 traceability table.
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).
