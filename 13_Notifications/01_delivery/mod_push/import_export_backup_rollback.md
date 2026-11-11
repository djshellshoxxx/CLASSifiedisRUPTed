# PS-104-10 — Import, export, backup and rollback: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-10.R01** A user's vault export contains the push target records (relay, device key, device label, enabled, status) and never endpoints or keys, which only the browser and the relay copy hold.
- **PS-104-10.R02** On relay restore subscriptions are re-verified by a probe and failing ones expire; on vault import, or when a relay lost its copy, the vault rebuilds the relay copy from the push target record and a fresh browser subscription after user confirmation.
- **PS-104-10.R03** Schema changes follow expand and contract; new content encodings are additive behind the contentEncoding field.

## Specification

- **export:** Section notify.push in classrup-export/v1 through ExportSectionPort; one line per push target (schema classrup.notify.push_target/v1); no relay copy is exported.
- **import:** Push targets import as expired; the app shows Re-enable push per relay and re-creates the relay copy with a new browser subscription only after the user confirms.
- **backup:** Relay SQLite backup (CTR-IOX-001 IOX-3, IOX-7) holds encrypted secrets; consumers are excluded from restore re-delivery (externalSideEffects true), so on restore subscriptions without a granted registered consent or with a revoked creating key are revoked first, then every subscription older than 7 days is probed and expired on failure; the vault export is the user's backup (IOX-6).
- **migration rollback:** Additive fields only in v1; rollback is safe because older relays ignore unknown fields and subscriptions continue to work with aes128gcm; retained VAPID keys are kept through a rollback.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T14 | integration | PS-104-10.R01, PS-104-10.R02, PS-104-10.R03 | export from the vault, restore the relay from backup, vault import into a fresh device, scheduled VAPID rotation | export has push targets without endpoints; restored subscriptions are probed or expired; import rebuilds the relay copy only after confirmation; old-key subscriptions keep working 30 days then expire |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F16.S02.M01, F11.S01.M03, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
