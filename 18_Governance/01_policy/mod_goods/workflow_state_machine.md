# PS-144-03 — Workflow state machine: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-03.R01** Category follows the declared machine in the publisher vault; user vaults mirror the status from verified packs only.
- **PS-144-03.R02** Retired is terminal and requires a merge target so listings referencing the category can be resolved.
- **PS-144-03.R03** Applying a pack is atomic: the resulting snapshot, with applied changes and changes held for a missing decision, is stored in one transaction or not at all.
- **PS-144-03.R04** A category is retired only after at least 30 days of deprecation; there is no direct active to retired transition, in the publisher vault or in apply_pack.

## Specification

### Category lifecycle

Initial **active**; terminal **retired**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| active -> deprecated | governance.category.set_status by publisher, or verified pack change | hidden from new listings; existing references keep working; statusSince set; emits governance.category.changed |
| deprecated -> active | reactivate by publisher or verified pack change | emits governance.category.changed |
| deprecated -> retired | retire with mergedInto and proposalId by publisher, or verified pack change | deprecated for at least 30 days (V13) and decision verified (V06); resolve alias returns mergedInto; emits governance.category.changed |

```mermaid
stateDiagram-v2
  [*] --> active
  active --> deprecated: governance.category.set_status by publisher, or verified pack change
  deprecated --> active: reactivate by publisher or verified pack change
  deprecated --> retired: retire with mergedInto and proposalId by publisher, or verified pack change
  retired --> [*]
```

### Timeouts and scheduled transitions

- A deprecated category may be retired no earlier than 30 days after its anchored deprecation, enforced in the publisher vault and in apply_pack.
- A held change waiting for its decision is retried when governance.policy_proposal.decided arrives or the decision is fetched, and is dropped with its PendingStatement after 30 days.
- Pending and review-held packs follow the F18.S02.M01 PendingStatement lifecycle (discarded after 30 days).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T04 | property | PS-144-03.R01, PS-144-03.R02, PS-144-03.R04 | random status changes with an injected clock | only declared transitions; no active to retired; retired only after 30 days deprecated and with mergedInto; terminal never reverts |
| TEST-PS-144-09.T05 | integration | PS-144-03.R03, PS-144-06.R02 | pack with one invalid category; pack with one change lacking its decision | first rejected whole and previous version active; second applied atomically with that record held |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
