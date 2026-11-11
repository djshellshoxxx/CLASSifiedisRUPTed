# PS-071-05 — Authorization and capabilities: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-05.R01** Under vault policy (CAP-8) only the unlocked principal signs with its own device key; the role in the Deal limits which statement type it may sign.
- **PS-071-05.R02** Incoming receipts are accepted only when the signature verifies and the signer is a party of the claim; otherwise they are quarantined.
- **PS-071-05.R03** No relay role has any capability over receipts; relays see only ciphertext.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| commerce.receipt.issue | local-principal | principal is payer or payee of the claim; role matches statement type; vault unlocked |
| commerce.receipt.ingest | local-principal | internal ingest pipeline; signer is a party of the claim through a linked device key |
| commerce.receipt.read | local-principal, anonymous | principal reads receipts of its own claims; verification of a supplied file is a pure local function available without a vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T07 | abuse | PS-071-05.R01, PS-071-05.R02, PS-071-05.R03 | non-party signer; wrong-role statement; relay traffic inspection | quarantined with reason; relay sees only ciphertext |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
