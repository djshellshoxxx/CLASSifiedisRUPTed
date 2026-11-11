# PS-096-09 — Contract and acceptance tests: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-096-09.R02** Contract tests check commands, statements and event payloads against the schema registry.
- **PS-096-09.R03** Race, conflict and no-silent-action cases are covered by deterministic tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay X, moderators M1 and M2 (M2 also holds a second device key in its F07.S02.M01 key set), operator O, author S with listing L and a federated copy on relay Y, three reports (one filed by M2), rule POL-FRAUD-001 v1 in force and v2 scheduled, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T01 | unit | PS-096-01.R01, PS-096-01.R02, PS-096-02.R01 | apply remove_from_index with a valid in-force rule and facts | action stored with ruleRefs, target fields, statement CID and reasonsIssuedAt; case stays assigned |
| TEST-PS-096-09.T02 | unit | PS-096-02.R02, PS-096-02.R03, PS-096-02.R04 | each rule V02–V13 violated, and a citation of POL-FRAUD-001@2 before its effective date | documented error code, nothing stored, no effect on index; MODERATION_RULE_REQUIRED for the scheduled version |
| TEST-PS-096-09.T03 | property | PS-096-03.R01 | random sequences of open, assign, close, apply, revert, expiry and appeal outcomes | only declared transitions succeed; terminal states never change |
| TEST-PS-096-09.T04 | integration | PS-096-03.R02 | mailbox acknowledges the statement after 2 h; mailbox down for 24 h; imminent-harm rule | active at acknowledgement; active at 24 h with the statement retrievable; imminent-harm effect first and notice follows |
| TEST-PS-096-09.T05 | integration | PS-096-03.R03, PS-096-04.R03 | operator revert and expiry of actions that published advisories | effect removed, reversal and advisory retraction signed, original statement unchanged, events in the same transaction as the state change |
| TEST-PS-096-09.T06 | contract | PS-096-04.R01, PS-096-04.R05, PS-096-09.R02 | each command, statement and event | validate against registry schemas; action.applied and reverted carry target, restricted capabilities, ruleRefs, expiresAt, reasonsStatementCid and reasonsIssuedAt; statements verify with the relay key |
| TEST-PS-096-09.T07 | integration | PS-096-04.R02, PS-096-06.R03 | moderation.report.received delivered twice; a second report on the same target; spam.detected score 79 and 80; risk.elevated high | one case with source report, both receipts attached and link_case called once per receipt; 79 adds signals only, 80 opens or extends a case for subjectKey; risk case has source risk_review and targetType account |
| TEST-PS-096-09.T08 | abuse | PS-096-05.R01, PS-096-05.R03 | moderator suspends permanently; moderator decides a case about self; non-moderator applies | MODERATION_ACTION_LIMIT, FORBIDDEN, FORBIDDEN |
| TEST-PS-096-09.T09 | abuse | PS-096-05.R02, PS-096-07.R03, PS-096-09.R03 | statement signed by wrong key; unsigned statement; schema with shadow kind | vault ignores first two; shadow kind rejected by validation |
| TEST-PS-096-09.T10 | integration | PS-096-06.R01, PS-096-06.R02, PS-096-09.R03 | same Idempotency-Key replayed; two moderators apply concurrently | original response replayed; one succeeds, other CONFLICT_REVISION |
| TEST-PS-096-09.T11 | chaos | PS-096-06.R02, PS-096-06.R03 | index check fails mid-apply | no action row, no event, DEPENDENCY_UNAVAILABLE |
| TEST-PS-096-09.T12 | integration | PS-096-01.R03, PS-096-07.R01, PS-096-07.R02 | subject's signed deletion request applied on the relay after an action; legal hold present; outbound traffic captured | pseudonymized case kept; hold prevents purge; only reasons, reversal, advisory and retraction statements ever left the relay |
| TEST-PS-096-09.T13 | abuse | PS-096-07.R03 | moderator applies 51 actions in 24 h | 51st returns RATE_LIMITED; operator report lists all |
| TEST-PS-096-09.T14 | load | PS-096-08.R01, PS-096-08.R02, PS-096-08.R03 | 50 req/s mixed apply and list for 5 minutes; 10 000 expiring actions | p95 ≤ 300 ms, sweep ≤ 5 s, no keys in logs |
| TEST-PS-096-09.T15 | unit | PS-096-09.R01 | traceability tool run | every PS-096 requirement maps to a passing test |
| TEST-PS-096-09.T16 | integration | PS-096-10.R01, PS-096-10.R02, PS-096-10.R03 | export subject statements, relay backup and restore | statements verify; restored active actions still enforce |
| TEST-PS-096-09.T17 | integration | PS-096-01.R04, PS-096-04.R02 | operator opens an account case with moderation.case.open; moderator applies remove_from_index then warn on that case; then closes it actioned | case.opened emitted; two actions on one case; case resolved actioned only by the close |
| TEST-PS-096-09.T18 | integration | PS-096-03.R04 | appeal decided reduced from suspend_relay_access 90 days to restrict_feature 7 days; then the same with a failure injected after the revert | contested action reverted appeal_reduced and replacement active with a new statement in one transaction, events reverted then applied; with the failure neither change is stored |
| TEST-PS-096-09.T19 | integration | PS-096-03.R05, PS-096-01.R03 | action with advisory expires; another is overturned on appeal; subscriber vault syncs the feed | advisories carry expiresAt; retraction published with seq and advisory cid; subscriber drops both labels |
| TEST-PS-096-09.T20 | abuse | PS-096-07.R04 | apply remove_from_index with publishAdvisory on listing L that relay Y mirrors; capture every outbound statement | no classrup.federation.tombstone/v1 produced; relay Y keeps its copy; only reasons and advisory statements sent |
| TEST-PS-096-09.T21 | integration | PS-096-04.R04 | subject vault receives reasons/v1, later reversal/v1, and one statement with a forged signature | local moderation.action.applied and reverted derived with actor.kind federated, same target fields, no deciderKey; forged statement quarantined |
| TEST-PS-096-09.T22 | abuse | PS-096-05.R04 | M2 applies on a case whose subject lists M2's second key; M2 applies on a case with M2's report linked; assignment of M2 to either case | FORBIDDEN in each case through key-set linkage and the report ledger |
| TEST-PS-096-09.T23 | abuse | PS-096-05.R05, PS-096-02.R04 | suspended key files an appeal, reads its appeal status, its own action and its evidence; apply with restrictedCapabilities containing moderation.appeal.receive or moderation.appeal.read_status_own | appeal accepted and reads allowed; MODERATION_CAPABILITY_PROTECTED for both |
| TEST-PS-096-09.T24 | integration | PS-096-07.R05 | ExportSectionPort run and privacy.deletion.completed in the subject vault with keepEvidence true and false | section moderation.actions exported; statements deleted or pseudonymized |
| TEST-PS-096-09.T25 | contract | PS-096-04.R05 | action.applied restrict_feature and action.reverted consumed by F12.S03.M04, F12.S03.M02 and F12.S01.M03 contract fixtures | each consumer resolves subject key, capabilities, expiry and reasonsIssuedAt from the payload without extra lookups |
| TEST-PS-096-09.T26 | integration | PS-096-07.R02, PS-096-07.R01 | injected clock: case closed 181 days ago without appeal or hold; case and actions past RET-EVIDENCE with and without a legal hold | internal notes deleted at 180 days; RetentionPurgePort purges the unheld case and actions and keeps the held ones; nothing was ever sent off the relay except the documented statements |
| TEST-PS-096-09.T27 | integration | PS-096-01.R06, PS-096-04.R08, PS-096-02.R05, PS-096-05.R06 | F04.S02.M03 contract fixture confirms a void (seller_fraud) for auction A with no open case and for auction B with a report case open; a record whose proposer equals the decider; an HTTP request to record_host_policy | A: case opened with source auction_review and assigned to the confirming moderator, remove_from_index with targetRef { auction, A }, subject the seller, reasons statement queued, actionId returned, case resolved actioned; B: action attached to the open case; VALIDATION_FAILED; no route |
| TEST-PS-096-09.T28 | chaos | PS-096-06.R04, PS-096-02.R05 | record_host_policy retried with the same hostRef after a crash before commit and after a successful commit; the auction document already left the index at close | one action only, the retry returns the stored actionId with created false; the record is accepted without NOT_FOUND and the index effect is a no-op |
| TEST-PS-096-09.T29 | contract | PS-096-01.R05, PS-096-04.R06 | apply remove_from_index on listing L with targetCid, apply on an account case, then revert both; inspect events and statements with the F06.S01.M01 and F01.S01.M03 contract fixtures | applied and reverted carry targetRef { listing, L, cid } or { account, subjectKey } and caseSource; reasons/v1 and reversal/v1 carry relayId, actionId and targetRef with the listingId and projection statementCid; the index fixture removes only L's document; the publication fixture binds each notice to one delivery |
| TEST-PS-096-09.T30 | contract | PS-096-04.R07 | action.applied and action.reverted delivered to the F07.S02.M02 and F06.S01.M01 relay runtime fixtures and derived in a subject vault | relay copies stop and resume serving only the targetRef item; no vault record changes on either origin |
| TEST-PS-096-09.T31 | integration | PS-096-01.R06, PS-096-04.R08 | the host-policy action is appealed through F12.S01.M03 and overturned | moderation.appeal.decided carries the actionId the hosting module stored; the action is reverted with appeal_overturned and a reversal statement; the reviewer's principal differs from proposer and decider |

## Acceptance criteria

- All tests T01–T31 pass in CI.
- No action exists without in-force rule IDs, facts summary and a retrievable signed statement of reasons.
- No moderation path produces any effect outside the issuing relay, and no federation tombstone is ever produced; statements say so.

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M01, F12.S01.M02, F12.S03.M03, F06.S01.M01, F08.S01.M01, F07.S02.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
