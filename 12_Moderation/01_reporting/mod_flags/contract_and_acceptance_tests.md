# PS-094-09 — Contract and acceptance tests: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-094-09.R02** Contract tests check command input, output, statements and event payloads against the schema registry.
- **PS-094-09.R03** Reporter non-disclosure and statement verification are verified by dedicated abuse tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault of reporter R holding signed listing L (cid sha256-aa…, revision 3) from author S and an end-to-end message M from S, relay X with moderator M1 and relay Y, fixed clock 2026-11-04T10:00:00Z with an injectable clock for retention tests.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T01 | unit | PS-094-01.R01, PS-094-01.R03 | file a valid scam report in the vault, then try to edit details | Report stored with syncState local_committed, subjectKey from the envelope, snapshot reference and hash set; details edit refused with CONFLICT_STATE |
| TEST-PS-094-09.T02 | unit | PS-094-02.R01, PS-094-02.R02, PS-094-02.R03 | a report with an unknown field in the vault and at the relay; each rule V02–V11 violated in turn on vault and relay | unknown field returns VALIDATION_FAILED in both stores; the documented error code is returned and nothing is stored; unknown relay returns MODERATION_RELAY_UNKNOWN and a 513 KiB statement PAYLOAD_TOO_LARGE |
| TEST-PS-094-09.T03 | property | PS-094-03.R01, PS-094-03.R02 | random sequences of transport results, receipts, link, outcome and withdrawal statements on one report | only declared transitions succeed; transport_acknowledged only after a relay 2xx or mailbox acknowledgement; peer_accepted only after a verified receipt bound to reportId and digest; no state is skipped |
| TEST-PS-094-09.T04 | integration | PS-094-03.R03 | withdraw while linked | withdrawal statement queued, local record kept, relay case continues |
| TEST-PS-094-09.T05 | contract | PS-094-04.R01, PS-094-04.R02, PS-094-09.R02 | each command, statement and query executes; file a report with the network disabled | outputs, signed statements and the filed, received and dismissed events validate against registry schemas; each command declares vault, statement or relay mode; filed is written in the report transaction and nothing leaves the vault before the sync outbox runs |
| TEST-PS-094-09.T06 | integration | PS-094-04.R03, PS-094-03.R04 | case.opened then case.closed delivered twice on the relay | reports linked and resolved once; one reportlinked and one reportoutcome statement per reporter; the vault applies each once |
| TEST-PS-094-09.T07 | abuse | PS-094-05.R01, PS-094-05.R03, PS-094-05.R04, PS-094-09.R03 | outcome signed by a different key; non-moderator queries relay reports; subject reads its case, action and statement of reasons | outcome quarantined; NOT_FOUND; no reporter key in any response, event, case record or statement |
| TEST-PS-094-09.T08 | abuse | PS-094-05.R02 | unsigned and malformed relay report requests; blocked key | rejected with FORBIDDEN; no case created |
| TEST-PS-094-09.T09 | integration | PS-094-06.R01, PS-094-06.R03 | same local Idempotency-Key replayed on file; withdraw with a stale expectedRevision; duplicate relay delivery with the same reportId; receipt lost and retried on day 3; same reportId with a changed digest | stored response replayed; CONFLICT_REVISION; one case; the original signed receipt returned on day 3; IDEMPOTENCY_KEY_REUSED for the changed digest |
| TEST-PS-094-09.T10 | integration | PS-094-03.R02, PS-094-06.R03 | relay offline for 8 days then back | UI shows not delivered after 7 days; manual resend reaches transport_acknowledged then peer_accepted |
| TEST-PS-094-09.T11 | abuse | PS-094-07.R03 | 21 reports by one key in 24 h; key with a report_dismissed_bad_faith signal files a 4th in 24 h; same key files minor_safety | 21st and 4th return RATE_LIMITED; minor_safety accepted |
| TEST-PS-094-09.T12 | unit | PS-094-01.R04, PS-094-01.R05 | subscribe to an advisory feed, publisher retracts one advisory, another reaches expiresAt, then publisher key revoked | labels applied, retracted and expired labels removed, all labels dropped after verified revocation; no local record deleted |
| TEST-PS-094-09.T13 | load | PS-094-08.R01, PS-094-08.R03 | 50 report receives per second for 5 minutes on relay | p95 ≤ 300 ms, intake lag p95 ≤ 5 s, no reporter key in logs |
| TEST-PS-094-09.T14 | unit | PS-094-08.R02, PS-094-09.R01 | vault file with 256 KiB snapshot on Moto G profile; traceability tool run | p95 ≤ 150 ms; every PS-094 requirement maps to a passing test |
| TEST-PS-094-09.T15 | integration | PS-094-10.R01, PS-094-10.R02, PS-094-10.R03 | export, restore into fresh vault, import an open report and a receipt with a broken signature; read a v1 record carrying an unknown reason code with the previous reader | own reports round-trip; imported open reports become withdrawn and nothing is re-sent; the broken receipt is rejected; the unknown reason displays as other |
| TEST-PS-094-09.T16 | e2e | PS-094-03.R02, PS-094-08.R02 | mobile reporter files a report offline then reconnects | single report, delivery status progresses Saved, Sent, Relay acknowledged honestly, axe zero serious issues |
| TEST-PS-094-09.T17 | abuse | PS-094-02.R04 | relay X forwards a received report statement to relay Y; X receives a replay inside a new outer request | Y refuses with FORBIDDEN; X returns the stored receipt; no second case anywhere |
| TEST-PS-094-09.T18 | integration | PS-094-04.R04, PS-094-01.R02 | relay receives a valid report | relay copy stores the readable header and the sealed body; moderation.report.received is emitted in the receipt transaction with receiptId, subjectKey and snapshotId and without reporterKey or details; no moderation.report.filed exists on the relay; F12.S02.M01 opens one case |
| TEST-PS-094-09.T19 | integration | PS-094-03.R04 | report filed, case opened, moderation.action.apply with closeCase true | vault receives reportlinked then reportoutcome actioned and shows Resolved; status_for_reporter returns the same statements |
| TEST-PS-094-09.T20 | abuse | PS-094-07.R01 | privacy suite after filing reports: scan federation payloads, public projections, relay logs, events and subject-facing statements | no reporterKey, details or snapshot body appears in any of them |
| TEST-PS-094-09.T21 | abuse | PS-094-07.R04 | report an end-to-end message without disclosure, then with an approved redacted disclosure | relay receives only targetCid, sender key, sender signature and reason, then only the approved redacted bytes; the sheet shows the inference warning |
| TEST-PS-094-09.T22 | integration | PS-094-07.R02, PS-094-07.R05 | injected clock past RET-EVIDENCE for a resolved report; privacy.deletion.completed with keepEvidence true and false; relay DeletionPort applied | report purged through RetentionPurgePort; reporterKey pseudonymized or reports deleted; relay copy pseudonymized; export section listed before deletion |
| TEST-PS-094-09.T23 | unit | PS-094-02.R02 | reporterClaim on an unsigned message; reporterClaim on a listing | message filed with disclosure reporter_claim and labelled; listing refused with MODERATION_TARGET_UNAVAILABLE |
| TEST-PS-094-09.T24 | chaos | PS-094-06.R02, PS-094-04.R02 | evidence blob write fails during file | no Report row, no outbox entry, no moderation.report.filed, MODERATION_EVIDENCE_FAILED returned |
| TEST-PS-094-09.T25 | integration | PS-094-04.R05 | case with three received reports (one minor_safety) closed no_action; same case.closed delivered twice | three moderation.report.dismissed events, the minor_safety one with exempt true, each carrying reporterKey only in the in-process payload; no duplicates on redelivery; no reporterKey in logs |
| TEST-PS-094-09.T26 | integration | PS-094-04.R06, PS-094-03.R04 | a second reporter's report arrives after case C is open and is merged by F12.S02.M01; moderation.case.opened redelivered | link_case called in the intake transaction; the second reporter's vault receives one reportlinked for C and reaches linked; the fallback consumer sends nothing twice |

## Acceptance criteria

- All tests T01–T26 pass in CI.
- No response, event, notification or export visible to the reported party contains the reporter key (privacy suite).
- The UI never shows sent, acknowledged, linked or resolved before the matching verified state is reached.

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F12.S03.M03, F07.S02.M02, F08.S01.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
