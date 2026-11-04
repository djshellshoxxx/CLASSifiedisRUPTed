# PS-133-01 — Domain schema: Security threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M01 Security threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-133-01.R01** Each register row has ID THR-<boundary>-<NN>, boundary, STRIDE category, threat statement, control reference (module ID and requirement ID), test reference, residual risk text and review date.
- **PS-133-01.R02** Boundaries are fixed identifiers B1 static distributor and PWA host, B2 vault on device, B3 relay, B4 federation peers, B5 wallets and chains, B6 physical exchange, plus cross-cutting X1 forked vaults and X2 offline revocation lag.
- **PS-133-01.R03** The register is retained in the repository history indefinitely and each release tags the version of the model reviewed.

## Specification

**Note:** No catalog entities. The register is a versioned document (YAML front matter plus markdown tables) validated by the traceability tool; rows are not stored in application databases.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-133-09.T01 | unit | PS-133-01.R01, PS-133-01.R02, PS-133-02.R01 | parse the valid fixture register | 42 rows parsed with all required fields; boundaries B1–B6, X1, X2 recognized |
| TEST-PS-133-09.T03 | unit | PS-133-01.R03, PS-133-02.R01 | boundary with all STRIDE letters, and one with a not-applicable reason of 10 characters | accepted for the full set; reason under 20 characters rejected |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S02.M03, F12.S03.M03, CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-COM-001. Predecessor: [module SPEC](SPEC.md).
