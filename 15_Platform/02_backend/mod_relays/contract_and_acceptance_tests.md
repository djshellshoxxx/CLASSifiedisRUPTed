# PS-118-09 — Contract and acceptance tests: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-118-09.R02** Configuration, identity, shutdown and dispatcher behavior are tested against a real node:http server and a real node:sqlite database in CI.
- **PS-118-09.R03** A canary suite runs the node:sqlite adapter on the pinned Node version and on the latest 22.x to detect behavior changes in the stability 1.1 API early.

## Specification

See the module test table below (all processes).

**Fixtures:** Temp data dir per test; Node 22.18.0 pinned in .nvmrc and Docker image plus latest 22.x canary; stub consumers (ok, flaky, always-failing); F16.S01.M01 role fixtures (relay_operator RO1 scope relay, tenant operator TO1 scope tenant:T1, member M1); stub TenantPort with maxUploadBytes 4194304; vault-side receipt verifier shared with F15.S01.M01; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T01 | unit | PS-118-01.R01, PS-118-01.R03 | first start, restart, rotate twice | one active key, stable relayId, keyIds #k1..#k3 with prevKeyId chain, retired keys published, seed only in key file, revocation certificate written per key |
| TEST-PS-118-09.T02 | unit | PS-118-02.R01, PS-118-02.R02 | each config rule V01-V05 violated in turn plus an unknown RELAY_* variable | exit code 78, names listed, values absent from output; unknown variable only warned |
| TEST-PS-118-09.T03 | integration | PS-118-02.R02, PS-118-02.R03 | send a 300 KiB JSON body, a 6 MiB media upload, a 4.5 MiB media upload above the tenant limit, slow headers, a request during drain | PAYLOAD_TOO_LARGE for the first three before the bus, connection closed after 10 s headers timeout, PLATFORM_RELAY_DRAINING with Retry-After 5 |
| TEST-PS-118-09.T04 | integration | PS-118-03.R01, PS-118-03.R02 | SIGTERM with 5 requests in flight (3 s) and a running dispatcher batch | readyz 503 immediately, requests finish, dispatcher stops after batch, hooks run, WAL truncated, exit 0 within 10 s |
| TEST-PS-118-09.T05 | integration | PS-118-03.R02, PS-118-03.R01 | SIGTERM with a request lasting 20 s, then a second SIGTERM | request cut at 10 s with exit 1, second signal exits 130 without TRUNCATE |
| TEST-PS-118-09.T06 | property | PS-118-03.R03, PS-118-01.R03 | random sequences of rotate, revoke requests and clock changes | active to retired and active or retired to revoked only, never back; rotation rate limit respected; revocation never rate limited |
| TEST-PS-118-09.T07 | contract | PS-118-04.R01, PS-118-04.R02, PS-118-04.R05 | well-known document, identity query, status query, rotate, revoke | payloads validate against registry schemas; rotation, revocation and receipt statements are registered in the F11.S01.M01 registry with signer role relay_identity and restore announcements are served unchanged; rotated event emitted once per change with change rotated or revoked |
| TEST-PS-118-09.T08 | integration | PS-118-04.R03, PS-118-06.R01, PS-118-06.R03 | flaky consumer fails 3 times then succeeds; always-failing consumer; kill -9 mid-batch | ordered at-least-once delivery, dead letter after 8 attempts, no lost events after restart, inbox suppresses duplicates |
| TEST-PS-118-09.T09 | abuse | PS-118-05.R01, PS-118-05.R02, PS-118-05.R03 | member M1 and tenant operator TO1 rotate and read status; relay signature presented as vault authorization | FORBIDDEN for both; relay signature ignored by vault verification test |
| TEST-PS-118-09.T10 | integration | PS-118-06.R02, PS-118-06.R03 | start two processes on one database | second exits with PLATFORM_RELAY_DUPLICATE_INSTANCE; first unaffected |
| TEST-PS-118-09.T11 | abuse | PS-118-07.R01, PS-118-07.R02, PS-118-07.R03 | full workload with canary plaintext in encrypted envelopes and a canary mailbox id in mailbox paths and queries; then advance the log clock 366 days | no plaintext canary in database or logs; no mailbox-id canary in any log line; only route templates; IPs truncated and absent on mailbox routes; no tokens; log files older than 365 days deleted |
| TEST-PS-118-09.T12 | abuse | PS-118-01.R02, PS-118-05.R02 | delete key file while identity row exists, then start; then relay identity init --new-identity | refuses with PLATFORM_RELAY_IDENTITY_MISSING; --new-identity creates a new genesis key and a new relayId that no chain links to the old one |
| TEST-PS-118-09.T13 | load | PS-118-08.R02, PS-118-08.R03 | 50 req/s mixed for 5 minutes on 2 vCPU container, then cold start timing | read p95 ≤ 150 ms, write p95 ≤ 300 ms, ready ≤ 3 s empty, dispatcher lag p95 ≤ 1 s |
| TEST-PS-118-09.T14 | integration | PS-118-08.R01 | metrics scrape and logs | metrics named per CTR-OBS-001 present, no user ids as labels, log lines match schema |
| TEST-PS-118-09.T15 | chaos | PS-118-06.R02, PS-118-09.R03 | node:sqlite canary on pinned and latest 22.x with SQLITE_BUSY injection | adapter behavior identical, DEPENDENCY_UNAVAILABLE returned, readyz fails after 10 s |
| TEST-PS-118-09.T16 | unit | PS-118-09.R01 | traceability tool run | every PS-118 requirement maps to a passing test |
| TEST-PS-118-09.T17 | integration | PS-118-10.R01, PS-118-10.R02, PS-118-10.R03 | export relay-hosted data section, restore from backup to a new directory with the key file, roll back one release | identity and archive intact, same relayId, receipts still verify, N-1 binary starts |
| TEST-PS-118-09.T18 | integration | PS-118-09.R02, PS-118-01.R01 | run on Node 22.17 and 22.18 | 22.17 exits 78 with PLATFORM_RELAY_RUNTIME_UNSUPPORTED; 22.18 starts without flags |
| TEST-PS-118-09.T19 | contract | PS-118-04.R04, PS-118-07.R04 | mailbox put to A, index write, federation inbox batch and media upload; rotate; verify each receipt with the vault verifier; present A's receipt for mailbox B | receipts validate as classrup.platform.relay_receipt/v1 with context classrup-relay-receipt:v1, digest of the exact bytes (ciphertext for the mailbox) and no cid for the mailbox put; keyId resolves to the right key after rotation; A's receipt rejected for B |
| TEST-PS-118-09.T20 | abuse | PS-118-03.R03, PS-118-01.R03, PS-118-02.R04 | CLI revoke of the stolen active key 1 h after a rotation, using the pre-signed certificate; vault holds receipts by that key stored before and after revokedAt | revocation accepted without prior-key authorization and without RATE_LIMITED; relay refuses to serve until --new-identity; receipts stored before revokedAt still verify, later ones are rejected |
| TEST-PS-118-09.T21 | abuse | PS-118-01.R02, PS-118-05.R03 | thief signs a rotation from key k2 while the operator signs another from k2; second rotation attempt on this relay from k2 | vault verifier detects two rotations with prevKeyId k2 and freezes the relay with a warning; this relay's unique index refuses to sign a second rotation from k2 |
| TEST-PS-118-09.T22 | contract | PS-118-04.R06, PS-118-02.R04 | GET /media/v1 for a P0 blob from an allowlisted and a foreign origin, for an encrypted blob and for a missing blob | P0 blob served with Cache-Control public, max-age=31536000, immutable, ETag, nosniff, CORP cross-origin, ACAO only for the allowlisted origin, Vary Origin, no Set-Cookie and no no-store; encrypted and missing both 404 |
| TEST-PS-118-09.T23 | integration | PS-118-03.R02, PS-118-06.R03 | shutdown with a registered pre-checkpoint hook that succeeds, then one that fails | WAL archived before TRUNCATE in the first case; TRUNCATE skipped and the WAL kept in the second; next start archives it first |
| TEST-PS-118-09.T24 | integration | PS-118-06.R01, PS-118-04.R02, PS-118-02.R04 | rotate replayed with the same Idempotency-Key and body, with the same key and a different body, with a stale expectedRevision, and a second rotation 2 h later | original response replayed; IDEMPOTENCY_KEY_REUSED; CONFLICT_REVISION; RATE_LIMITED |
| TEST-PS-118-09.T25 | integration | PS-118-05.R01, PS-118-05.R02 | relay_operator RO1 with an active relay-scope RoleAssignment rotates and reads status; RO1 after the assignment expires | allowed; then FORBIDDEN; no capability consults relay configuration for roles |
| TEST-PS-118-09.T26 | unit | PS-118-01.R04 | derive relayId from a fixed genesis key; format and parse keyId and each destination form; parse malformed strings | values equal the published vectors used by F15.S01.M01, F15.S02.M03, F11.S02.M01 and F01.S01.M03; malformed strings rejected with VALIDATION_FAILED |

## Acceptance criteria

- All tests T01-T26 pass in CI.
- The relay starts from environment variables alone, serves its identity and key history, and shuts down within the drain and hook budgets without losing in-flight committed work or unarchived WAL frames.
- No plaintext private user data and no private key material is ever stored in the database or logs, and no log line links a client address to a mailbox.
- Every receipt binds destination and the digest of the exact bytes and verifies against the published key history; a stolen key can be revoked from the CLI at once.
- Stopping or losing the relay loses no vault data; vault tests still pass with the relay stopped.

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
