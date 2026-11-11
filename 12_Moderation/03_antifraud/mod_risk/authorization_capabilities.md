# PS-100-05 — Authorization and capabilities: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-05.R01** Vault policy: only the local principal can read or recompute assessments in its vault.
- **PS-100-05.R02** Relay policy: moderators with an open case, operators and the subject (own key) can read relay assessments; no other member can.
- **PS-100-05.R03** Assessments are never returned to the counterparty and never federated.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.riskassessment.recompute | local principal, moderator, operator | vault unlocked, or relay role; subject permitted by V04 |
| moderation.riskassessment.read | local principal, moderator | vault unlocked, or relay moderator with open case on the subject |
| moderation.riskassessment.read_own | local principal, member | vault unlocked, or member reading own key on a relay |
| moderation.risk.assess | local principal, moderator | in-process only: vault unlocked for a transaction of the principal or its own listing publication, or relay moderator with an open case; not routable over HTTP |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T07 | abuse | PS-100-05.R01, PS-100-05.R02, PS-100-05.R03 | counterparty reads own assessment from the other's vault; member reads another's relay assessment | NOT_FOUND; level never in federation payloads |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
