# PS-012-03 — Workflow state machine: Barter counteroffers

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M04 Barter counteroffers](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/counteroffer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-012-03.R01** A revision has no state transitions; creating a new revision is the only way to change terms.
- **PS-012-03.R02** After a fork is detected no further revision on that subject is accepted, and the subject owners freeze the subject for explicit renegotiation as a new subject.
- **PS-012-03.R03** Closing a subject (accepted, rejected, withdrawn, expired, cancelled, declined, frozen by a conflicting promise) makes further revisions fail with CONFLICT_STATE.

## Specification

**Note:** ProposalRevision is immutable and has no lifecycle. Subject lifecycles are owned by F02.S01.M01 (TradeProposal) and F02.S03.M01 (Cycle). The only mutable flag is forked, set once when a conflicting twin is detected.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-012-09.T03 | property | PS-012-01.R03, PS-012-03.R01 | random sequences of create and ingest | revision numbers contiguous, chain prev matches, never above 20 |
| TEST-PS-012-09.T04 | integration | PS-012-01.R03, PS-012-03.R02, PS-012-09.R03 | Alice and Bob both counter as revision 3 offline, then sync | both quarantined as fork, subject frozen, mutiny.revision.forked emitted once |
| TEST-PS-012-09.T05 | integration | PS-012-03.R03, PS-012-04.R03 | revise after accepted and after cancelled | CONFLICT_STATE; all earlier consents voided on an accepted revision of a different open subject |
| TEST-PS-012-09.T18 | property | PS-012-01.R05, PS-012-01.R02, PS-012-03.R01 | random revision chains where revision k restores the terms of an earlier revision | every revision has a distinct contentHash; consents on the earlier digest stay void |
| TEST-PS-012-09.T23 | integration | PS-012-04.R04, PS-012-03.R02 | mutiny.revision.report_fork called with a signed consent on a different digest at the head revision number | forked set, mutiny.revision.forked emitted once with evidence consent, further revisions refused |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S02.M05, F02.S04.M01, F02.S04.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
