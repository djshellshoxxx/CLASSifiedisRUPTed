# PS-076-10 — Import, export, backup and rollback: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-10.R01** The vault export contains the full consent history in the section privacy.consents.
- **PS-076-10.R02** Import re-evaluates each consent against the bundled policy hashes and lapses any whose hash is unknown or outdated.
- **PS-076-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section privacy.consents in classrup-export/v1; one line per PrivacyConsent (schema classrup.privacy.consent/v1) plus the signed statements (classrup.privacy.consent_statement/v1 and classrup.privacy.consent_withdrawal/v1).
- **import:** Granted consents import as lapsed unless the policy hash equals the current bundled hash; no import ever grants a consent that the user did not hold at export time, and imported statements are never re-sent to relays.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only the signed consent statements they received.
- **migration rollback:** Additive fields only in v1; rollback is safe because older readers ignore unknown optional fields; the default-off rule is never relaxed by a migration.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T16 | integration | PS-076-10.R01, PS-076-10.R02, PS-076-10.R03 | export, import with unknown policy hash, roll back one release | history round-trips; unknown hash imports as lapsed |

## Dependencies

Module depends on: F07.S01.M01, F11.S01.M01, F15.S01.M01, F16.S02.M02, F12.S03.M03, F10.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
