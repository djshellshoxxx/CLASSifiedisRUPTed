# PS-019-05 — Authorization and capabilities: Matching participant eligibility

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M04 Matching participant eligibility](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-019-05.R01** Only the unlocked local principal can change its profile; vault policy rejects every other actor.
- **PS-019-05.R02** A peer projection is accepted only when signed by the DID it names; otherwise it is quarantined.
- **PS-019-05.R03** Relay policy decides which projections a relay indexes; this module never grants a relay any right over the principal's profile.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.matching_profile.update | principal | vault unlocked |
| mutiny.matching_profile.ingest | principal | envelope signature verifies and author DID equals envelope author |
| mutiny.matching_profile.read_own | principal | own vault |
| mutiny.matching_profile.read_projections | principal | own vault; returns only public projection fields of peers, never exclusions |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-019-09.T08 | abuse | PS-019-05.R01, PS-019-05.R02, PS-019-07.R01 | other actor updates profile; projection signed by wrong DID; request logs inspected | FORBIDDEN or quarantine; no exclusion in any log |
| TEST-PS-019-09.T18 | abuse | PS-019-05.R03 | relay refuses to index, rewrites or replays a projection | refusal removes only that relay's copy; rewritten projection fails signature; replay ignored; no relay request can change the local profile |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F06.S02.M01, F06.S02.M02, F16.S02.M03, F12.S03.M04, F15.S01.M01, F11.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
