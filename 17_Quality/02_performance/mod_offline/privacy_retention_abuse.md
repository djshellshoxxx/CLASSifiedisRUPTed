# PS-140-07 — Privacy, retention and abuse: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-07.R01** Cached and queued data are synthetic; tests assert that authenticated responses are never stored in Cache Storage and that P3 values are not written to the outbox in plain text beyond what the command requires.
- **PS-140-07.R02** Logout and account switch clear caches and outbox for the previous account.
- **PS-140-07.R03** Browser traces from offline tests redact Authorization headers.

## Specification

**Data classification**
- Synthetic outbox entries and cached public listings (P0/P1).
- No real credentials; test tokens are random and short-lived.

**Retention**
- Reports 14 days as CI artifacts; browser contexts are discarded after each test.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Authenticated response cached and exposed to the next user on a shared device | test asserts network-only routes and cache emptiness after logout |
| T02 | Replay applies a command twice and double-charges a claim | exactly-once assertions with idempotency keys across resets |
| T03 | Queued command with stale authority executes after privilege revocation | replay re-checks authorization; test expects FORBIDDEN |

**Abuse controls**
- Quota-filling attempts: the test fills storage to 95 percent and expects a visible error rather than silent drop.
- Outbox size is limited to 500 entries; the 501st enqueue is refused with a visible message.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T08 | e2e | PS-140-05.R02, PS-140-07.R02 | logout then inspect IndexedDB and caches | all empty for the previous account |
| TEST-PS-140-09.T10 | e2e | PS-140-07.R01, PS-140-09.R02 | plant an authenticated response in cache | QUALITY_OFFLINE_AUTH_CACHED and suite fails |
| TEST-PS-140-09.T11 | abuse | PS-140-07.R03, PS-140-09.R02 | fill storage to 95 percent and enqueue; plant replay with a new key | visible quota error; the new-key bug fails with QUALITY_OFFLINE_DUPLICATE_EFFECT |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
