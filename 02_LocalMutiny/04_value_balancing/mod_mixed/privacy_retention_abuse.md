# PS-026-07 — Privacy, retention and abuse: Mixed-value compensation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M01 Mixed-value compensation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/mixed` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-026-07.R01** Legs, claims and references are P2, end-to-end encrypted in transit to the participants and never published; claimRef is free text and never indexed.
- **PS-026-07.R02** The platform never holds funds or keys and the UI states 'Payments happen between you and the other person. ClassRup holds no money.'
- **PS-026-07.R03** False claims and false acknowledgements are limited by signature accountability, payee-only acknowledgement and disputes.
- **PS-026-07.R04** The module registers ExportSectionPort (section mutiny.compensation), DeletionPort and RetentionPurgePort with F10 (N6), annotates every CompensationLeg field with its F10.S02.M02 class, reports every leg with status due, claimed or disputed in which the principal is payer or payee as a DeletionPort.plan() blocker {kind: deal, ref: the leg's dealId, counterparties: [the other party of the leg]}, and on privacy.deletion.completed pseudonymizes the erased party in retained legs.

## Specification

**Data classification**
- CompensationLeg: P2; claimRef may contain a transaction reference and is P2; field classes annotated per F10.S02.M02.

**Retention**
- RET-EVIDENCE 2 years after last related activity; payment claim records follow F09 retention.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Payer falsely claims payment to complete the cycle | completion needs payee acknowledgement (cash, external) or chain finality (crypto); a claim alone never settles |
| T02 | Payee falsely denies receiving | payee can dispute or never acknowledge; the claim, signature and timestamps are evidence; no automatic outcome |
| T03 | Plan manipulated to favor one participant | planner is deterministic and every participant consents to exact amounts on the revision hash |
| T04 | Crypto auto-confirmed without finality | no auto-confirmation; claims stay claimed without a chain verifier (COM-5) |
| T05 | Platform seen as escrow | no custody anywhere; UI copy and absence of any fund-holding feature tested |

**Abuse controls**
- At most N minus 1 money legs per subject and 12 legs per vault per day.
- Claim rate limit 20 per day per vault.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-026-09.T11 | abuse | PS-026-07.R03, PS-026-07.R02 | payer claims falsely, payee disputes | disputed state, dispute outcome required; no custody feature exists in UI or API |
| TEST-PS-026-09.T12 | unit | PS-026-03.R03, PS-026-07.R02 | leg without progress for 14 days with injected clock | expired and not counted as settled |
| TEST-PS-026-09.T15 | e2e | PS-026-01.R04, PS-026-07.R02 | mobile payer and payee flow | status labels as text; notice that no funds are held; axe zero serious issues |
| TEST-PS-026-09.T20 | integration | PS-026-07.R01, PS-026-01.R02 | relay fixture records every mailbox put during claim and Deal statements | mailbox contents are ciphertext only and metadata is limited to recipient mailbox id, size and time |
| TEST-PS-026-09.T23 | integration | PS-026-07.R04 | F10 export, deletion and retention sweep | section mutiny.compensation exported; erased DID pseudonymized and claimRef purged in retained legs |
| TEST-PS-026-09.T24 | integration | PS-026-07.R04, PS-026-03.R04 | F10 deletion plan with a due leg Dan to Alice, a claimed leg Alice to Bob, a settled leg and a proposed leg | plan() of Alice's vault lists exactly two blockers {kind: deal, ref: dealId} with counterparties [Dan] and [Bob]; settled and proposed legs are not blockers; after acknowledgement the claimed leg is no longer a blocker |

## Dependencies

Module depends on: F02.S04.M02, F02.S04.M03, F02.S02.M03, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
