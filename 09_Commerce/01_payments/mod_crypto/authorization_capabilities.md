# PS-068-05 — Authorization and capabilities: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-05.R01** Under vault policy (CAP-8) only the unlocked principal mutates its vault; request creation and cancellation require the payee role in the Deal.
- **PS-068-05.R02** Incoming request statements are accepted only when signed by the obligation payee; otherwise they are quarantined.
- **PS-068-05.R03** No relay role has any capability over requests or observations; a relay-hosted verifier endpoint only returns signed observations the vault verifies.
- **PS-068-05.R04** Verifier requests carry no authority at all - no DID, device-key signature or relay access token - so a relay-hosted verifier cannot tie a lookup to the principal through authentication.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| commerce.crypto_request.create | local-principal | principal is the obligation payee; crypto in allowedMethods; Deal open |
| commerce.crypto_request.cancel | local-principal | principal is the payee; request open |
| commerce.crypto_verifier.configure | local-principal | vault unlocked; HTTPS endpoint only; chain_lookup consent checked through privacy.consent.check |
| commerce.crypto_observation.refresh | local-principal | principal is a party of the Deal; at most 3 per minute per observation; within the poll budget |
| commerce.crypto_request.read | local-principal | principal is a party of the Deal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T10 | abuse | PS-068-05.R01, PS-068-05.R02, PS-068-05.R03 | request signed by the payer; third-party statement; relay inspects traffic | quarantined or FORBIDDEN; relay sees only ciphertext |
| TEST-PS-068-09.T25 | integration | PS-068-07.R04, PS-068-05.R04 | inspect every verifier request (own node, direct endpoint, relay endpoint) with chain_lookup consent granted and then withdrawn | no DID, device-key signature, relay access token or cookie; connection separate from mailbox traffic; with consent withdrawn no lookup happens and refresh returns PRECONDITION_FAILED |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
