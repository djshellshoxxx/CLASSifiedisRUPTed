# PS-069-05 — Authorization and capabilities: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-05.R01** Under vault policy (CAP-8) only the unlocked local principal mutates its vault; payer-only and payee-only commands also check the role recorded in the Deal.
- **PS-069-05.R02** Incoming statements are accepted only if signed by the key of the party named in the Deal for that role; otherwise they are quarantined with a reason.
- **PS-069-05.R03** No relay role grants any capability over other parties' Deals or claims; relays carry encrypted envelopes and see only routing metadata, and the one relay-side capability is the operator acknowledging claims on listing_fee Deals where that relay's operator is the payee.
- **PS-069-05.R04** Unilateral cancellation is allowed only to the context owner role that ContextTermsPort names for the context type, and receiving vaults verify that role before applying it.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| commerce.deal.open | local-principal | vault unlocked; principal is a party of the obligations; invoked through DealPort by a context module on the principal's behalf; principal holds the opener role of the context type |
| commerce.deal.cancel | local-principal | principal is a party of the Deal; mode mutual needs all parties' cancel statements; mode unilateral only for the context owner role while no claim is acknowledged or final |
| commerce.payment.claim | local-principal | principal is the obligation payer; Deal open |
| commerce.payment.acknowledge | local-principal, operator | vault - principal is the payee of a cash or external claim; relay - operator role of a relay whose operator DID is the payee of the listing_fee Deal, under relay policy |
| commerce.payment.dispute | local-principal | principal is the claim payee |
| commerce.statement.ingest | local-principal | internal ingest pipeline of the unlocked vault (or of a relay for its own listing_fee Deals); statement signer authorized by Deal role |
| commerce.deal.read | local-principal | principal is a party of the Deal |
| commerce.deal.export | local-principal | principal is a party of a completed Deal whose completion statements from every party are held; the user confirmed the disclosure preview |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T10 | abuse | PS-069-05.R01, PS-069-05.R02, PS-069-07.R01, PS-069-02.R02 | forged statement, wrong-role signer, signing key not active in the signer's identity document, third party reading | statement quarantined with reason, no state change, NOT_FOUND for non-parties, no deal data in public payloads |
| TEST-PS-069-09.T11 | contract | PS-069-05.R03, PS-069-01.R03 | inspect relay double traffic | only ciphertext and routing metadata observed |
| TEST-PS-069-09.T22 | integration | PS-069-03.R05, PS-069-05.R04 | context owner cancels open Deals through DealPort.cancel with each reason context_voided, withdrawn_before_accept, non_payment, buyer_timeout and conflict_resolved; a non-owner tries; the owner tries after a claim was acknowledged | one-sided cancel applied in the other vault, labelled one-sided and emitted with that reason; non-owner FORBIDDEN or quarantined; CONFLICT_STATE after acknowledgement |
| TEST-PS-069-09.T29 | integration | PS-069-05.R03, PS-069-04.R01 | listing_fee Deal on relay R - claim delivered to the operator mailbox, operator acknowledges through the relay command, then a moderator of R and the operator of another relay try | ack signed by the operator DID from R's signed policy document and applied in the seller vault; the other attempts FORBIDDEN |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
