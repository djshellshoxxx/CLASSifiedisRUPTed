# PS-104-10 — Import, export, backup and rollback: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-10.R01** A user's vault export contains push settings (relay, device labels, enabled state) but never endpoints or keys.
- **PS-104-10.R02** Relay restore from backup re-verifies subscriptions by a probe and expires the ones that fail; imported vaults must re-enable push on each device.
- **PS-104-10.R03** Schema changes follow expand and contract; new content encodings are additive behind the contentEncoding field.

## Specification

- **export:** Section notify.push in classrup-export/v1; one line per subscription without endpoint and keys (schema classrup.notify.push_subscription/v1 reduced projection).
- **import:** Nothing re-creates subscriptions; the app shows Re-enable push per device after import.
- **backup:** Relay SQLite backup (CTR-IOX-001 IOX-3, IOX-7) holds encrypted secrets; on restore every subscription older than 7 days is probed and expired on failure.
- **migration rollback:** Additive fields only in v1; rollback is safe because older relays ignore unknown fields and subscriptions continue to work with aes128gcm.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T14 | integration | PS-104-10.R01, PS-104-10.R02, PS-104-10.R03 | export from vault, restore relay from backup, rotate VAPID key | export has no endpoints; restored subscriptions are re-verified or expired; rotation expires old-key subscriptions |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
