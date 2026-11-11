# PS-102-10 — Import, export, backup and rollback: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-10.R01** A user's vault export contains the email target with the cleartext address as the user's own P3 data, the relay, locale and status, and never the relay copy.
- **PS-102-10.R02** Relay restore from backup keeps encrypted addresses, fails queued deliveries older than 6 hours and revalidates the registered consent before any send; when the relay lost the copy, the vault re-adds the address from its email target after user confirmation.
- **PS-102-10.R03** Schema changes follow expand and contract; new templates are additive keys in the fixed registry.

## Specification

- **export:** Section notify.email in classrup-export/v1 through ExportSectionPort; one line per email target (schema classrup.notify.email_target/v1).
- **import:** Email targets import with status pending; nothing is sent until the user confirms re-adding at the chosen relay, which requires verification again.
- **backup:** Relay SQLite backup (CTR-IOX-001 IOX-3, IOX-7) contains encrypted addresses; the encryption key is stored outside the backup; consumers are excluded from restore re-delivery (externalSideEffects true), so on restore addresses without a granted registered consent are removed and erased first and queued deliveries older than 6 hours are failed; the vault export is the user's backup (IOX-6).
- **migration rollback:** Additive fields and templates only in v1; rollback is safe because older relays ignore unknown templates and keep sending the registered ones.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T13 | integration | PS-102-10.R01, PS-102-10.R02, PS-102-10.R03, PS-102-01.R04 | export from the vault; restore the relay from a backup that lacks the address; import the export into a fresh vault | export holds the email target with the cleartext address and no relay copy; restore fails stale queued deliveries; the vault offers re-add from its target and re-verification after confirmation |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F11.S01.M03, F07.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M03, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
