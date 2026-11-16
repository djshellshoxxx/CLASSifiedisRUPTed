# PS-124-07 — Privacy, retention and abuse: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-07.R01** Vault flag settings are the user's own configuration and never leave the device except in the user's own export; relay flag settings are public hosting policy of that relay.
- **PS-124-07.R02** Changes record who and why for operators (relay scope) without recording content, and audit entries for relay changes are kept 1 year (RET-AUDIT).
- **PS-124-07.R03** A relay cannot learn a user's vault flags and a user's flags are never sent to a relay, which prevents fingerprinting by configuration.

## Specification

**Data classification**
- Vault scope FlagSetting: P1 local configuration.
- Relay scope FlagSetting: P0 hosting policy; changedBy is an operator device key, reasons are operator-written and public to operators only.

**Retention**
- FlagSetting rows kept until reset or deletion of the vault or community; relay audit of changes 1 year (RET-AUDIT).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | A relay or remote party flips vault flags | no remote path exists; vault-scope commands require the unlocked local principal; no flag advisory is auto-applied |
| T02 | Rogue operator disables safety features on a relay | core F15 and F16 locked, every change audited with actor and reason, vaults can leave the relay and local filtering continues |
| T03 | Dependency bypass by direct row edit or crafted request | evaluation re-checks the dependency rule so a stored violation still evaluates off; commands re-verify inside the transaction |
| T04 | Fingerprinting users through their flag set | vault flags never transmitted; relay evaluation depends only on community settings and caller roles |
| T05 | Flag flapping to cause denial of service | 30 changes per minute per actor, 30 s cache, cascade size capped at 200 keys |

**Abuse controls**
- Rate limit 30 changes per minute per actor and 200 keys per cascade.
- Relay changes are written to the operator audit log with actor, capability, key and decision only (CTR-CAP-001 CAP-7).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T11 | abuse | PS-124-07.R01, PS-124-07.R03 | capture all network traffic while changing vault flags | zero requests carrying flag values; relay evaluation independent of vault flags |
| TEST-PS-124-09.T12 | abuse | PS-124-07.R02, PS-124-07.R03 | operator turns F15 off and 31 changes in one minute | PLATFORM_FLAG_LOCKED and RATE_LIMITED; audit rows written for relay changes with actor and reason |

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
