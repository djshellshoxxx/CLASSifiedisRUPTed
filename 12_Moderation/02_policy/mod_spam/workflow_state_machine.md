# PS-097-03 — Workflow state machine: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-03.R01** Evaluation is a pure function of input, fingerprint index snapshot and configured thresholds, and has no lifecycle.
- **PS-097-03.R02** A throttle recommendation expires after at most 1 hour and is renewed only by new evidence.
- **PS-097-03.R03** A degraded mode with exact-hash checks only is used while the index rebuilds, and results record degraded true.

## Specification

**Note:** Stateless evaluation; no entity lifecycle. Throttle windows are owned by F12.S03.M03.

### Timeouts and scheduled transitions

- Fingerprint index entries expire after 30 days; an hourly sweep removes expired entries.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T02 | unit | PS-097-01.R02, PS-097-03.R01 | duplicate window and simhash distance 3 and 4 | distance 3 flagged duplicate_near, distance 4 not |
| TEST-PS-097-09.T03 | property | PS-097-01.R01, PS-097-03.R02 | random texts evaluated twice with the same index snapshot | identical output; no exceptions; bounded runtime |
| TEST-PS-097-09.T08 | chaos | PS-097-06.R01, PS-097-06.R02, PS-097-06.R03, PS-097-03.R03 | index lost mid-run; signal store down | degraded true with exact-hash mode; recovery within 5 minutes; events delivered later |
| TEST-PS-097-09.T10 | integration | PS-097-03.R02, PS-097-07.R02 | throttle recommended then 61 minutes pass | throttle expired; no persistent penalty from this module |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
