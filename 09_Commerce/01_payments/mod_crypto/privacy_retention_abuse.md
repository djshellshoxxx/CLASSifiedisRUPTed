# PS-068-07 — Privacy, retention and abuse: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-07.R01** Receiving addresses, txids and observations are P2 and never appear in public projections, logs at P2 detail or notifications; addresses are shared only inside end-to-end encrypted envelopes to the payer.
- **PS-068-07.R02** The module never requests, derives, stores or logs private keys, seed phrases or signatures that authorize spending; secret-looking input is rejected and discarded.
- **PS-068-07.R03** A user-configured verifier endpoint learns which transactions and addresses the user queries; the UI says so and offers a relay or own-node choice.

## Specification

**Data classification**
- CryptoPaymentRequest and ChainObservation: P2 (parties). Verifier endpoint URLs: P3; API keys: P4 held in the vault key store.
- On-chain data is public; linking a pseudonym to an address is the sensitive part, so addresses are never published.

**Retention**
- RET-EVIDENCE (2 years after last related activity); observations may be compacted after 90 days to the final status, txid, block hash and verifier ID.
- On deletion: did pseudonymized in retained records; chain data cannot be erased and the UI says so.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Payee address swapped by an attacker in transit | address inside a signed statement over JCS; payer UI shows the address checksum groups and asks to compare the first and last 6 characters |
| T02 | Payer sends a fake txid to get a completed state | claim stays claimed until a configured verifier matches address, amount and asset; wrong or absent data never confirms |
| T03 | Malicious or compromised verifier endpoint reports false finality | trust label shows endpoint; optional 2-of-2 quorum; relay-signed observations are labelled; payee can always dispute |
| T04 | Reorg after the goods were released | reorged state is shown; UI warns not to release goods before final; Bitcoin 6 confirmations and EVM finalized tag are defaults |
| T05 | Social engineering to reveal a seed phrase | validation rejects secret patterns; copy states the app never asks for keys |
| T06 | Address reuse links a payee's deals | fresh address hint; warning when the same address appears in an earlier request in the vault |

**Abuse controls**
- Manual refresh limit of 3 per minute per observation and a global poll budget of 600 endpoint calls per hour per vault.
- Request creation limit of 20 per day per vault; ingest limit 20 statements per hour per sender.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T12 | integration | PS-068-07.R01, PS-068-07.R03 | inspect outbound endpoint requests and local logs | only txid or address lookups to the configured endpoint; no addresses or amounts in logs |
| TEST-PS-068-09.T13 | abuse | PS-068-07.R02 | 4 refreshes in one minute | 4th returns RATE_LIMITED |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
