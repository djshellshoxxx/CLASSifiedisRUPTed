# PS-064-06 — Failure recovery and idempotency: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-06.R01** All commands commit locally first; statements travel through F11.S02.M01 on the F15.S01.M01 outbox with states prepared, transport acknowledged and peer accepted, and the UI shows only the reached state.
- **PS-064-06.R02** Statement handling is idempotent on statement cid and agreements are idempotent on (partyDid, proposalHash).
- **PS-064-06.R03** Conflicting proposals are frozen for explicit renegotiation; no distributed lock and no last-writer-wins is used.

## Specification

- **idempotency:** Vault commands are idempotent on (meetupId, proposalRevision); inbound statements deduplicated by cid; agreement on (partyDid, proposalHash).
- **concurrency:** expectedRevision on every mutating command; each command is one IndexedDB transaction; simultaneous reschedules from two parties produce two valid proposals with one revision number from two proposers, and because a conflict is defined by revision and hash regardless of proposer, the meetup becomes conflicted in every vault that holds both.
- **retries:** Statements use the F15.S01.M01 outbox timers (CTR-IDM-001 IDM-4 backoff base 500 ms, cap 30 s, 6 attempts; unsent entries expire 7 days after creation after a day-6 prompt, transport_acknowledged entries 30 days after the relay receipt); an expired entry shows delivery failed with resend and the meetup stays valid locally.
- **offline:** All commands work offline; the meetup shows saved on this device and agreed only after peer signatures verified; the expiry sweep runs on app start.
- **partial failure:** If an agreement signature arrives for a stale hash it is stored but ignored for the current revision; if only some parties have agreed the meetup stays proposed with a per-party list; a proposal arriving without the proposer's consent waits up to 7 days for it and is otherwise ignored.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T08 | integration | PS-064-06.R01, PS-064-06.R02, PS-064-06.R03, PS-064-03.R05, PS-064-09.R03 | A and B reschedule concurrently while offline, then sync | two proposals with one revision from two proposers; meetup conflicted in both vaults, neither overwrites; agreeing a stale hash stored but ignored |
| TEST-PS-064-09.T10 | integration | PS-064-07.R02, PS-064-06.R01 | sync states A to B with relay down then up | states prepared then transport acknowledged then peer accepted; UI text never ahead of state |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, F06.S02.M01, F07.S02.M02, F16.S02.M02, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
