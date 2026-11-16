# PS-107-09 — Contract and acceptance tests: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-107-09.R02** Contract tests check commands, statements and event payloads against the schema registry.
- **PS-107-09.R03** Send-path tests assert that no push or email leaves without a granted consent.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault U with device key, relay R offering push and email, relay R2 offering push only, privacy consent PC1 granted, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T01 | unit | PS-107-01.R01, PS-107-01.R02, PS-107-02.R01 | opt in to push on R and withdraw then re-grant | first record withdrawn terminal; re-grant creates a new record; statement signed |
| TEST-PS-107-09.T02 | unit | PS-107-01.R03, PS-107-02.R02, PS-107-02.R03 | each rule V01 to V07 violated in turn including email on R2 and token reuse | documented error code returned and state unchanged |
| TEST-PS-107-09.T03 | property | PS-107-03.R01, PS-107-03.R02, PS-107-03.R03 | random sequences of opt in, opt out, expiry, unsubscribe and privacy withdrawal | terminal states never change; withdrawal always wins over grant |
| TEST-PS-107-09.T04 | contract | PS-107-04.R01, PS-107-04.R02, PS-107-09.R02 | each command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-107-09.T05 | integration | PS-107-04.R03 | privacy.consent.withdrawn and privacy.deletion.requested delivered | linked channels withdrawn locally and relay withdrawal queued |
| TEST-PS-107-09.T06 | abuse | PS-107-05.R01, PS-107-05.R02, PS-107-05.R03 | forged opt-in from another key; unsubscribe attempting to grant; relay trying to create a consent | rejected in each case |
| TEST-PS-107-09.T07 | integration | PS-107-06.R01, PS-107-06.R02, PS-107-06.R03 | register twice, unsubscribe twice, vault offline during relay unsubscribe | single record, idempotent results, next sync applies relay withdrawal |
| TEST-PS-107-09.T08 | abuse | PS-107-07.R01, PS-107-07.R03 | 11th unsubscribe in a minute; token guessing run of 10 000 attempts; inspect logs | RATE_LIMITED, no success, no tokens in logs |
| TEST-PS-107-09.T09 | integration | PS-107-07.R02, PS-107-06.R01 | dispatch with no consent, with withdrawn consent and with expired consent | relay sends nothing in each case |
| TEST-PS-107-09.T10 | load | PS-107-08.R01, PS-107-08.R02, PS-107-08.R03 | 50 register and unsubscribe per second for 2 minutes and sweep 100 000 | budgets met |
| TEST-PS-107-09.T11 | unit | PS-107-09.R01, PS-107-09.R03 | traceability tool run | every PS-107 requirement maps to a passing test |
| TEST-PS-107-09.T12 | integration | PS-107-10.R01, PS-107-10.R02, PS-107-10.R03 | export, import into fresh vault, restore relay from backup | consents round trip; imported granted consents are re-registered only after user confirmation |
| TEST-PS-107-09.T13 | a11y | PS-107-04.R01 | settings and unsubscribe page with screen reader and keyboard | switches labelled, page works without JavaScript, zero serious axe issues |

## Acceptance criteria

- All tests T01 to T13 pass in CI.
- No push or email is ever sent without a granted, unexpired, verified consent.
- Unsubscribe works with one click and no login and cannot grant consent.

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
