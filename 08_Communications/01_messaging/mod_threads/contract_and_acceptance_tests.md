# PS-061-09 — Contract and acceptance tests: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-061-09.R02** Contract tests check command input and output and event payloads against the schema registry.
- **PS-061-09.R03** Roster consistency is covered by deterministic event replay tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Tenant with members A, B, C, listing L owned by A, cycle context X with parties A, B, C, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T01 | unit | PS-061-01.R01, PS-061-01.R02, PS-061-01.R03, PS-061-02.R01 | create a listing thread between B and A | Thread stored with contextType listing, participants 2, origin local, thread-open statement signed |
| TEST-PS-061-09.T02 | unit | PS-061-02.R02, PS-061-02.R03 | each rule V02 to V07 violated in turn | the documented error code returned and nothing stored |
| TEST-PS-061-09.T03 | property | PS-061-03.R01, PS-061-03.R02 | random sequences of create, archive, mute, join and leave events | archived never leaves archived; roster never exceeds 12; unique active pair holds |
| TEST-PS-061-09.T04 | integration | PS-061-03.R03, PS-061-06.R03 | archive thread | one comms.thread.archived event and purge schedule exist in the same transaction |
| TEST-PS-061-09.T05 | contract | PS-061-04.R01, PS-061-04.R02, PS-061-09.R02, PS-061-09.R03 | each command and query executes | outputs and event payloads validate against registry schemas |
| TEST-PS-061-09.T06 | integration | PS-061-04.R03, PS-061-06.R02 | replay mutiny.party.joined, party.left and block events in shuffled and duplicated order | final roster identical to ordered replay |
| TEST-PS-061-09.T07 | abuse | PS-061-05.R01, PS-061-05.R02, PS-061-05.R03 | stranger thread-open statement; blocked user create; participant archives a cycle thread; relay operator tries to read threads | quarantine, BLOCKED_PARTY or FORBIDDEN as documented; relay has no thread data |
| TEST-PS-061-09.T08 | integration | PS-061-06.R01, PS-061-01.R04 | create twice and concurrent creates from both vaults A and B for one pair | one thread after exchange, lowest threadId kept, other archived superseded, existing true on repeat |
| TEST-PS-061-09.T09 | e2e | PS-061-06.R01, PS-061-03.R01 | block added while direct thread active | thread archived for both, blocked party shown archived without reason |
| TEST-PS-061-09.T10 | abuse | PS-061-07.R01, PS-061-07.R03 | blocked party sends thread-open statements | blocker vault drops silently, sender sees no error or signal of a block |
| TEST-PS-061-09.T11 | integration | PS-061-07.R02 | archive then advance clock 30 days | thread and messages purged locally; peers keep their copy |
| TEST-PS-061-09.T12 | abuse | PS-061-07.R03, PS-061-02.R01 | 31st thread creation in a day; thread-open statement signed by a stranger for a listing they do not own | RATE_LIMITED; COMMS_THREAD_OPEN_REJECTED and message-request quarantine |
| TEST-PS-061-09.T13 | load | PS-061-08.R01, PS-061-08.R02, PS-061-08.R03 | 500 mixed vault commands per second for 1 minute plus 2 000-thread idle sweep | budgets met and lag gauge returns to 0 |
| TEST-PS-061-09.T14 | unit | PS-061-09.R01 | traceability tool run | every PS-061 requirement maps to a passing test |
| TEST-PS-061-09.T15 | integration | PS-061-10.R01, PS-061-10.R02, PS-061-10.R03 | export, import into fresh vault and restore from backup | threads round trip identical; import rejects unknown participants as read-only |
| TEST-PS-061-09.T16 | a11y | PS-061-04.R01 | inbox and mute menu with keyboard and screen reader | all controls operable, state changes announced, zero serious axe issues |

## Acceptance criteria

- All tests T01 to T16 pass in CI.
- A blocked party can never learn from any response that a block exists.
- Roster after arbitrary event replay equals the roster after ordered replay.

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
