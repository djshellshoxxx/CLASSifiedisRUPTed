# PS-124-07 — Privacy, retention and abuse: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-07.R01** Vault flag settings are the user's own configuration and never leave the device except in the user's own export; relay flag settings are public hosting policy of that relay.
- **PS-124-07.R02** Changes record who and why for operators (relay scope) without recording content, and audit entries for relay changes are kept 1 year (RET-AUDIT).
- **PS-124-07.R03** A relay cannot learn a user's vault flags and a user's flags are never sent to a relay, which prevents fingerprinting by configuration.
- **PS-124-07.R04** Vault-scope settings are classified P3 field by field (F10.S02.M02), and the module registers ExportSectionPort (section platform.flags), DeletionPort and RetentionPurgePort with F10.S01.M03, F10.S01.M04 and F10.S01.M02 and consumes privacy.deletion.completed (N6).

## Specification

**Data classification**
- Vault scope FlagSetting and mirror row: P3 device-only configuration (it can fingerprint a user), never transmitted.
- Relay scope FlagSetting: P0 hosting policy; changedBy is an operator key, reasons are operator-written and shown to tenant operators and admins only.

**Retention**
- FlagSetting rows kept until reset or deletion of the vault (DeletionPort) or community; the RetentionPurgePort has nothing to purge before that; relay audit of changes 1 year (RET-AUDIT).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | A relay or remote party flips vault flags | no remote path exists; vault-scope commands require the unlocked local principal; no flag advisory is auto-applied |
| T02 | Rogue operator disables safety features on a relay | core F15 and F16 locked, every change audited with actor and reason, vaults can leave the relay and local filtering continues |
| T03 | Dependency bypass by direct row edit or crafted request | evaluation re-checks the dependency rule so a stored violation still evaluates off; commands re-verify inside the transaction |
| T04 | Fingerprinting users through their flag set | vault flags P3 and never transmitted; relay evaluation depends only on community settings and caller roles |
| T05 | Flag flapping to cause denial of service | 30 changes per minute per actor, 30 s cache, cascade size capped at 200 keys |
| T06 | A non-operator re-enables a relay module by resetting it to its default | reset_relay requires the platform.flag.set_relay capability, the tenant operator or admin role and an Idempotency-Key; reset is vault-only |
| T07 | Unreadable settings silently re-enable modules the user switched off (federation publishing, push, location) | fail closed with last committed values or all switchable non-core modules off |

**Abuse controls**
- Rate limit 30 changes per minute per actor and 200 keys per cascade.
- Relay changes and resets are written to the operator audit log with actor, capability, key and decision only (CTR-CAP-001 CAP-7).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T11 | abuse | PS-124-07.R01, PS-124-07.R03 | capture all network traffic while changing vault flags | zero requests carrying flag values; relay evaluation independent of vault flags |
| TEST-PS-124-09.T12 | abuse | PS-124-07.R02, PS-124-07.R03 | operator turns F15 off and 31 changes in one minute | PLATFORM_FLAG_LOCKED and RATE_LIMITED; audit rows written for relay changes with actor and reason |
| TEST-PS-124-09.T20 | contract | PS-124-01.R02, PS-124-01.R04, PS-124-07.R04 | set vault flags in V1 and V2, set relay flags for T1; inspect V1 and V2 IndexedDB, the relay database and every request | vault rows only in each vault's IndexedDB with tenantId equal to its own vaultId and P3 classification; no vault row or value in any relay request or relay table; relay rows in SQLite classified P0 |
| TEST-PS-124-09.T21 | integration | PS-124-07.R04, PS-124-04.R03 | export section, deletion plan and retention purge through the F10 ports, then privacy.deletion.completed for L1 | section platform.flags lists vault-scope settings with field classes; deletion removes every vault-scope row and the mirror; purge removes nothing early; no row remains after the event |

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
