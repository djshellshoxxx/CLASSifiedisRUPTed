# PS-145-07 — Privacy, retention and abuse: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-07.R01** Profiles contain no personal data; the user's selection and age declaration are P3 local data and never leave the vault.
- **PS-145-07.R02** Profile versions are retained RET-STANDARD, with the last 3 versions of each code kept locally.
- **PS-145-07.R03** The UI states that profiles are configuration, not legal advice, and that the platform cannot verify age.
- **PS-145-07.R04** A signed change from a trusted but compromised or malicious publisher never removes records by itself: Looser retention waits for the owner's confirmation and applies only to records created after effectiveFrom, revoked signer keys are quarantined, and trust can be paused in F18.S02.M01.
- **PS-145-07.R05** The selection and age declaration are user data: the module registers ExportSectionPort, DeletionPort and RetentionPurgePort through the composition root and classifies them P3 through F10.S02.M02 (N6).

## Specification

**Data classification**
- JurisdictionProfile: P0 signed configuration.
- ProfileSelection and age declaration: P3, local only, classified through F10.S02.M02.

**Retention**
- JurisdictionProfile mirror: RET-STANDARD; last 3 versions per ProfileRef, older versions purged through RetentionPurgePort.
- ProfileSelection: RET-STANDARD, deleted with the vault through the F10.S01.M04 DeletionPort.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Operator profile that quietly weakens privacy or shortens evidence retention to destroy records | hard bounds and privacy floors enforced in every vault, decision verified in every receiving vault, Looser changes need owner confirmation and never apply to existing records, visible compare view |
| T02 | Forged profile statement | signature over JCS, signer key status and trusted-publisher check |
| T03 | Age gate treated as verification | UI wording says self-declared; declaration never stored remotely |
| T04 | Restricted-category list used to censor competitors | categories referenced by id, decision required and verified by receivers, public changelog, user can choose another profile |
| T05 | Publisher key compromise | F07 key status quarantines revoked device keys, pause-trust command in F18.S02.M01, decisions required for governed changes, owner confirmation for Looser changes |
| T06 | Unapproved restrictions released under a new code | a new code that differs from the generic profile needs a verified decision in every receiving vault |

**Abuse controls**
- Publisher limit of 50 profiles; trusted publishers are limited by F18.S02.M01 (at most 10 per vault).
- Upload limit 10 per day per operator key on a relay.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T11 | abuse | PS-145-07.R01, PS-145-07.R03 | inspect UI strings and stored data | disclaimer present; no age verification claim; no personal data in profiles |
| TEST-PS-145-09.T15 | integration | PS-145-07.R02 | receive 5 versions of eu_de | the vault keeps exactly the last 3 versions; older ones purged under RET-STANDARD |
| TEST-PS-145-09.T19 | integration | PS-145-03.R04, PS-145-07.R04 | version 4 of a selected eu_de shortens evidenceDays; owner confirms; version 5 only adds a notice; R1 evaluated after each bump | upgrade_pending until confirmed and shorter retention applies only to records created after effectiveFrom; version 5 applies automatically; R1 keeps matching through ProfileRef |
| TEST-PS-145-09.T21 | integration | PS-145-07.R05 | export the vault; run DeletionPort plan and execute; inspect field classes | selection and age declaration exported to the owner only; deleted by the port; classified P3 |

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-MNY-001. Predecessor: [domain_schema.md](domain_schema.md).
