# PS-108-09 — Contract and acceptance tests: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-108-09.R02** Contract tests check commands and event payloads against the schema registry.
- **PS-108-09.R03** DST and urgent bypass behaviors are covered with golden fixtures that reuse the F13.S02.M02 schedule fixtures.
- **PS-108-09.R04** The screens listed under ux meet the listed a11y items, verified by an axe scan with zero serious issues and a keyboard and screen-reader walk-through.

## Specification

See the module test table below (all processes).

**Fixtures:** User U in America/New_York with quiet window 22:00 to 07:00 daily, devices A and B, push and email consent granted and registered, privacy.consent.check double, matrix defaults, relay R with fake push and email senders and an F16.S02.M02 registry double, users U and W in one cycle on relay R, fixed clocks per test, golden transitions 2026-03-08 and 2026-11-01.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T01 | unit | PS-108-01.R01, PS-108-01.R02, PS-108-01.R03, PS-108-02.R01 | vault decision for a normal offers alert at 03:00 local arriving direct | vault record with templateKey, ref and timing; relay record holds only sealed boxes, tag and timing; release at 07:00 plus jitter |
| TEST-PS-108-09.T02 | unit | PS-108-02.R03, PS-108-02.R01 | each rule V01 and V03 to V10 violated in turn, and V02 with urgency critical | documented error code returned and nothing sent |
| TEST-PS-108-09.T03 | property | PS-108-03.R01, PS-108-03.R02, PS-108-03.R03 | random sequences of dispatch, schedule changes, consent changes, reads, read failures and clock jumps | terminal states never change; no send without consent; nothing deferred beyond 24 h; urgent never deferred; re-deferral bounded by expiresAt |
| TEST-PS-108-09.T04 | integration | PS-108-03.R02 | night of 2026-03-08 and 2026-11-01 New York | release at 07:00 local on both, i.e. 11:00 UTC and 12:00 UTC, plus jitter ≤ 300 s |
| TEST-PS-108-09.T05 | contract | PS-108-04.R01, PS-108-04.R02, PS-108-09.R02 | dispatch in all three modes, release, cancel and list_deferred execute | outputs and event payloads validate against registry schemas; events carry no template key, reference or collapse key |
| TEST-PS-108-09.T06 | integration | PS-108-04.R03, PS-108-03.R03 | vault-local quiet_hours.changed, channel.opted_out, preference.changed and notification.read; relay-local quiet_hours.changed, opted_out and preference.changed from the mirror and registration commands | items recomputed, released with reason schedule_changed, dropped or cancelled with documented reasons in each environment |
| TEST-PS-108-09.T07 | integration | PS-108-01.R03, PS-108-02.R02, PS-108-06.R03 | urgent security alert at 03:00 with push consent; urgent offers alert; urgent security with no consent; relay with no preference mirror for a hook | first sent immediately; second downgraded to normal, counted and deferred; third not pushed; hook decided by the default matrix |
| TEST-PS-108-09.T08 | abuse | PS-108-05.R01, PS-108-05.R02, PS-108-05.R03 | dispatch and cancel signed by a valid device key of user W for user U; replay of a hook call; operator reads relay deferred records | both W requests return exactly FORBIDDEN and nothing about U is revealed; one send for the replay; records hold no readable content |
| TEST-PS-108-09.T09 | integration | PS-108-06.R01, PS-108-06.R02 | same sealed dispatch retried 5 times with one dispatchId; crash after send before status update | one send, or one repeated send collapsed by Topic and Message-ID |
| TEST-PS-108-09.T10 | chaos | PS-108-06.R03 | preference store unavailable during a vault decision | re-deferred 5 minutes, dropped after 3 attempts; inbox entry unaffected |
| TEST-PS-108-09.T11 | abuse | PS-108-07.R01, PS-108-07.R02, PS-108-07.R03 | 121st dispatch in an hour; inspect deferred records and logs | RATE_LIMITED; no content or schedule in records |
| TEST-PS-108-09.T12 | load | PS-108-08.R01, PS-108-08.R02, PS-108-08.R03 | 2 000 users with deferred items released at one window end; 10 000 due items; 100 dispatch per second | decision p95 ≤ 20 ms; 10 000 items drain in ≤ 60 s; lag ≤ 300 s + 30 s + backlog ÷ 200 s; jitter uniform; lag alert fires only when the bound is exceeded by 60 s |
| TEST-PS-108-09.T13 | unit | PS-108-09.R01, PS-108-09.R03 | traceability tool run | every PS-108 requirement maps to a passing test |
| TEST-PS-108-09.T14 | integration | PS-108-10.R01, PS-108-10.R02, PS-108-10.R03 | export deferred counts, restore relay from backup | deferred records past expiry are dropped on restore and none are sent twice |
| TEST-PS-108-09.T15 | abuse | PS-108-07.R04, PS-108-04.R04 | U and W in one cycle both receive cycle alerts dispatched from their vaults through relay R; capture R's database, logs, events and push headers | no cycleId, threadId, template key or collapse key appears; U's and W's tags, Topics and boxes share no identifier; R cannot open the boxes |
| TEST-PS-108-09.T16 | integration | PS-108-02.R04, PS-108-02.R05 | muted thread message; collapse update for a deferred item; offer arriving by mailbox while the app is closed; locally raised security event; os_alert with in-app off for offers | muted dropped on all channels; collapse raises the count without a second dispatch; no vault push for the mailbox offer while the hook wake is sent once; vault push sealed for device B; no os_alert for offers |
| TEST-PS-108-09.T17 | integration | PS-108-04.R05, PS-108-03.R01 | push handed off with notBefore 07:00; user reads the row at 06:30 | notify.notification.cancel acknowledged; vault item cancelled; relay sends nothing |
| TEST-PS-108-09.T18 | integration | PS-108-03.R04, PS-108-01.R04 | 7 items for one user due in one sweep at the relay and in the vault | one digest alert notify.tpl.system.digest with count 7 and no reference; the 7 items dropped with superseded_by_digest; digest sent only because at least one replaced item's cell is still on |
| TEST-PS-108-09.T19 | integration | PS-108-04.R06 | deletion requested, then cancelled on day 13; DeletionPort plan and purge, export section and retention purge with F10 doubles | during grace non-security decisions held and no relay request sent; after cancel dispatch resumes with no undo; purge removes vault rows; section notify.deferred has counts only |
| TEST-PS-108-09.T20 | a11y | PS-108-09.R04 | inbox held indicator, held list and digest alert with screen reader and keyboard | held text alternative read, table headers announced, zero serious axe issues |

## Acceptance criteria

- All tests T01 to T20 pass in CI.
- No send occurs on any path without a granted unexpired channel consent, and no muted item alerts on any channel.
- Urgent bypass works only for category security and is visible in metrics.
- Released times match the golden DST fixtures to within the 300 s jitter, and relay captures never contain references, template keys or collapse keys of vault-originated alerts.

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, F16.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F16.S02.M02, F07.S02.M01, F15.S01.M01, F12.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
