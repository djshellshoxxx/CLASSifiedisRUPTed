# PS-095-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_abuse (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-095-09.R01 | Each rule in the registry ships with positive and negative fixtures; CI fails without them. | MVP |
| PS-095-09.R02 | Evasion fixture corpus (homoglyph, zero-width, split tokens, abbreviations) is part of every release gate. | MVP |

## Test map
| Test ID | Level | Scope |
|---|---|---|
| TEST-PS-095-01-01 | lint | no matched text fields |
| TEST-PS-095-01-02 | uniqueness | re-scan idempotent |
| TEST-PS-095-02-01 | unit | normalization |
| TEST-PS-095-02-02 | registry | two-approver rule |
| TEST-PS-095-02-03 | window | boundary match |
| TEST-PS-095-03-01 | property | review sequences |
| TEST-PS-095-03-02 | negative | self-review |
| TEST-PS-095-03-03 | restriction | 14-day expiry |
| TEST-PS-095-04-01 | contract | schema 1.0.0 |
| TEST-PS-095-04-02 | idempotency | repeat scan |
| TEST-PS-095-04-03 | lint | event payloads |
| TEST-PS-095-05-01 | matrix | action matrix |
| TEST-PS-095-05-02 | scanner | no review rights |
| TEST-PS-095-05-03 | governance | dual approval |
| TEST-PS-095-06-01 | fault | scanner outage |
| TEST-PS-095-06-02 | replay | duplicate jobs |
| TEST-PS-095-06-03 | rollback | rule disable |
| TEST-PS-095-07-01 | privacy | text absence |
| TEST-PS-095-07-02 | bias | review record gate |
| TEST-PS-095-07-03 | retention | 90-day purge |
| TEST-PS-095-08-01 | logs | rule_id only |
| TEST-PS-095-08-02 | alert | precision governance |
| TEST-PS-095-08-03 | load | scan budget |
| TEST-PS-095-10-01 | export | legal path only |
| TEST-PS-095-10-02 | rollback | findings retained |

## Acceptance criteria
1. All test IDs pass in CI before implementation sign-off (future phase).
2. Evasion corpus detection meets per-rule precision and recall targets set by Trust&Safety (OPEN values).

## Assumptions & open decisions
- ASSUMPTION: fixtures are synthetic.
- OPEN: language coverage and recall targets (Trust&Safety, F14 for locales).
