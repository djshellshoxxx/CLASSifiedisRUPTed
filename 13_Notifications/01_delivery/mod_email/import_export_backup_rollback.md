# PS-102-10 — Import, export, backup and rollback: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-10.R01** A user's vault export contains only the email channel state and masked address, never the cleartext address.
- **PS-102-10.R02** Relay restore from backup keeps encrypted addresses, drops queued deliveries older than 6 hours and revalidates consent before any send.
- **PS-102-10.R03** Schema changes follow expand and contract; new templates are additive keys in the registry.

## Specification

- **export:** Section notify.email in classrup-export/v1; one line with relay, masked address and status (schema classrup.notify.email_address/v1 reduced projection).
- **import:** Nothing re-creates an address; after import the user must add and verify the address again at the chosen relay.
- **backup:** Relay SQLite backup (CTR-IOX-001 IOX-3, IOX-7) contains encrypted addresses; the encryption key is stored outside the backup; on restore queued deliveries older than 6 hours are failed.
- **migration rollback:** Additive fields and templates only in v1; rollback is safe because older relays ignore unknown templates and keep sending the registered ones.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T13 | integration | PS-102-10.R01, PS-102-10.R02, PS-102-10.R03 | export from vault, restore relay from backup | export has no addresses; restored unverified addresses older than 7 days removed; verified ones require a send probe |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
