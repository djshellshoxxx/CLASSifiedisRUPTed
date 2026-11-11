# PS-135-05 — Authorization and capabilities: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-05.R01** Flows act through each vault's command bus as its local principal; incoming statements are accepted only when signed by a key authorized for the role (CTR-CAP-001 CAP-8, N2 registry), a correctly signed statement from a key without that role is quarantined with its reason and changes nothing, and relay requests use signed requests or relay access tokens.
- **PS-135-05.R02** Each flow includes at least one negative authorization step (wrong actor gets FORBIDDEN or NOT_FOUND per CTR-ERR-001 ERR-4).
- **PS-135-05.R03** Fake ports have no capabilities of their own and cannot be reached from production code paths.

## Specification

_None._

No runtime capabilities of its own: this module runs only in developer shells and CI jobs. Under ADR-0016 (CTR-CAP-001 CAP-8) the tests exercise two layers: vault policy (local principal mutates only its records; incoming signed statements accepted only from a key authorized for the role, else quarantined) and relay policy (relay-signed requests or relay access tokens). Tests never ship in the PWA or relay bundles.

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T08 | integration | PS-135-05.R02 | each flow performs a wrong-actor vault command step | FORBIDDEN or NOT_FOUND per ERR-4 |
| TEST-PS-135-09.T09 | abuse | PS-135-05.R03, PS-135-07.R02, PS-135-07.R03 | import fake port from production code; capture relay logs during every flow and scan them for the P3 canary | import rejected; canary absent from captured relay logs, exports and P0 payloads |
| TEST-PS-135-09.T25 | abuse | PS-135-05.R01, PS-135-02.R04 | signer_role_mismatch - a correctly signed classrup.bazaar.offer_decision/v1 acceptance made by a key that is not the listing author is delivered to the buyer vault | quarantined with reason signer_role_invalid; no Deal, no hold and no state change |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, CTR-PRV-001, CTR-CAP-001, CTR-IOX-001, F17.S01.M01, F15.S02.M02, F15.S02.M03, F15.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F09.S01.M01, F09.S01.M03, F16.S02.M02, F07.S02.M01, F10.S01.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
