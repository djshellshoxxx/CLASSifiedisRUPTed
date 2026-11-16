# PS-141-04 — Commands, queries and events: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-04.R01** The module exposes workflow triggers: push, pull_request (opened, synchronize, reopened), workflow_dispatch and schedule for nightly.
- **PS-141-04.R02** Reusable scripts are pnpm ci:fast and pnpm ci:nightly so that developers can reproduce a gate locally; the YAML only calls these scripts.
- **PS-141-04.R03** The release workflow calls pnpm gates:release from F17.S03.M02 and fails on a non-zero exit.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| QUALITY_CI_ACTION_FORBIDDEN | 422 | no | workflow uses a non first-party action (lint exit 3) |
| QUALITY_CI_WORKFLOW_INVALID | 422 | no | workflow lacks permissions, concurrency or timeout (lint exit 3) |
| QUALITY_CI_ARTIFACT_MISSING | 422 | no | pwa-dist artifact missing in e2e job (job fails) |
| QUALITY_CI_PATH_FILTER_WRONG | 422 | no | path filter does not match the documented rule (lint exit 3) |
| QUALITY_CI_GATE_TOO_SLOW | 422 | no | fast gate p95 exceeded 10 min (reported, exit 1 in the weekly check) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm ci:fast
  install 41 s (cache hit) | spec:check 0 errors | typecheck 38 s | unit/property/integration 3 min 12 s | build-pwa 74 s
  e2e-smoke (pwa-dist, no relay) 82 s  | gate-summary OK  total 7 min 4 s
$ node tools/ci-lint .github/workflows
  nightly.yml OK  ci.yml OK
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T03 | unit | PS-141-02.R02, PS-141-03.R03, PS-141-04.R01 | parse ci.yml job graph and triggers | install precedes all; e2e-smoke needs build-pwa; triggers include push, pull_request, workflow_dispatch, schedule for nightly |
| TEST-PS-141-09.T06 | unit | PS-141-04.R02, PS-141-04.R03 | read package scripts and release workflow | ci:fast, ci:nightly exist; release calls gates:release and propagates exit code |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S03.M02, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
