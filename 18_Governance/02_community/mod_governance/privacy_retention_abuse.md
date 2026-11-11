# PS-147-07 — Privacy, retention and abuse: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-07.R01** Proposals and decisions are public signed statements; comments are visible to the relay's community and are linkable to pseudonyms; the UI says pseudonymity is not anonymity.
- **PS-147-07.R02** Decisions and proposals are retained as evidence (RET-EVIDENCE); comments follow RET-STANDARD and hidden comments keep their signed statement for audit.
- **PS-147-07.R03** No comment or proposal content is sent through notification channels beyond a reference and a template key.

## Specification

**Data classification**
- PolicyProposal: P0 signed statements.
- PolicyComment: P1 signed statements, pseudonymous author.

**Retention**
- PolicyProposal and decision: RET-EVIDENCE.
- PolicyComment: RET-STANDARD; deleted by the author on request except for audit copy of hidden ones for 1 year (RET-AUDIT).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Operator pushes a harmful rule without notice | mandatory 72 h comment period, expedited path needs reason and co-signer, changelog public, users choose which publishers to trust |
| T02 | Self-approval by one operator | decider must be a different authority key |
| T03 | Equivocation or backdated decision | signatures over JCS, statementCid, conflict detection, decidedAt is a publisher claim and relay receipt time is separate evidence |
| T04 | Comment flooding or harassment | 5 comments per member per proposal, 10 per hour per key, relay moderator can hide, local block applies |
| T05 | Replay of an old approved decision for new targets | verify compares exact targetRefs and the 30-day validity |

**Abuse controls**
- Publisher limit of 20 active proposals; comments rate limited by relay policy.
- Hidden comments carry a reason key shown to the author.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T08 | abuse | PS-147-05.R02, PS-147-07.R03 | non-registered key comments; sixth comment; 11 comments in an hour; moderator hides | relay refuses; GOVERNANCE_COMMENT_LIMIT; RATE_LIMITED; hide affects that relay only |
| TEST-PS-147-09.T12 | abuse | PS-147-07.R01, PS-147-07.R02, PS-147-07.R03 | scan notifications, logs and exports | no comment content in notifications or logs; retention classes as specified; hidden comment kept for audit |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
