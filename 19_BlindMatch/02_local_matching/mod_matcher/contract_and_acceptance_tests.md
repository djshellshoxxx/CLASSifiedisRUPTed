# PS-150-09 — Contract and acceptance tests: Bounded local matching

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S02.M01 Bounded local matching](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/local_matching/matcher` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-150-09.R01** Compare exact price boundaries and synthetic eligible sets against an independent deterministic oracle.
- **PS-150-09.R02** Exercise malformed input, every asynchronous cancellation stage, late session changes and minimal-output privacy.
- **PS-150-09.R03** Preserve existing gates and report unavailable browser runs honestly; absent or skipped execution establishes no acceptance.

## Specification

See the module test table below (all processes).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-150-09.T01 | unit | PS-150-01.R01, PS-150-01.R02, PS-150-01.R03 | Inspect result keys and malformed retained metadata/evidence bindings | Only public owner/listing/revision/CID references return; signature admission remains upstream |
| TEST-PS-150-09.T02 | unit | PS-150-02.R01, PS-150-02.R02, PS-150-02.R03 | Use dense/sparse arrays, 129 candidates, conflicting identities and exact currency boundaries | Bounded validation fails closed and every hard criterion applies without FX |
| TEST-PS-150-09.T03 | integration | PS-150-03.R01, PS-150-03.R02, PS-150-03.R03 | Delay reads/loaders while cancelling, superseding, expiring, blocking or editing the intent | Only the current live revision can return; cancellation settles stalled operations |
| TEST-PS-150-09.T04 | unit | PS-150-04.R01, PS-150-04.R02, PS-150-04.R03 | Inspect candidate-loader arguments and request unavailable confidential modes | Loader sees signal and limit only; nonlocal modes invoke no loader or fallback |
| TEST-PS-150-09.T05 | unit | PS-150-05.R01, PS-150-05.R02, PS-150-05.R03 | Use default/malformed enablement and own/blocked/unavailable public records | Matching requires literal true and excludes ineligible records without consent inference |
| TEST-PS-150-09.T06 | integration | PS-150-06.R01, PS-150-06.R02, PS-150-06.R03 | Change an intent through another store and reject or stall the loader | Final durable revision and ephemeral epoch prevent stale results; no automatic retries or jobs |
| TEST-PS-150-09.T07 | unit | PS-150-07.R01, PS-150-07.R02, PS-150-07.R03 | Spy on logging/network APIs and inspect outputs and persisted tables | Criteria, amounts, negative explanations and identifying markers are absent from outputs and side effects |
| TEST-PS-150-09.T08 | contract | PS-150-08.R01, PS-150-08.R02, PS-150-08.R03 | Compare deterministic permutations and 128/129 candidate boundaries; separately measure target devices | Stable order, exact all-or-error bounds and separately documented mobile qualification |
| TEST-PS-150-09.T09 | contract | PS-150-09.R01, PS-150-09.R02, PS-150-09.R03 | Run the independent interval oracle and controller race suites | Actual executions support bounded local claims; native/mobile and protocol gates remain separate |
| TEST-PS-150-09.T10 | integration | PS-150-10.R01, PS-150-10.R02, PS-150-10.R03 | Erase/reopen and restore an active intent from backup before requesting matching | Recovered intent is draft and no loader resumes automatically; results/context are never restored |

## Acceptance criteria

- All process requirements have explicit test contracts; executed evidence is separately reported.
- Focused tests and existing regressions pass without weakening assertions or counting unavailable browser execution.
- UI, authenticated discovery composition, mobile acceptance and confidential protocol release remain gated.

## Dependencies

Module depends on: F19.S01.M01, F06.S01.M01, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
