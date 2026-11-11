# PS-028-05 — Authorization and capabilities: Service availability

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M02 Service availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-028-05.R01** Vault policy - only the unlocked local principal who owns the calendar may run any command or query in this module.
- **PS-028-05.R02** The signed summary is accepted by receivers only when its signature verifies against the provider DID carried in the summary (providerId) and, when it names an offering, that offering's verified projection names the same provider; otherwise it is quarantined with a reason.
- **PS-028-05.R03** No relay role is involved; a relay may refuse to host the summary by its own policy, which changes only the sync state.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| services.calendar.set_rules | principal | calendar.providerId = local principal |
| services.calendar.publish_summary | principal | calendar.providerId = local principal; federation_publish consent for each relay destination; client destinations are known counterparties not blocked; destination relay accepts the signed upload by its own policy |
| services.calendar.read_own | principal | calendar.providerId = local principal |
| services.slot.hold | principal | calendar.providerId = local principal; holder is a known counterparty and not blocked either way (isBlockedEither); extend and commit only on behalf of the quote module in the same vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-028-09.T09 | abuse | PS-028-05.R01, PS-028-05.R02, PS-028-05.R03 | foreign principal command; summary whose providerId differs from the signing key; summary naming an offering of another provider; relay refusal | FORBIDDEN; both summaries quarantined; sync state refused without local change |
| TEST-PS-028-09.T22 | integration | PS-028-05.R02 | receiver gets summaries with seq 5 then seq 4, and one signed by a revoked key | seq 5 kept, seq 4 ignored; revoked-key summary not shown as valid; re-signed summary accepted |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F08.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
