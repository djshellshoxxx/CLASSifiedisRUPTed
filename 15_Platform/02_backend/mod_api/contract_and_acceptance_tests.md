# PS-117-09 — Contract and acceptance tests: API and command bus

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M02 API and command bus](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/bus` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-117-09.R01** Every requirement of PS-117 is covered by a test whose title starts with its TEST-PS-117-09 identifier.
- **PS-117-09.R02** The kernel core is isomorphic; no file outside the Node adapter entry imports a module with the node scheme, which a static test enforces.
- **PS-117-09.R03** Property tests (fast-check, at least 200 runs) cover UUIDv7 monotonicity and state machine transitions.

## Specification

See the module test table below (all processes).

**Fixtures:** createTestKernel(): fake clock at 2026-11-04T10:00:00.000Z, deterministic UUIDv7 (seed 1), memory storage, role-table or allow-all authz, collected events, audit and logs; sample module F99.S01.M01 in packages/kernel/src/testing/sample-module.ts.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-117-09.T01 | unit | PS-117-01.R02 | generate and parse UUIDv7 values | lowercase canonical v7 with variant 10; uppercase, braces, v4 and wrong variant are rejected with INVALID_UUIDV7 |
| TEST-PS-117-09.T02 | property | PS-117-01.R02, PS-117-09.R03 | random clock steps including bursts and regressions, 200 runs, plus 100 000 IDs in one millisecond | IDs unique and strictly increasing per millisecond generator |
| TEST-PS-117-09.T03 | unit | PS-117-01.R02, PS-117-02.R03 | IDs 24 h and 24 h + 1 ms ahead of the receiver clock | first accepted, second ID_TIMESTAMP_SKEW |
| TEST-PS-117-09.T04 | unit | PS-117-02.R01 | unknown, missing, mistyped and too long fields | VALIDATION_FAILED with UNKNOWN_FIELD, REQUIRED, INVALID_TYPE, TOO_BIG paths |
| TEST-PS-117-09.T05 | unit | PS-117-02.R02 | uuidv7, timestamp, code-point string and Money validators with good and bad values | documented field codes; emoji counted as one code point |
| TEST-PS-117-09.T06 | unit | PS-117-04.R03, PS-117-10.R02 | defineEvent with bad names and an envelope with an extra payload key | definitions rejected; envelope has exactly the CTR-EVT-001 keys; bad payload throws |
| TEST-PS-117-09.T07 | unit | PS-117-03.R01, PS-117-03.R02, PS-117-03.R03 | invalid machine definitions and declared or undeclared transitions | definition errors; next returns target or CONFLICT_STATE with state and event; edges exported |
| TEST-PS-117-09.T08 | property | PS-117-03.R02, PS-117-09.R03 | random event sequences on the offer machine, 200 runs | only declared transitions succeed; terminal states absorb nothing |
| TEST-PS-117-09.T09 | integration | PS-117-04.R01, PS-117-04.R02 | every stage failing at once (flag off, read-only sentinel on, no token, suspended tenant, limit exceeded, bad input, denied), then fixed one by one | FEATURE_DISABLED, SECURITY_READ_ONLY_MODE, UNAUTHENTICATED, PLATFORM_TENANT_SUSPENDED, RATE_LIMITED, VALIDATION_FAILED, FORBIDDEN in order with port codes unchanged; handler runs only at the end; duplicate registration throws |
| TEST-PS-117-09.T10 | integration | PS-117-01.R01, PS-117-06.R01 | same key and body twice, then changed body, then other actor | replay with original 201 and body; IDEMPOTENCY_KEY_REUSED; other actor executes |
| TEST-PS-117-09.T11 | integration | PS-117-06.R02 | handler returns err, then throws after writing records, an event and an OutboxEntry record through a stub F15.S01.M01 OutboxPort | no records, outbox rows, OutboxEntry records or idempotency record; INTERNAL with no message; error log with correlationId |
| TEST-PS-117-09.T12 | integration | PS-117-06.R03 | five concurrent dispatches with one key | handler runs once; one fresh result and four replays |
| TEST-PS-117-09.T13 | integration | PS-117-01.R03, PS-117-07.R02, PS-117-10.R01 | replay at 24 h - 1 ms and at 24 h, then purge | replay before expiry, execution after; purge removes one row |
| TEST-PS-117-09.T14 | abuse | PS-117-05.R01, PS-117-05.R02, PS-117-05.R04 | denied member, hidden resource, anonymous caller, remote call of a vault command, public relay command | FORBIDDEN, NOT_FOUND, UNAUTHENTICATED, NOT_FOUND, ok |
| TEST-PS-117-09.T15 | abuse | PS-117-05.R03 | deny then allow with a secret value in the input | two audit entries with decision, capability and resource; no input value in audit |
| TEST-PS-117-09.T16 | unit | PS-117-02.R03 | idempotent command without key, with v4 key and with a key 25 h ahead | REQUIRED, INVALID_UUIDV7, ID_TIMESTAMP_SKEW |
| TEST-PS-117-09.T17 | unit | PS-117-06.R04 | fixed-window limit exceeded; busy dependency; read-only port refusal rendered over HTTP | RATE_LIMITED with retryAfterMs 45 000 and Retry-After 45; only three common codes retryable; DEPENDENCY_UNAVAILABLE retryable; SECURITY_READ_ONLY_MODE retryable with Retry-After 300 |
| TEST-PS-117-09.T18 | unit | PS-117-07.R01, PS-117-10.R02 | render problem JSON and snapshot the common code table | exact RFC 9457 fields; no stack; table equals CTR-ERR-001 plus ID_TIMESTAMP_SKEW; defineErrors rules |
| TEST-PS-117-09.T19 | integration | PS-117-04.R04, PS-117-07.R03, PS-117-10.R03 | sample relay over node:http with replay, reuse, 300 KiB body, form body, GET, bad JSON, bad token, vault command, /api/v2 | 201, Idempotent-Replay, problem+json 422, 413, 415, 405, 422, 401, 404, 404; security headers; logs carry truncated IP only |
| TEST-PS-117-09.T20 | unit | PS-117-08.R01 | ok, replayed and rejected commands | counters per outcome and a duration histogram series rendered |
| TEST-PS-117-09.T21 | unit | PS-117-08.R03 | one command with a private title | one log line with ts, level, msg, correlationId, module, code, durationMs first; title absent from logs |
| TEST-PS-117-09.T22 | load | PS-117-08.R02 | 500 sequential idempotent commands on a SQLite WAL file | p95 ≤ 50 ms |
| TEST-PS-117-09.T23 | unit | PS-117-09.R01 | traceability scan of kernel test titles | every PS-117 test ID T01–T31 appears in a test title |
| TEST-PS-117-09.T24 | unit | PS-117-09.R02 | static scan of kernel sources | no node: import outside node.ts, the SQLite adapter and the HTTP adapter |
| TEST-PS-117-09.T25 | integration | PS-117-04.R03 | command emits an event, then a deliveryEligible and a non-eligible definition enqueue through a stub F15.S01.M01 OutboxPort | event in outbox and sink after commit only; eligible OutboxEntry record committed with the command; non-eligible INTERNAL |
| TEST-PS-117-09.T26 | integration | PS-117-04.R05, PS-117-05.R04 | challenge, forged signature, login, nonce replay, expired nonce, idle expiry, revoke, and the same through the relay commands | tokens issued and stored hashed; all bad proofs UNAUTHENTICATED; revoked token rejected |
| TEST-PS-117-09.T27 | integration | PS-117-04.R06 | ContainmentPort stub reports read-only; over node:http dispatch bazaar.listing.publish, platform.access_token.login, identity.session.revoke, security.containment.set and a query; then the sentinel goes off; then start a relay composition without ContainmentPort and a vault dispatch | non-exempt commands 503 SECURITY_READ_ONLY_MODE with Retry-After 300 and their handlers never run; exempt command IDs and the query run; writes accepted within 1 s after off; startup fails without the port; vault unaffected |
| TEST-PS-117-09.T28 | integration | PS-117-04.R07 | TenantPort stub with T1 suspended and T2 active: member command on T1, query on T1, operator configure on T1, command on T2; vault composition with LocalSettings.vaultId V1 dispatches a command, then a context with another tenantId | PLATFORM_TENANT_SUSPENDED 403 after authentication and before rate limiting; query and configure decided by the port; T2 ok; vault records and idempotency rows carry tenantId V1; foreign tenantId INTERNAL |
| TEST-PS-117-09.T29 | integration | PS-117-07.R03 | GET /media/v1/sha256-X through the relay server with the F15.S02.M01 media route registered, then a bus command and a bus problem response | media response Cache-Control public, max-age=31536000, immutable and no no-store; every bus response Cache-Control no-store with nosniff and deny-all CSP |
| TEST-PS-117-09.T30 | property | PS-117-01.R04, PS-117-02.R04, PS-117-09.R03 | hourFlooredUuidV7 at 14:00:00.000Z and 14:59:59.999Z, 100 000 IDs in one hour and 200 random instants; publicId() with a millisecond ID, an hour-floored ID, an hour-floored v4 value and an hour-floored ID 25 h ahead | embedded time 14:00:00.000Z for both instants; version 7 and variant 10; all IDs unique with no ordering asserted; NOT_HOUR_FLOORED, accepted, INVALID_UUIDV7 and ID_TIMESTAMP_SKEW |
| TEST-PS-117-09.T31 | unit | PS-117-01.R05, PS-117-02.R04 | cid() with the golden FED-7 cids of tests/fixtures/federation/envelope-golden.json, a padded value, a hex digest, a 42-character digest and an uppercase prefix; static scan of kernel exports and repository definitions | golden cids accepted; the others VALIDATION_FAILED with INVALID_CID; the kernel exports no cid computation and no repository keys records by cid |

## Acceptance criteria

- All tests T01–T31 pass in CI on Node 22 and the isomorphic scan finds no node-scheme import in the core.
- No failure path leaves records, outbox events or idempotency records behind (T11, T25).
- A duplicate submission never executes twice within 24 h (T10, T12).

## Dependencies

Module depends on: F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-ERR-001, CTR-EVT-001, CTR-IDM-001, CTR-CAP-001, CTR-FLG-001, CTR-SCH-001, CTR-OBS-001, CTR-PRV-001, CTR-TST-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
