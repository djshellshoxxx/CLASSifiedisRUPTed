# PS-026-03 — Workflow state machine: Mixed-value compensation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M01 Mixed-value compensation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/mixed` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-026-03.R01** A leg is proposed in a revision, becomes due when the cycle is committed, is claimed by the payer, and is settled only by payee acknowledgement or chain finality as reported by F09.
- **PS-026-03.R02** A cycle cancelled before any handover withdraws all non-terminal legs, while a partially executed cycle keeps due legs for the recovery case to waive, adjust by agreement or dispute.
- **PS-026-03.R03** Expiry follows COM-3, 14 days without progress, and is shown to both parties; an expired leg never counts as settled.
- **PS-026-03.R04** Disputed legs are resolved only by the outcome of F09.S02.M02 or by a waiver agreed in recovery.

## Specification

### CompensationLeg lifecycle

Initial **proposed**; terminal **settled**, **waived**, **expired**, **withdrawn**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| proposed -> due | mutiny.cycle.committed consumed for the subject | dueAt = local commit time + 14 d; Deal opened in F09.S01.M01 |
| proposed -> withdrawn | mutiny.compensation.withdraw, a newer revision not referencing the leg, or the subject ended | no obligation exists |
| due -> claimed | mutiny.compensation.claim by the payer | PaymentClaim created in F09.S01.M01; emits mutiny.compensation.claimed |
| due -> withdrawn | mutiny.cycle.cancelled consumed before any handover | no money is owed |
| due -> expired | 14 d without progress on the local clock | shown as expired; recovery or a new proposal may follow |
| claimed -> settled | commerce.payment.acknowledged for cash or external, or final for crypto, consumed | emits mutiny.compensation.settled |
| claimed -> disputed | commerce.payment.disputed consumed | recovery case or dispute referenced |
| claimed -> expired | commerce.payment.expired consumed | 14 d without progress per COM-3 |
| disputed -> settled | commerce.dispute.resolved with payment confirmed | emits mutiny.compensation.settled |
| disputed -> waived | commerce.dispute.resolved with no-fault close or waiver agreed in recovery | no payment due |

```mermaid
stateDiagram-v2
  [*] --> proposed
  proposed --> due: mutiny.cycle.committed consumed for the subject
  proposed --> withdrawn: mutiny.compensation.withdraw, a newer revision not referencing the leg, or the subject ended
  due --> claimed: mutiny.compensation.claim by the payer
  due --> withdrawn: mutiny.cycle.cancelled consumed before any handover
  due --> expired: 14 d without progress on the local clock
  claimed --> settled: commerce.payment.acknowledged for cash or external, or final for crypto, consumed
  claimed --> disputed: commerce.payment.disputed consumed
  claimed --> expired: commerce.payment.expired consumed
  disputed --> settled: commerce.dispute.resolved with payment confirmed
  disputed --> waived: commerce.dispute.resolved with no-fault close or waiver agreed in recovery
  settled --> [*]
  waived --> [*]
  expired --> [*]
  withdrawn --> [*]
```

### Timeouts and scheduled transitions

- A due or claimed leg without progress expires 14 days after dueAt or the last claim update, evaluated on vault open and every 60 s while open.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-026-09.T01 | unit | PS-026-01.R01, PS-026-01.R03, PS-026-03.R01 | planner on 3-party fixture | legs p2 to p1 4000 and p2 to p3 2000, all residuals zero |
| TEST-PS-026-09.T04 | unit | PS-026-01.R02, PS-026-03.R02 | planner with acceptedImbalance covering one gap | that participant omitted and fewer legs produced |
| TEST-PS-026-09.T05 | integration | PS-026-03.R01, PS-026-03.R04 | cycle committed then claim then acknowledged | proposed to due to claimed to settled; settled event emitted; Deal opened |
| TEST-PS-026-09.T06 | integration | PS-026-03.R02, PS-026-03.R03 | cycle cancelled before handover; cycle partially executed | due legs withdrawn in first case, kept in second |
| TEST-PS-026-09.T12 | unit | PS-026-03.R03, PS-026-07.R02 | leg without progress for 14 days with injected clock | expired and not counted as settled |

## Dependencies

Module depends on: F02.S04.M02, F02.S04.M03, F02.S02.M03, F09.S01.M01, F09.S03.M03, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
