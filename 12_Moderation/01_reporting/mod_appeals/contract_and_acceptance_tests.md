# PS-092-09 — Contract and acceptance tests: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-092-09.R02** Contract tests check commands, statements and events against the schema registry.
- **PS-092-09.R03** Reviewer independence and window arithmetic are covered by deterministic tests with an injected clock.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay X with moderators M1 (decider, keys K1 and K1b in one key set), M2 (key K2), M3 (key K3, filed report R on the case) and operator O; member A with a remove_from_index action on listing L issued 2026-11-04T10:00:00Z; a second action expiring 2026-11-20; injectable clock.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T01 | unit | PS-092-01.R01, PS-092-01.R03 | file a valid appeal, then try to change its statement | Appeal stored with deadlineAt = reasonsIssuedAt + 30 days, statementDigest and status filed; statement change refused with CONFLICT_STATE |
| TEST-PS-092-09.T02 | unit | PS-092-02.R01, PS-092-02.R02, PS-092-02.R03 | unknown field; relay receives on day 30 and day 31; arrival on day 32 with createdAt backdated to day 29; duplicate; reviewer conflict; short reasons | VALIDATION_FAILED; accepted on day 30; MODERATION_APPEAL_WINDOW_CLOSED for day 31 and for the backdated day-32 arrival; documented error codes otherwise |
| TEST-PS-092-09.T03 | property | PS-092-03.R01, PS-092-03.R02 | random sequences of assign, reassign, decide, withdraw, revert and expiry | only declared transitions succeed; terminal states never change; reviewer principal never equals decider, subject or reporter |
| TEST-PS-092-09.T04 | integration | PS-092-03.R02, PS-092-03.R03 | relay with a single eligible moderator; second moderator added; decision overturned, then another appeal decided reduced | awaiting_reviewer then in_review; overturned emits moderation.appeal.decided that reverts the action; reduced emits the decided event with typed reducedTo and the action is replaced |
| TEST-PS-092-09.T05 | contract | PS-092-04.R01, PS-092-04.R02, PS-092-04.R04, PS-092-09.R02 | each command, statement and event | validate against registry schemas; relay statements verify with the relay key and carry no reviewer signature or key |
| TEST-PS-092-09.T06 | integration | PS-092-04.R03, PS-092-03.R04 | action.applied then action.reverted by moderator_decision before the decision; another action reaches expiry with an appeal in_review | deadline stored; first appeal moot with action_reverted, second moot with action_expired; appealmoot statements issued; no moderation.appeal.decided and no second revert; vault shows Closed as moot, never overturned |
| TEST-PS-092-09.T07 | abuse | PS-092-05.R01, PS-092-05.R02, PS-092-05.R03 | stranger files; decider decides; appellant queries its appeal and inspects every statement | FORBIDDEN, MODERATION_APPEAL_REVIEWER_CONFLICT, reviewer key absent from responses and statements |
| TEST-PS-092-09.T08 | abuse | PS-092-07.R01, PS-092-07.R03 | forged decision signature; 6th appeal in a day; 21st appeal in 30 days | decision quarantined, vault never shows decided; 6th and 21st return RATE_LIMITED |
| TEST-PS-092-09.T09 | integration | PS-092-06.R01, PS-092-06.R02 | same Idempotency-Key replayed; concurrent assign and withdraw | original receipt replayed; consistent final state by revision |
| TEST-PS-092-09.T10 | chaos | PS-092-06.R03, PS-092-03.R03 | decision committed, then the mailbox delivery of the decision statement fails | event and decision stored in one transaction; vault fetches the decision through status_for_appellant; sync state advances honestly |
| TEST-PS-092-09.T11 | integration | PS-092-07.R02 | appellant deletes the vault copy; injected clock passes RET-EVIDENCE on the relay | relay copy retained until RET-EVIDENCE end and then purged through the RetentionPurgePort; UI states the relay copy remains |
| TEST-PS-092-09.T12 | load | PS-092-08.R01, PS-092-08.R02, PS-092-08.R03 | 50 req/s mixed receive and decide for 5 minutes; assign 1 000 appeals; 20 appeals pass day 14 undecided | p95 ≤ 300 ms, assignment ≤ 5 s, overdue metric counts 20, no statement text in logs |
| TEST-PS-092-09.T13 | unit | PS-092-09.R01, PS-092-09.R03 | traceability tool run; window tests run with an injected clock | every PS-092 requirement maps to a passing test; window boundaries are deterministic |
| TEST-PS-092-09.T14 | integration | PS-092-10.R01, PS-092-10.R02, PS-092-10.R03 | export appeal packet, import into fresh vault, restore relay backup; read a v1 appeal with an unknown outcome with the previous reader | signed decision verifies after round trip; imported pending appeals are not re-sent; unknown outcome displays as decided |
| TEST-PS-092-09.T15 | e2e | PS-092-01.R02, PS-092-04.R01 | mobile appellant files offline and reconnects | appeal reaches the relay, timeline shows honest states, axe zero serious issues |
| TEST-PS-092-09.T16 | integration | PS-092-03.R05 | reviewer M2 loses the moderator role (security.role.revoked); another appeal reaches day 10 in review; operator reassigns a third | each returns to awaiting_reviewer, reviewer recorded in the audit log, a new eligible reviewer is assigned; reassignCount increments |
| TEST-PS-092-09.T17 | abuse | PS-092-05.R03 | decide an appeal and inspect the decision envelope, status statements, events and the vault copy; read the relay audit log as operator | only the relay key signed the statements; reviewer key absent everywhere except the relay copy and audit log |
| TEST-PS-092-09.T18 | abuse | PS-092-05.R04, PS-092-02.R03 | assign M1 via second key K1b; assign M3 who filed report R; assign a moderator whose key set lists the subject's key; assign the proposer of a host-policy auction void action | MODERATION_APPEAL_REVIEWER_CONFLICT in each case; M2 assigned |
| TEST-PS-092-09.T19 | integration | PS-092-05.R05 | key of A suspended on relay X files an appeal and reads its status | appeal accepted and status returned |
| TEST-PS-092-09.T20 | unit | PS-092-01.R04 | decide reduced with a more severe kind, a later expiry, an extra capability, and a valid warn | VALIDATION_FAILED three times; valid reduced stored with typed reducedTo |
| TEST-PS-092-09.T21 | integration | PS-092-02.R04, PS-092-06.R04 | first delivery on day 29 with the receipt lost and a retry on day 32; same appealId with a changed digest; appeal forwarded to relay Y | stored receipt returned on day 32; IDEMPOTENCY_KEY_REUSED; relay Y refuses with FORBIDDEN |
| TEST-PS-092-09.T22 | integration | PS-092-07.R04 | ExportSectionPort run, then privacy.deletion.completed in the vault with keepEvidence true and false; relay DeletionPort applied | section moderation.appeals exported; vault appeals deleted or pseudonymized; relay copy pseudonymized and retained |
| TEST-PS-092-09.T23 | integration | PS-092-04.R02 | vault receives a verified appealdecision/v1 and one with a forged signature | local moderation.appeal.decided derived with origin vault and actor.kind federated; forged one quarantined; F12.S02.M01 ignores the vault-origin event |
| TEST-PS-092-09.T24 | contract | PS-092-04.R05 | compare the outcome and origin enums of the moderation.appeal.decided schema and the relay-local moderation.appeal.filed schema with the F18.S02.M02 dimension fixture; a moot closure; a schema fixture that adds an outcome within v1 | identical values (upheld, overturned, reduced; relay, vault); no decided event for moot; the added outcome fails the contract check |

## Acceptance criteria

- All tests T01–T24 pass in CI.
- No appeal is ever decided by a moderator whose principal made the original decision, is the subject or reported the case (property and abuse tests).
- The 30-day window is always computed from the relay-signed statement time against the relay's receive time, and expiry or a moderator revert never shows the appellant an overturned outcome.

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M01, F12.S01.M02, F12.S02.M03, F07.S02.M01, F08.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
