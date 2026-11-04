# PS-069-05 — Authorization and capabilities: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-05.R01** Under vault policy (CAP-8) only the unlocked local principal mutates its vault; payer-only and payee-only commands also check the role recorded in the Deal.
- **PS-069-05.R02** Incoming statements are accepted only if signed by the key of the party named in the Deal for that role; otherwise they are quarantined with a reason.
- **PS-069-05.R03** No relay role grants any capability over Deals or claims; relays carry encrypted envelopes and see only routing metadata.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| commerce.deal.open | local-principal | vault unlocked; principal is a party of the obligations; invoked by a context module on the principal's behalf |
| commerce.deal.cancel | local-principal | principal is a party of the Deal; all parties' cancel statements needed to cancel |
| commerce.payment.claim | local-principal | principal is the obligation payer; Deal open |
| commerce.payment.acknowledge | local-principal | principal is the claim payee |
| commerce.payment.dispute | local-principal | principal is the claim payee |
| commerce.statement.ingest | local-principal | internal ingest pipeline of the unlocked vault; statement signer authorized by Deal role |
| commerce.deal.read | local-principal | principal is a party of the Deal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T10 | abuse | PS-069-05.R01, PS-069-05.R02, PS-069-07.R01 | forged statement, wrong-role signer, third party reading | statement quarantined with reason, no state change, NOT_FOUND for non-parties, no deal data in public payloads |
| TEST-PS-069-09.T11 | contract | PS-069-05.R03, PS-069-01.R03 | inspect relay double traffic | only ciphertext and routing metadata observed |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
