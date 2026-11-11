# PS-024-07 — Privacy, retention and abuse: Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M04 Cycle execution and recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-024-07.R01** Attestations, notes and evidence photos are P2, end-to-end encrypted in transit to the participants, and never published; photos are re-encoded with metadata stripped before attaching.
- **PS-024-07.R02** Evidence is retained for RET-EVIDENCE and pseudonymized, not deleted, if a participant erases their identity locally.
- **PS-024-07.R03** False attestations and issue reports are limited by signature accountability, the 48 h and giver-attestation rules for issues, and by disputes that compare signed statements.
- **PS-024-07.R04** The UI states that signatures evidence what each person asserts and that ClassRup does not verify delivery.
- **PS-024-07.R05** The module registers ExportSectionPort (section mutiny.execution), DeletionPort and RetentionPurgePort with F10 (N6), annotates every HandoverAttestation and RecoveryCase field with its F10.S02.M02 class, reports every open or escalated RecoveryCase as a DeletionPort.plan() blocker {kind: cycle, ref: cycleId, counterparties: the other participantIds}, and on privacy.deletion.completed pseudonymizes the erased participant in retained evidence.

## Specification

**Data classification**
- HandoverAttestation: P2; note and evidenceRefs may contain personal content and are never indexed.
- RecoveryCase: P2; option amounts are claims between participants; field classes annotated per F10.S02.M02.

**Retention**
- RET-EVIDENCE 2 years after the last related activity; evidence attachments follow the attachment retention of F08.S01.M03.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Receiver falsely claims not received to keep the item and the compensation | issue_reported is a signed claim visible to the giver and the dispute process; the giver's handed_over is separate evidence and nothing is auto-resolved |
| T02 | Giver falsely claims handed over to force recovery or compensation | the receiver can attest nothing and the case needs agreement or a dispute; compensation is a claim acknowledged only by the payee |
| T03 | Forged attestation attributed to a participant | Ed25519 signature must verify against that DID's registered non-revoked key |
| T04 | Replay of an old attestation on another leg or cycle | the signed envelope names cycle, leg and items; mismatches are rejected |
| T05 | Photo evidence leaks location | attachments are re-encoded and rejected if GPS or EXIF location remains (PRV-4) |
| T06 | Backdated claimedAt to defeat the 48 h rule | the rule uses the local commit time and local receive time, never the claim |
| T07 | Automatic reroute of leftover legs after partial execution | none exists; recovery options are only return, compensation, waive and dispute between the existing participants |
| T08 | Majority of an N-party cycle settles a leg against its own giver or receiver | requiredSignerIds per option and V12: a leg disposition needs that leg's giver and receiver or an outcome they acknowledged |

**Abuse controls**
- Limits of 6 attestations per leg, 64 per cycle and 12 options per case.
- Recipients quarantine DIDs that send more than 30 execution statements per hour.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-024-09.T11 | abuse | PS-024-05.R01, PS-024-05.R02, PS-024-05.R03, PS-024-07.R03 | forged attestation, wrong-role signer, replay on another leg, relay attempts to mark received | quarantined or FORBIDDEN; relay cannot alter any state |
| TEST-PS-024-09.T14 | abuse | PS-024-07.R03 | issue reported before giver attestation and within 48 h; backdated claimedAt | MUTINY_ISSUE_NOT_ALLOWED; claim ignored for rules |
| TEST-PS-024-09.T15 | abuse | PS-024-07.R01 | photo with GPS metadata attached | rejected; stripped re-encoded photo accepted |
| TEST-PS-024-09.T16 | integration | PS-024-07.R03, PS-024-03.R04 | late handed_over arrives after cycle cancelled | cycle stays cancelled and standalone recovery case opens |
| TEST-PS-024-09.T19 | e2e | PS-024-07.R04 | two mobile browsers perform hand-over attestations | statement of what a signature means shown; payment labels as text; axe zero serious issues |
| TEST-PS-024-09.T21 | integration | PS-024-07.R02, PS-024-07.R05 | Carol erases her identity after a completed cycle; F10 export, deletion and retention sweep | section mutiny.execution exported; Carol's DID pseudonymized in attestations and cases; records retained; every signature and the completionCid still verify |
| TEST-PS-024-09.T22 | integration | PS-024-01.R03, PS-024-07.R01 | relay fixture records every mailbox put during attestations and recovery actions | mailbox contents are ciphertext only and metadata is limited to recipient mailbox id, size and time |
| TEST-PS-024-09.T28 | integration | PS-024-07.R05 | F10 deletion plan with an open RecoveryCase on C4, an escalated one on C6 and a resolved one on C3 | plan() lists blockers {kind: cycle, ref: C4} and {kind: cycle, ref: C6} with the other participants as counterparties; the resolved case is not a blocker |

## Dependencies

Module depends on: F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F15.S02.M03, F10.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
