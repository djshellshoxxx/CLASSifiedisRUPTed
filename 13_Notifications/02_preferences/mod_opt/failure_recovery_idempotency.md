# PS-107-06 — Failure recovery and idempotency: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-06.R01** Vault commands commit locally first; relay registration is a retried outbox step with sync states prepared, transport acknowledged and peer accepted (relay receipt).
- **PS-107-06.R02** Relay register is idempotent on the statement CID and unsubscribe is idempotent on the token.
- **PS-107-06.R03** Conflicting states between vault and relay resolve toward withdrawn; a withdrawal is never undone by a late grant statement.

## Specification

- **idempotency:** Vault commands idempotent on (userDid, relayId, channel, status); relay register idempotent on statementCid with Idempotency-Key replay window 24 h; unsubscribe naturally idempotent.
- **concurrency:** expectedRevision on opt_out; relay applies statements in order of arrival and a withdrawal always wins over a grant for the same record; no distributed lock.
- **retries:** Outbox retries register with backoff base 1 s, factor 2, cap 15 min for 14 days; unsubscribe is retried by the mail client.
- **offline:** Opt-out works offline and takes effect locally at once; the UI says sending may continue until the relay confirms; opt-in requires a relay connection to register.
- **partial failure:** If registration fails the vault consent stays granted locally but the UI shows not yet active on relay; if the relay withdrew while the vault was offline the next sync applies the relay-signed withdrawal.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T07 | integration | PS-107-06.R01, PS-107-06.R02, PS-107-06.R03 | register twice, unsubscribe twice, vault offline during relay unsubscribe | single record, idempotent results, next sync applies relay withdrawal |
| TEST-PS-107-09.T09 | integration | PS-107-07.R02, PS-107-06.R01 | dispatch with no consent, with withdrawn consent and with expired consent | relay sends nothing in each case |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
