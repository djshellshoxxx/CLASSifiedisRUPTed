# PS-010-05 — Authorization and capabilities: Price negotiation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M02 Price negotiation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/negotiation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-010-05.R01** Vault policy: only the local principal acting as buyer or seller of the chain may counter, accept, reject or withdraw, and only on its own turn for counter and accept.
- **PS-010-05.R02** Inbound statements are accepted only when signed by the stated buyer or seller key and consistent with the chain; otherwise quarantined (CAP-8).
- **PS-010-05.R03** Relay policy: relays authorize mailbox delivery of the encrypted envelopes by signed requests from the recipient device key; relays cannot read or alter rounds.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| bazaar.negotiation.counter | owner | local principal is buyer or seller of the chain and awaiting = local principal; not blockedWith(counterparty) |
| bazaar.negotiation.decide | owner | local principal is a party of the chain; accept requires awaiting = local principal; keep_frozen only for the seller of a hold_fork chain |
| bazaar.negotiation.withdraw | owner | local principal is a party of the chain |
| bazaar.negotiation.receive | peer | statement signed by the stated counterparty key; signature, role and chain consistency verified |
| bazaar.negotiation.read | owner | local principal is buyer or seller of the chain; F01.S01.M04 may read counts on the owner's behalf for the evidence check |
| bazaar.negotiation.relay_mailbox | relay-member | relay policy: request signed by the recipient device key; ciphertext only; mailbox quota default 10 MiB |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-010-09.T10 | abuse | PS-010-05.R01, PS-010-05.R02, PS-010-05.R03 | non-party counters; statement signed by a third key; relay reads mailbox | FORBIDDEN or quarantined role_mismatch; relay sees ciphertext |

## Dependencies

Module depends on: F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
