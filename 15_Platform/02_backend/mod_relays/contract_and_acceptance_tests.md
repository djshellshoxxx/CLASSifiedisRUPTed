# PS-118-09 — Contract and acceptance tests: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-118-09.R02** Configuration, identity, shutdown and dispatcher behavior are tested against a real node:http server and a real node:sqlite database in CI.
- **PS-118-09.R03** A canary suite runs the node:sqlite adapter on the pinned Node version and on the latest 22.x to detect behavior changes in the stability 1.1 API early.

## Specification

See the module test table below (all processes).

**Fixtures:** Temp data dir per test; Node 22.18.0 pinned in .nvmrc and Docker image plus latest 22.x canary; stub consumers (ok, flaky, always-failing); fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T01 | unit | PS-118-01.R01, PS-118-01.R02, PS-118-01.R03 | first start, restart, rotate twice | one active key, stable relayId, retired keys published, seed only in key file |
| TEST-PS-118-09.T02 | unit | PS-118-02.R01, PS-118-02.R02 | each config rule V01-V05 violated in turn plus an unknown RELAY_* variable | exit code 78, names listed, values absent from output; unknown variable only warned |
| TEST-PS-118-09.T03 | integration | PS-118-02.R03, PS-118-02.R02 | send 2 MiB body, slow headers, request during drain | PAYLOAD_TOO_LARGE, connection closed after 10 s headers timeout, PLATFORM_RELAY_DRAINING with Retry-After 5 |
| TEST-PS-118-09.T04 | integration | PS-118-03.R01, PS-118-03.R02 | SIGTERM with 5 requests in flight (3 s) and a running dispatcher batch | readyz 503 immediately, requests finish, dispatcher stops after batch, WAL checkpointed, exit 0 within 10 s |
| TEST-PS-118-09.T05 | integration | PS-118-03.R02, PS-118-03.R01 | SIGTERM with a request lasting 20 s, then a second SIGTERM | request cut at 10 s with exit 1, second signal exits 130 |
| TEST-PS-118-09.T06 | property | PS-118-03.R03, PS-118-01.R03 | random sequences of rotate requests and clock changes | active to retired only, never back, rotation rate limit respected |
| TEST-PS-118-09.T07 | contract | PS-118-04.R01, PS-118-04.R02 | well-known document, identity query, status query, rotate | payloads validate against registry schemas, rotated event emitted once |
| TEST-PS-118-09.T08 | integration | PS-118-04.R03, PS-118-06.R01, PS-118-06.R03 | flaky consumer fails 3 times then succeeds; always-failing consumer; kill -9 mid-batch | ordered at-least-once delivery, dead letter after 8 attempts, no lost events after restart, inbox suppresses duplicates |
| TEST-PS-118-09.T09 | abuse | PS-118-05.R01, PS-118-05.R02, PS-118-05.R03 | non-operator rotates and reads status; relay signature presented as vault authorization | FORBIDDEN; relay signature ignored by vault verification test |
| TEST-PS-118-09.T10 | integration | PS-118-06.R02, PS-118-06.R03 | start two processes on one database | second exits with PLATFORM_RELAY_DUPLICATE_INSTANCE; first unaffected |
| TEST-PS-118-09.T11 | abuse | PS-118-07.R01, PS-118-07.R03 | scan database and logs after a full workload with canary plaintext in encrypted envelopes | no plaintext canary present, IPs truncated, no tokens in logs |
| TEST-PS-118-09.T12 | abuse | PS-118-07.R02, PS-118-07.R03 | delete key file while identity row exists, then start | refuses with PLATFORM_RELAY_IDENTITY_MISSING; --accept-new-identity creates a new key id and keeps relayId only if operator supplies the seed |
| TEST-PS-118-09.T13 | load | PS-118-08.R02, PS-118-08.R03 | 50 req/s mixed for 5 minutes on 2 vCPU container, then cold start timing | read p95 ≤ 150 ms, write p95 ≤ 300 ms, ready ≤ 3 s empty, dispatcher lag p95 ≤ 1 s |
| TEST-PS-118-09.T14 | integration | PS-118-08.R01 | metrics scrape and logs | metrics named per CTR-OBS-001 present, no user ids as labels, log lines match schema |
| TEST-PS-118-09.T15 | chaos | PS-118-06.R02, PS-118-09.R03 | node:sqlite canary on pinned and latest 22.x with SQLITE_BUSY injection | adapter behavior identical, DEPENDENCY_UNAVAILABLE returned, readyz fails after 10 s |
| TEST-PS-118-09.T16 | unit | PS-118-09.R01 | traceability tool run | every PS-118 requirement maps to a passing test |
| TEST-PS-118-09.T17 | integration | PS-118-10.R01, PS-118-10.R02, PS-118-10.R03 | export relay-hosted data section, restore from backup to a new directory, roll back one release | identity and archive intact, receipts still verify, N-1 binary starts |
| TEST-PS-118-09.T18 | integration | PS-118-09.R02, PS-118-01.R01 | run on Node 22.17 and 22.18 | 22.17 exits 78 with PLATFORM_RELAY_RUNTIME_UNSUPPORTED; 22.18 starts without flags |

## Acceptance criteria

- All tests T01-T18 pass in CI.
- The relay starts from environment variables alone, serves its identity, and shuts down within 10 s without losing in-flight committed work.
- No plaintext private user data and no private key material is ever stored in the database or logs.
- Stopping or losing the relay loses no vault data; vault tests still pass with the relay stopped.

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
