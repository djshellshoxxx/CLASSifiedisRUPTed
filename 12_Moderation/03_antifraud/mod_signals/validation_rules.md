# PS-101-02 — Validation rules: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-02.R01** Manual signal input is validated strictly with bounded weight and a required reason.
- **PS-101-02.R02** Ingestion from events validates the mapping table and ignores events lacking a verified signature in the vault case.
- **PS-101-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | weight is an integer in -100..100 and halfLifeDays in 7..180 | VALIDATION_FAILED |
| V02 | kind is in the enum and manual kinds are only manual_concern, manual_positive or compensation | VALIDATION_FAILED |
| V03 | supersedesSignalId exists in this store, belongs to the same subject and is not itself a compensation | NOT_FOUND |
| V04 | a signal with the same (kind, sourceEventId) does not exist | SIGNALS_DUPLICATE_SOURCE |
| V05 | manual signals carry a reason of 10..500 code points and the author is the local principal or a relay moderator | FORBIDDEN |
| V06 | total manual weight per subject within 30 days is at most 20 in absolute value | SIGNALS_MANUAL_CAP |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T01 | unit | PS-101-01.R01, PS-101-02.R01, PS-101-02.R02 | record valid manual signals; invalid weight and kind | stored with expiry = observedAt + 5 half-lives; documented errors otherwise |
| TEST-PS-101-09.T03 | unit | PS-101-02.R03 | compensation referencing a missing signal, another subject, or a compensation | NOT_FOUND |
| TEST-PS-101-09.T07 | abuse | PS-101-07.R03, PS-101-02.R03 | 4th signal from the same source in 30 days; manual weight above cap | 4th ignored for scoring; SIGNALS_MANUAL_CAP |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
