# PS-129-09 — Contract and acceptance tests: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-129-09.R02** Revocation ordering, freshness and forked-successor behavior are covered by property and chaos tests.
- **PS-129-09.R03** Contract tests check statements and events against the schema registry.

## Specification

See the module test table below (all processes).

**Fixtures:** Principal P with device keys K1, K2, K3 and recovery key R, counterparty Q with key Kq, relays X and Y, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T01 | unit | PS-129-01.R01, PS-129-01.R02, PS-129-01.R03, PS-129-02.R01 | register K2 with link statement signed by K1 and K2 | KeyRecord stored active, keyId equals thumbprint, event emitted |
| TEST-PS-129-09.T02 | unit | PS-129-02.R02, PS-129-02.R03 | each rule V02–V07 violated | documented error code and nothing stored |
| TEST-PS-129-09.T03 | property | PS-129-01.R03, PS-129-03.R01 | random sequences of register, revoke, expire, conflict resolution | revoked and expired never change; revoked never returns to active |
| TEST-PS-129-09.T04 | integration | PS-129-03.R03, PS-129-06.R03 | expiry sweep missed; revocation arrives before key | verification denies expired key; pending revocation applied when key appears |
| TEST-PS-129-09.T05 | integration | PS-129-03.R02 | two valid successor statements for K1 | status conflicted; revocation by recovery key resolves |
| TEST-PS-129-09.T06 | contract | PS-129-04.R01, PS-129-04.R02, PS-129-09.R02 | commands, queries, events and revocation list | validate against registry schemas; list signature verifies with relay key |
| TEST-PS-129-09.T07 | integration | PS-129-04.R03 | identity.device_key.added and revoked, federation.peer.added delivered twice | one record each; statuses correct |
| TEST-PS-129-09.T08 | abuse | PS-129-05.R01, PS-129-05.R02, PS-129-05.R03, PS-129-07.R01 | stolen K3 revokes K1 and K2; unauthorized signer revokes; recovery key revokes K3 | flagged pending confirmation; SECURITY_KEY_UNAUTHORIZED; recovery revocation wins |
| TEST-PS-129-09.T09 | abuse | PS-129-07.R03, PS-129-02.R01 | 11th device key; 21st registration in a day; 51st revocation | SECURITY_KEY_LIMIT, RATE_LIMITED, RATE_LIMITED; oversized statement rejected |
| TEST-PS-129-09.T10 | chaos | PS-129-06.R01, PS-129-06.R02, PS-129-06.R03 | publish fails after local revocation; replay of the same Idempotency-Key | local revocation stands; outbox retries; one record |
| TEST-PS-129-09.T11 | integration | PS-129-07.R02, PS-129-07.R03 | backdated effectiveFrom 31 days; consent received in the 20-day window | rejected for 31 days; accepted for 20 days with 'signed during claimed compromise' label |
| TEST-PS-129-09.T12 | integration | PS-129-02.R03, PS-129-07.R01 | peer relay unreachable for 8 days | freshness class unknown; high-stakes verify returns the warning |
| TEST-PS-129-09.T13 | load | PS-129-08.R01, PS-129-08.R02, PS-129-08.R03 | 1 000 status queries per second for 5 minutes; list of 100 000 revocations | p95 targets met; list served ≤ 2 s |
| TEST-PS-129-09.T14 | unit | PS-129-09.R01, PS-129-09.R03 | traceability tool run | every PS-129 requirement maps to a passing test |
| TEST-PS-129-09.T15 | integration | PS-129-10.R01, PS-129-10.R02, PS-129-10.R03 | export key records, import into fresh vault, restore relay backup | statuses and revocation statements preserved; imported counterparty freshness reset to unknown |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- A revoked key can never become active again and verification always reports freshness of revocation knowledge.
- Revocation by an attacker with one compromised key cannot override the recovery key.

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
