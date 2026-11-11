# PS-018-06 — Failure recovery and idempotency: N-party cycle engine

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M03 N-party cycle engine](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/n` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-018-06.R01** Generate and import are idempotent; a replay with the same Idempotency-Key within 24 h returns the stored result without a second run.
- **PS-018-06.R02** The same inputHash with the same parameters and the same expansion budget must yield byte-identical suggestions; only the time budget can shorten the deterministic prefix.
- **PS-018-06.R03** A crash during a run leaves the previous suggestion set intact because new records are written in one IndexedDB transaction at the end of the run.

## Specification

- **idempotency:** Idempotency-Key per command, replay window 24 h (CTR-IDM-001 IDM-1); suggestions are additionally deduplicated by cycleKey while status is suggested.
- **concurrency:** One run at a time per vault through a Web Locks mutex named mutiny-matching; a second request returns MUTINY_RUN_IN_PROGRESS (retryable). On a relay, runs are serialized per tenant and partition.
- **retries:** Client retries only MUTINY_RUN_IN_PROGRESS and RATE_LIMITED with IDM-4 backoff; a truncated run is not retried automatically.
- **offline:** Generation works offline over retained projections and shows projectionAsOf; import of relay suggestions waits in the mailbox until the vault is online; nothing is queued as a statement because the engine sends none.
- **partial failure:** If the 250 ms time budget fires, the run returns the deterministic prefix with truncated=time and every returned suggestion is still individually valid; if graph caps are exceeded the run partitions by L1 cell and reports truncated=graph_cap for unprocessed cells.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-018-09.T04 | property | PS-018-09.R02, PS-018-06.R02 | same random graph and parameters run twice, and with shuffled input order | byte-identical output and equal inputHash |
| TEST-PS-018-09.T08 | integration | PS-018-03.R03, PS-018-06.R01 | two consecutive runs on same graph | second run keeps suggestion id and refreshes expiresAt; no duplicate cycleKey |
| TEST-PS-018-09.T09 | integration | PS-018-04.R02, PS-018-04.R03, PS-018-06.R01 | replay generate with same key, different body, and parallel generate | stored result replayed; IDEMPOTENCY_KEY_REUSED; second parallel gets MUTINY_RUN_IN_PROGRESS |
| TEST-PS-018-09.T15 | chaos | PS-018-06.R03, PS-018-03.R03 | kill the vault mid-run | previous suggestion set intact after restart, no partial records |

## Dependencies

Module depends on: F02.S02.M04, F02.S02.M05, F02.S04.M03, F01.S01.M01, F01.S02.M02, F01.S03.M01, F06.S02.M01, F07.S02.M02, F07.S02.M01, F07.S03.M01, F07.S03.M02, F09.S03.M02, F09.S03.M03, F11.S01.M01, F11.S01.M02, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-OBS-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
