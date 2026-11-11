# PS-107-06 — Failure recovery and idempotency: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-06.R01** Vault commands commit locally first; relay registration is a retried outbox step whose sync state is transport_acknowledged on HTTP 2xx and peer_accepted only with the relay acceptance signature over the statement cid, issued after signature, consent and chain checks; a duplicate or refused statement never reaches peer_accepted.
- **PS-107-06.R02** Relay register is idempotent on the statement cid, unsubscribe on the consent and token, and apply_relay_change on the receipt cid.
- **PS-107-06.R03** Conflicting states between vault and relay resolve toward withdrawn; a withdrawal is never undone by a late grant statement.

## Specification

- **idempotency:** Vault commands idempotent on (userDid, relayId, channel, status); relay register idempotent on statementCid with Idempotency-Key replay window 24 h; unsubscribe naturally idempotent and a reuse within the 365-day redeemed-marker window returns 200 unchanged; apply_relay_change idempotent on receipt cid.
- **concurrency:** expectedRevision on opt_out; the relay applies statements in chain order and a withdrawal always wins over a grant for the same consent; a grant whose cid already has a withdrawal is refused; no distributed lock.
- **retries:** Outbox retries register with backoff base 1 s, factor 2, cap 15 min for 14 days; unsubscribe is retried by the mail client; list_changes runs again at the next sync.
- **offline:** Opt-out works offline and takes effect locally at once; the UI says sending may continue until the relay registers it; opt-in requires a relay connection to register before enable.
- **partial failure:** If registration fails the vault consent stays granted locally but the UI shows not yet active on relay and enable stays disabled; if the relay withdrew while the vault was offline, the next list_changes returns the receipt and apply_relay_change withdraws the vault record.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T07 | integration | PS-107-06.R01, PS-107-06.R02, PS-107-06.R03, PS-107-03.R04 | register twice, unsubscribe twice, vault offline during a relay unsubscribe then list_changes | single registration and one receipt; peer_accepted only after the acceptance signature; apply_relay_change withdraws with via unsubscribe_link |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, F07.S02.M01, F11.S01.M01, F11.S03.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
