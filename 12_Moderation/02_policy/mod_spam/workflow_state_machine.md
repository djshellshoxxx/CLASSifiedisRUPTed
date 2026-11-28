# PS-097-03 — Workflow state machine: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-03.R01** Evaluation is a pure function of input, fingerprint index snapshot and configured thresholds, and has no lifecycle.
- **PS-097-03.R02** A throttle recommendation expires after at most 1 hour and is renewed only by new evidence.
- **PS-097-03.R03** A degraded mode with exact-hash checks only is used while the index rebuilds, and results record degraded true.
- **PS-097-03.R04** Velocity counts every first-seen content id by the store's receipt time regardless of its claimed createdAt, and a gap of more than 24 h between claimed createdAt and receipt time adds the backdated_claim heuristic instead of excluding the statement.

## Specification

**Note:** Stateless evaluation; no entity lifecycle. Throttle windows are owned by F12.S03.M03.

### Timeouts and scheduled transitions

- Fingerprint index entries expire after 30 days and key observations 30 days after lastSeenAt; an hourly sweep removes expired entries.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T02 | unit | PS-097-03.R01 | duplicate window and simhash distance 3 and 4 on fixed snapshots | distance 3 flagged duplicate_near, distance 4 not |
| TEST-PS-097-09.T03 | property | PS-097-01.R01, PS-097-01.R03, PS-097-02.R03, PS-097-03.R01, PS-097-06.R01 | random and hostile texts evaluated twice with the same index snapshot | identical output including rulesVersion and thresholds; no exceptions; score within 0..100; bounded runtime |
| TEST-PS-097-09.T08 | chaos | PS-097-06.R02, PS-097-06.R03, PS-097-03.R03 | index lost mid-run; signal store down; crash between index write and event | degraded true with exact-hash mode; recovery within 5 minutes; index row and event both present or both absent; events delivered later |
| TEST-PS-097-09.T10 | integration | PS-097-03.R02 | throttle recommended then 61 minutes pass | throttle expired; no persistent penalty from this module |
| TEST-PS-097-09.T15 | abuse | PS-097-03.R04 | 20 fresh statements with createdAt −25 h received within 10 minutes; one replayed content id | velocity triggers on receipt time and backdated_claim is added; the replay is not counted twice |

## Dependencies

Module depends on: F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
