# PS-150-03 — Workflow state machine: Bounded local matching

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S02.M01 Bounded local matching](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/local_matching/matcher` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-150-03.R01** Keep pure results deterministic and sorted independently of input candidate order.
- **PS-150-03.R02** Permit one ephemeral job; newer calls supersede older calls and cancellation settles stalled reads or loaders.
- **PS-150-03.R03** Recheck owner, session, epoch, revision, active state, expiry and blocks after the final awaited read before release.

## Specification

**Note:** Pure matcher has no state machine; the session retains only one ephemeral abort controller.

### Timeouts and scheduled transitions

- Expiry uses the injected clock; no background activity resumes automatically.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-150-09.T03 | integration | PS-150-03.R01, PS-150-03.R02, PS-150-03.R03 | Delay reads/loaders while cancelling, superseding, expiring, blocking or editing the intent | Only the current live revision can return; cancellation settles stalled operations |

## Dependencies

Module depends on: F19.S01.M01, F06.S01.M01, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
