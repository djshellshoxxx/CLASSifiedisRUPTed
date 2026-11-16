# PS-145-05 — Authorization and capabilities: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-05.R01** Vault policy: authoring and releasing require the publisher key; receiving, selecting and reading are available to the vault owner for trusted publishers.
- **PS-145-05.R02** Relay policy (CAP-9): a relay applies its own profile to what it hosts and accepts profile uploads only from its operator key; a relay role has no effect on a user's local selection.
- **PS-145-05.R03** The age declaration and the selection are P3 local preferences and are never transmitted.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| governance.jurisdiction_profile.author | owner | local principal holds the publisher key; profile status draft |
| governance.jurisdiction_profile.release | owner | local principal is the profile publisher; proposal verified when required; signing key unrevoked |
| governance.jurisdiction_profile.apply | owner | vault unlocked; signature valid and publisher trusted or trusted in the same action |
| governance.jurisdiction_profile.select | owner | vault unlocked; profiles are active and trusted |
| governance.jurisdiction_profile.read | owner | vault unlocked; internal callers F01.S01.M03 and F10.S01.M02 on the owner's behalf |
| governance.jurisdiction_profile.relay_read | relay-anonymous | relay policy: public read of the relay's active profiles, 60 requests per minute per IP prefix |
| governance.jurisdiction_profile.relay_publish | relay-operator | relay policy: request signed by the operator device key |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T07 | abuse | PS-145-05.R01, PS-145-05.R02 | untrusted publisher, tampered statement, non-publisher release | pending or FORBIDDEN or rejected; selection and age never sent over network (spy) |
| TEST-PS-145-09.T08 | abuse | PS-145-05.R03, PS-145-07.R02 | relay serves and uploads; scan logs for age declaration | anonymous read allowed, upload needs operator key, no age data in logs |

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
