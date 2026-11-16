# PS-079-03 — Workflow state machine: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-03.R01** Legal holds follow the declared machine and every activation and release needs two different operators.
- **PS-079-03.R02** An active hold excludes its subject from every sweep and relay purge until released.
- **PS-079-03.R03** Retention policy rows have no lifecycle; a change creates a new revision effective from the next sweep.

## Specification

### LegalHold lifecycle

Initial **requested**; terminal **released**, **rejected**, **lapsed**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| requested -> active | privacy.legal_hold.approve by a second operator | approver differs from requester; emits privacy.legal_hold.placed |
| requested -> rejected | privacy.legal_hold.reject by a second operator | no data is held |
| requested -> lapsed | approval deadline of 72 h passes | no data is held |
| active -> release_requested | privacy.legal_hold.release_request by an operator | audited |
| release_requested -> released | privacy.legal_hold.release_approve by a second operator | approver differs from release requester; emits privacy.legal_hold.released |
| release_requested -> active | privacy.legal_hold.release_reject by a second operator | hold continues |

```mermaid
stateDiagram-v2
  [*] --> requested
  requested --> active: privacy.legal_hold.approve by a second operator
  requested --> rejected: privacy.legal_hold.reject by a second operator
  requested --> lapsed: approval deadline of 72 h passes
  active --> release_requested: privacy.legal_hold.release_request by an operator
  release_requested --> released: privacy.legal_hold.release_approve by a second operator
  release_requested --> active: privacy.legal_hold.release_reject by a second operator
  released --> [*]
  rejected --> [*]
  lapsed --> [*]
```

### Timeouts and scheduled transitions

- Approval deadline 72 h from request; review reminder to operators at activeSince + 180 days, repeated every 30 days.
- Sweep schedule: relay daily at 02:30 relay time; vault at the first unlock after 24 h; run timeout 20 min.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T03 | unit | PS-079-02.R02, PS-079-03.R01 | A requests, A approves; B approves; B then requests release and B approves it | self approvals refused with PRIVACY_HOLD_SELF_APPROVAL; second operator approvals succeed |
| TEST-PS-079-09.T04 | integration | PS-079-03.R03, PS-079-03.R02 | 72 h without approval; policy change | hold lapses; policy revision effective at next sweep |
| TEST-PS-079-09.T05 | integration | PS-079-02.R03, PS-079-03.R02 | sweep with records at each age and one under active hold; one record kind without port | expired records purged, held record untouched, missing port reported skipped_unregistered |
| TEST-PS-079-09.T06 | property | PS-079-03.R01 | random hold command sequences | only declared transitions succeed; terminal states have no exits |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
