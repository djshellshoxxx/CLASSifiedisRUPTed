# PS-140-09 — Contract and acceptance tests: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-140-09.R02** Planted bugs (resend with a new key, relay-authenticated response cached, a label stronger than the reached state, a third merge option, plaintext P2 queued for a relay) must fail the suite.
- **PS-140-09.R03** pnpm test:offline runs in the F17.S03.M01 fast gate on every pull request, and pnpm test:offline:browser runs after build-pwa whenever the changes job reports apps/pwa changes; both report into gate-summary.

## Specification

See the module test table below (all processes).

**Fixtures:** FakeNetwork scenario files, FakeClock 2026-11-04T10:00:00Z, seeded jitter source, in-memory IndexedDB shim, Pixel 7 profile for browser tests, relay test double that counts effects per cid and per Idempotency-Key, principals P1 and P2 sharing one browser profile, a receiving vault double that reports rejections and forks.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T01 | unit | PS-140-01.R01, PS-140-01.R02, PS-140-01.R03 | enqueue through production function with a scenario file | entry matches the OutboxEntry schema; scenario parses |
| TEST-PS-140-09.T02 | integration | PS-140-02.R01, PS-140-06.R02 | resend one statement and one relay command across 10 connection resets | effect count is exactly 1 in the receiving vault (per cid) and in the relay double (per Idempotency-Key) |
| TEST-PS-140-09.T03 | integration | PS-140-02.R02, PS-140-03.R01 | two devices edit the same entity offline then reconnect | second gets CONFLICT_REVISION and the conflict dialog shows exactly Prepare a new version on theirs and Discard mine; choosing the first enqueues a new entry with a new cid and expectedRevision = currentRevision; no option overwrites the peer's signed revision |
| TEST-PS-140-09.T04 | integration | PS-140-02.R03, PS-140-06.R03 | advance the fake clock to day 6 and then past 7 days with an unsent entry; separately return a non-retryable error | the day-6 prompt lists the entry with Send now, Keep until expiry and Discard; at 7 days it is expired with payload erased, never sent, and a send attempt gives EXPIRED; the non-retryable error is not retried |
| TEST-PS-140-09.T05 | integration | PS-140-03.R02, PS-140-03.R03 | walk prepared, sending, transport_acknowledged, peer_accepted, conflict, failed, expired and discarded with both harnesses | every state reached with its F15.S01.M01 label; quarantine appears only on the receiving vault; the outbox ends empty or in an expected terminal state |
| TEST-PS-140-09.T06 | unit | PS-140-04.R01, PS-140-04.R02, PS-140-04.R03 | run the scripts and read exit codes | fake-network suite under 30 s; browser variant runs scenario list; exit codes as documented |
| TEST-PS-140-09.T07 | e2e | PS-140-05.R01, PS-140-05.R03 | revoke signing key while offline then reconnect | receiver refuses or quarantines the statement; the sender's entry shows Needs attention with the reported reason; no elevated role used |
| TEST-PS-140-09.T08 | e2e | PS-140-05.R02, PS-140-07.R02 | P1 locks the vault with 3 queued entries and a relay access token; P2 unlocks its own vault; P1 unlocks again; finally P1 runs Erase vault | on lock in-memory keys are dropped, IndexedDB records stay encrypted and unreadable, the 3 entries are kept and not sent, relay access tokens are dropped and CLEAR_USER_CACHES reason lock unbinds the image partition; P2 sees only its separate vault; after unlock all records and the 3 entries are intact and sending resumes; IndexedDB data is deleted only by Erase vault after the export prompt |
| TEST-PS-140-09.T09 | unit | PS-140-06.R01 | fake clock and seeded jitter over failing attempts, one retryable response carrying retryAfterMs 45 s, then Retry now | each delay for attempt n = 1..6 lies in [0, min(30000, 500 x 2^(n-1))] ms, or equals retryAfterMs when larger; no 7th attempt happens; the entry is failed with retry_exhausted; Retry now resets attempts to 0 and sends |
| TEST-PS-140-09.T10 | e2e | PS-140-09.R02 | plant a relay-authenticated response in cache | QUALITY_OFFLINE_AUTH_CACHED and suite fails |
| TEST-PS-140-09.T11 | abuse | PS-140-09.R02 | fill storage to 95 percent and enqueue; plant resend with a new key | visible quota error; the new-key bug fails with QUALITY_OFFLINE_DUPLICATE_EFFECT |
| TEST-PS-140-09.T12 | e2e | PS-140-08.R01, PS-140-08.R02, PS-140-08.R03 | reconnect on Pixel 7 4G profile and load shell offline | first replay within 2 s, shell within 2.5 s, browser suite within 3 min |
| TEST-PS-140-09.T13 | integration | PS-140-09.R01, PS-140-09.R03 | traceability tool run and parse the fast-gate workflow | every requirement maps to a passing test; test:offline runs on every pull request; test:offline:browser runs after build-pwa when the changes job reports apps/pwa changes; both feed gate-summary |
| TEST-PS-140-09.T14 | integration | PS-140-10.R01, PS-140-10.R02, PS-140-10.R03 | export report and reuse scenario files in e2e | reports contain no user data; scenarios load in both harnesses |
| TEST-PS-140-09.T15 | e2e | PS-140-03.R01 | reload the page during replay | outbox resumes, no lost and no duplicate commands |
| TEST-PS-140-09.T16 | e2e | PS-140-01.R04 | no relay configured, network blocked - create and search records, sign a statement | works; status Saved on this device |
| TEST-PS-140-09.T17 | e2e | PS-140-02.R04 | drive a statement through each sync state, then plant labels Confirmed by peer at transport_acknowledged and Delivered without to relay | each label equals the F15.S01.M01 label for the reached state (transport_acknowledged reads Delivered to relay, peer has not confirmed); both planted labels fail with QUALITY_OFFLINE_OVERCLAIM |
| TEST-PS-140-09.T18 | abuse | PS-140-07.R01 | planted leak - enqueue a plaintext P2 offer and a P3 address field for a relay destination, and plant a bypass of the enqueue check | both enqueues refused by F15.S01.M01; stored relay-destination entries contain only ciphertext; the bypass fails with QUALITY_OFFLINE_PLAINTEXT_QUEUED |
| TEST-PS-140-09.T19 | abuse | PS-140-07.R03 | scan every browser trace and HAR from the offline browser run | no Authorization header value and no relay access token present |
| TEST-PS-140-09.T20 | integration | PS-140-02.R02 | fork_freeze - two conflicting signed promises for one coordination arrive in both orders | coordination frozen; the dialog offers no option that picks a winner; nothing auto-merged |
| TEST-PS-140-09.T21 | integration | PS-140-02.R05 | outbox_full - enqueue 200 entries then one more, and separately a payload that passes 5 MiB for the principal | both refused with PLATFORM_OUTBOX_FULL and a visible message; nothing silently dropped |

## Acceptance criteria

- An offer created offline is applied exactly once by the receiving vault after reconnect, even across repeated connection resets.
- A revision conflict shows exactly Prepare a new version on theirs and Discard mine, never overwrites the peer's signed revision, and a fork freezes the coordination.
- Relay-authenticated responses are never present in Cache Storage, vault lock keeps data encrypted and queued entries intact, and only Erase vault after an export prompt deletes vault data.
- Retry timing follows IDM-4 exactly and unsent entries expire at 7 days after the day-6 prompt.
- The app shell loads offline after first visit within the OBS-5 budget.

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02, F15.S02.M03, F07.S01.M02, F10.S01.M04, F11.S01.M02, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
