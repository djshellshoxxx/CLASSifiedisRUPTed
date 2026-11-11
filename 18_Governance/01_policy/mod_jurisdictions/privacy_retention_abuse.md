# PS-145-07 — Privacy, retention and abuse: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-07.R01** Profiles contain no personal data; the user's selection and age declaration are P3 local data and never leave the vault.
- **PS-145-07.R02** Profile versions are retained RET-STANDARD, with the last 3 versions of each code kept locally.
- **PS-145-07.R03** The UI states that profiles are configuration, not legal advice, and that the platform cannot verify age.

## Specification

**Data classification**
- JurisdictionProfile: P0 signed configuration.
- Selection and age declaration: P3, local only.

**Retention**
- JurisdictionProfile mirror: RET-STANDARD; last 3 versions per code.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Operator profile that quietly weakens privacy or shortens evidence retention to destroy records | hard bounds and privacy floors enforced in every vault, proposal required for activation, visible compare view |
| T02 | Forged profile statement | signature over JCS and trusted-publisher check |
| T03 | Age gate treated as verification | UI wording says self-declared; declaration never stored remotely |
| T04 | Restricted-category list used to censor competitors | categories referenced by id, proposal and public changelog, user can choose another profile |

**Abuse controls**
- Publisher limit of 50 profiles; vault trusts at most 10 publishers.
- Upload limit 10 per day per operator key on a relay.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T08 | abuse | PS-145-05.R03, PS-145-07.R02 | relay serves and uploads; scan logs for age declaration | anonymous read allowed, upload needs operator key, no age data in logs |
| TEST-PS-145-09.T11 | abuse | PS-145-07.R01, PS-145-07.R03 | inspect UI strings and stored data | disclaimer present; no age verification claim; no personal data in profiles |

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
