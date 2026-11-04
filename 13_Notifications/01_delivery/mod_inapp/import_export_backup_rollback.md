# PS-103-10 — Import, export, backup and rollback: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-10.R01** A user's vault export contains unread notifications and the last 30 days of read ones as references and template keys only.
- **PS-103-10.R02** Import drops rows older than 30 days and rows whose reference type is unknown, keeps counts, and never regenerates alerts for imported rows.
- **PS-103-10.R03** Schema changes follow expand and contract; new templates and routing rows are additive and unknown templates render a generic fallback.

## Specification

- **export:** Section notify.notifications in classrup-export/v1; one line per Notification (schema classrup.notify.notification/v1).
- **import:** Rows validated against registries; existing IDs skipped; no OS alert, push or email is triggered by import.
- **backup:** The vault export is the backup (IOX-6); relays hold no inbox data.
- **migration rollback:** Additive routing rows and templates only; rollback is safe because older apps render unknown templates with the generic fallback and ignore unknown categories.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T13 | integration | PS-103-10.R01, PS-103-10.R02, PS-103-10.R03 | export, import into fresh vault, restore from backup | rows round trip; imported rows older than 30 days dropped; unread counts equal |

## Dependencies

Module depends on: F13.S02.M04, F08.S01.M01, F08.S01.M02, F08.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
