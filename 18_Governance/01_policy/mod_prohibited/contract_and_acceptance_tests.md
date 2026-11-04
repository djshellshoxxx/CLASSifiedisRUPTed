# PS-146-09 — Contract and acceptance tests: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-09.R01** Every requirement is covered by at least one automated test.
- **PS-146-09.R02** Contract tests validate pack statements, commands, evaluate results and events against the registry and verify signatures.
- **PS-146-09.R03** Evaluation determinism is covered by property tests with at least 200 runs, 10 000 nightly.

## Specification

See the module test table below (all processes).

**Fixtures:** Rule pack version 41 with rules counterfeit_goods (block), age_restricted_goods (review, notice), used_electronics_notice (allow_with_notice), and one emergency review rule; trusted publisher PK1, untrusted PK2; clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T01 | unit | PS-146-01.R01, PS-146-01.R02, PS-146-02.R01, PS-146-02.R02 | draft valid rule and one with 51 keywords | stored immutable version; invalid rejected with documented code |
| TEST-PS-146-09.T02 | unit | PS-146-02.R03 | violate each rule V01-V09 | documented error code returned; nothing released or applied |
| TEST-PS-146-09.T03 | property | PS-146-01.R03, PS-146-02.R02 | random texts with look-alikes and zero-width characters | verdict deterministic and stable under normalization; whole-word mode avoids substring matches |
| TEST-PS-146-09.T04 | property | PS-146-03.R01, PS-146-03.R02 | random lifecycle commands | only declared transitions; one active version per key; new version retires old one atomically |
| TEST-PS-146-09.T05 | integration | PS-146-03.R03, PS-146-08.R03 | emergency rule passes 7 days | retired automatically, emergency_expired event emitted, evaluation ignores it |
| TEST-PS-146-09.T06 | contract | PS-146-04.R01, PS-146-04.R02, PS-146-09.R02 | release, apply, evaluate | pack validates against classrup.governance.rule_pack/v1, signature verifies, result has no matched text, event valid |
| TEST-PS-146-09.T07 | integration | PS-146-04.R03, PS-146-06.R03 | apply pack while publications are active | changed event emitted; F01.S01.M03 re-evaluation ends a publication that now blocks |
| TEST-PS-146-09.T08 | abuse | PS-146-05.R01, PS-146-05.R02, PS-146-05.R03 | untrusted publisher pack; non-publisher release; relay removal | pending or FORBIDDEN; relay removal affects only that relay |
| TEST-PS-146-09.T09 | integration | PS-146-06.R01, PS-146-06.R02 | replay release; apply two packs concurrently with evaluate | one packCid; evaluate sees old or new pack only |
| TEST-PS-146-09.T10 | chaos | PS-146-06.R03 | relay down during release; one consumer fails | local state intact; delivery prepared; consumer retries without rolling back the pack |
| TEST-PS-146-09.T11 | abuse | PS-146-07.R01, PS-146-07.R02, PS-146-07.R03 | scan logs, storage and events after evaluating text | no listing text or keywords stored or logged; sensitive keywords only as hashes in public copy |
| TEST-PS-146-09.T12 | abuse | PS-146-07.R03 | 100 000-code-point input; 2 001 rules; 601 evaluations in a minute | rejected before matching; pack rejected; RATE_LIMITED |
| TEST-PS-146-09.T13 | load | PS-146-08.R01, PS-146-08.R02, PS-146-08.R03 | 2 000 rules, 8 000 code points on Moto G profile; relay at 50 req/s | evaluate p95 <= 20 ms, apply p95 <= 800 ms, relay p95 <= 100 ms, no telemetry |
| TEST-PS-146-09.T14 | unit | PS-146-09.R01, PS-146-09.R03 | traceability tool run, nightly property seeds | every PS-146 requirement maps to a passing test |
| TEST-PS-146-09.T15 | integration | PS-146-10.R01, PS-146-10.R02, PS-146-10.R03 | export, import to fresh vault, import pack with bad signature | rules round-trip with provenance; bad pack rejected |

## Acceptance criteria

- All tests T01-T15 pass in CI.
- Blocking and review rules are never activated without a verified approved decision; emergency rules are review-level and expire within 7 days.
- Evaluation is deterministic, bounded to 20 ms p95, offline capable, and never stores or logs listing text.

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
