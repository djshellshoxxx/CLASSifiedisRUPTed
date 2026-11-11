# PS-101-10 — Import, export, backup and rollback: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-10.R01** A user's vault export includes the signals recorded in their vault; relay signals about a subject are exported only to relay operators under legal hold.
- **PS-101-10.R02** Imported signals are marked with source import, capped at weight 20 per source and never inflate decay.
- **PS-101-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section moderation.signals in classrup-export/v1 (vault only, ExportSectionPort): one line per unexpired signal including sourceKey and reason text for manual ones.
- **import:** Signals import with sourceModule import and weight clamped to ±20; duplicates by (kind, sourceEventId) are skipped; expired ones are dropped; signals about the importing principal are dropped.
- **backup:** Vault export is the backup; relay SQLite backup (CTR-IOX-001 IOX-3) covers relay signals.
- **migration rollback:** Additive fields only in v1 (sourceKey, kinds refund_agreed, report_dismissed, damage_agreed and proximity_pattern); the mapping table moves from signals/2 to signals/3 for new events only (rentals.damage.resolved replaces rentals.damage.claimed, whose stored damage_claimed rows are read as damage_agreed until they expire; no-show contradictions; host-policy actions skipped; module table); rollback is safe because older readers ignore new optional fields and unknown kinds count as manual_concern with weight 0.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T13 | integration | PS-101-10.R01, PS-101-10.R02, PS-101-10.R03 | vault export, import into fresh vault, relay backup restore; read a v1 row with an unknown kind with the previous reader | signals round-trip with original observedAt; imported signals marked source import with weight cap 20; unknown kind counts as manual_concern with weight 0 |

## Dependencies

Module depends on: F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
