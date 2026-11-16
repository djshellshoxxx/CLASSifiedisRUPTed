# PS-029-05 — Authorization and capabilities: Service skills catalog

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M01 Service skills catalog](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/skills` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-029-05.R01** Vault policy - only the unlocked local principal who authored an offering may create, revise, publish or withdraw it; there is no server role.
- **PS-029-05.R02** The signed projection is readable by anyone who fetches it from a relay; drafts never leave the vault. Relay policy decides whether a relay indexes or serves it.
- **PS-029-05.R03** Foreign projections received from other authors are stored read-only with provenance only when the signature verifies against the listed author key; otherwise they are quarantined with a reason.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| services.offering.create | principal | local principal owns the linked listing; local limit of 20 published offerings |
| services.offering.revise | principal | offering.providerId = local principal |
| services.offering.publish | principal | offering.providerId = local principal; relay access token or signed request only for the chosen relay upload |
| services.offering.withdraw | principal | offering.providerId = local principal |
| services.offering.read_public | principal, anonymous | any stored projection whose signature verified; unverified items are quarantined and not returned |
| services.offering.read_own | principal | offering.providerId = local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-029-09.T07 | abuse | PS-029-05.R01, PS-029-05.R02, PS-029-05.R03 | foreign principal revises; inbound projection with bad signature and with wrong author key | FORBIDDEN; both inbound items quarantined and not returned by read_public |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
