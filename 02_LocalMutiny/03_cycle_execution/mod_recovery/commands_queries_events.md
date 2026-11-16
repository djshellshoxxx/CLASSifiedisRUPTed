# PS-024-04 — Commands, queries and events: Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M04 Cycle execution and recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-024-04.R01** attest and the recovery commands propose_option, respond and escalate are vault commands that name the signed statements they produce; ingest commands verify other participants' statements and produce none.
- **PS-024-04.R02** Events are written in the same IndexedDB transaction as the records, and statements go to the sync outbox with states prepared, transport_acknowledged and peer_accepted.
- **PS-024-04.R03** Completion and partial execution are local verdicts emitted as events, not commands and not signed facts.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.attestation.attest` | mutiny.attestation.attest | { cycleId, legId, kind: handed_over\|received\|issue_reported\|returned\|return_confirmed, items?, issueCode?, note?, evidenceRefs? } — vault command; produces statement classrup.mutiny.handover_attestation/v1 signed by the principal | { attestationId, cid, cycleStatus, legStatus, syncState: local_committed \| prepared } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED, MUTINY_ATTESTATION_NOT_ALLOWED, MUTINY_ATTESTATION_ROLE_INVALID, MUTINY_ATTESTATION_ITEMS_MISMATCH, MUTINY_ATTESTATION_DUPLICATE, MUTINY_ISSUE_NOT_ALLOWED | mutiny.leg.handed_over, mutiny.leg.received, mutiny.cycle.completed, mutiny.cycle.partially_executed, mutiny.recovery.opened | yes (Idempotency-Key) |
| `mutiny.attestation.ingest` | mutiny.attestation.ingest | { envelope: classrup.mutiny.handover_attestation/v1, provenance } — vault command; produces no statement | { accepted: boolean, attestationId?, cycleStatus?, quarantineReason? } | MUTINY_ATTESTATION_STATEMENT_INVALID, MUTINY_ATTESTATION_ROLE_INVALID, MUTINY_ATTESTATION_DUPLICATE, MUTINY_ATTESTATION_NOT_ALLOWED, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED | mutiny.leg.handed_over, mutiny.leg.received, mutiny.cycle.completed, mutiny.cycle.partially_executed, mutiny.recovery.opened | yes (Idempotency-Key) |
| `mutiny.recovery.propose_option` | mutiny.recovery.propose_option | { recoveryCaseId, kind: return_item\|compensation\|waive\|dispute, legId?, compensation?: { payerId, amount: Money }, expectedRevision } — vault command; produces statement classrup.mutiny.recovery_action/v1 (action propose) signed by the principal | { recoveryCaseId, optionId, revision, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_RECOVERY_OPTION_INVALID |  | yes (Idempotency-Key) |
| `mutiny.recovery.respond` | mutiny.recovery.respond | { recoveryCaseId, optionId, decision: accept\|reject, expectedRevision } — vault command; produces statement classrup.mutiny.recovery_action/v1 (action accept or reject) signed by the principal | { recoveryCaseId, optionId, status, caseStatus, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_RECOVERY_ROLE_INVALID | mutiny.recovery.resolved | yes (Idempotency-Key) |
| `mutiny.recovery.escalate` | mutiny.recovery.escalate | { recoveryCaseId, summary ≤ 1000 code points, expectedRevision } — vault command; produces the dispute-opening statement defined by F09.S02.M02 with an evidence bundle of signed attestations | { recoveryCaseId, disputeCaseId, caseStatus: escalated, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `mutiny.recovery.ingest` | mutiny.recovery.ingest | { envelope: classrup.mutiny.recovery_action/v1, provenance } — vault command; produces no statement | { accepted: boolean, recoveryCaseId?, quarantineReason? } | MUTINY_ATTESTATION_STATEMENT_INVALID, MUTINY_RECOVERY_ROLE_INVALID, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED | mutiny.recovery.resolved | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.attestation.list_for_cycle` | mutiny.attestation.read | { cycleId } | { items: HandoverAttestation[], legSummary: { legId, handedOver, received, issue }[] } | NOT_FOUND |
| `mutiny.recovery.get` | mutiny.recovery.read | { recoveryCaseId } | { case: RecoveryCase, cycleStatus, availableOptions: string[] } | NOT_FOUND |
| `mutiny.recovery.list_mine` | mutiny.recovery.read | { status?, cursor?, limit ≤ 50 } | { items: RecoveryCase[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.leg.handed_over` | P2 | { cycleId, legId, giverId, receiverId, attestationId, direction } |
| `mutiny.leg.received` | P2 | { cycleId, legId, giverId, receiverId, attestationId, inventoryItemIds, direction } |
| `mutiny.cycle.completed` | P2 | { cycleId, participantIds, completedAtLocal, compensationSettled } |
| `mutiny.cycle.partially_executed` | P2 | { cycleId, trigger, handedOverLegIds, receivedLegIds, pendingLegIds, recoveryCaseId } |
| `mutiny.recovery.opened` | P2 | { recoveryCaseId, cycleId, trigger, deadlineAt } |
| `mutiny.recovery.resolved` | P2 | { recoveryCaseId, cycleId, outcome, dispositions } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.cycle.committed` | enable attestations for the cycle and record the local commit time used by the 48 h issue rule |
| `mutiny.cycle.participant_dropped` | when outcome is partially_executed, open a RecoveryCase and emit partially_executed; when cancelled, do nothing |
| `mutiny.cycle.cancelled` | stop accepting handed_over and received; later attestations open a late_attestation recovery case |
| `mutiny.compensation.settled` | mark the compensation leg settled and re-evaluate completion |
| `commerce.payment.disputed` | if the payment belongs to a compensation leg of an executing cycle, open or update a recovery case with a compensation dispute |
| `commerce.dispute.opened` | link disputeCaseId to the escalated recovery case when the context ref matches |
| `commerce.dispute.resolved` | resolve an escalated recovery case with outcome dispute_outcome and record dispositions from the decision |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_ATTESTATION_NOT_ALLOWED | 409 | no | the cycle state or recovery state does not allow this attestation kind |
| MUTINY_ATTESTATION_ROLE_INVALID | 403 | no | the signer does not have the required role on this leg |
| MUTINY_ATTESTATION_STATEMENT_INVALID | 422 | no | the attestation or recovery statement failed signature, key or claimed-time checks |
| MUTINY_ATTESTATION_ITEMS_MISMATCH | 422 | no | items do not match the leg |
| MUTINY_ATTESTATION_DUPLICATE | 409 | no | a valid attestation of this kind already exists for the leg |
| MUTINY_ISSUE_NOT_ALLOWED | 409 | no | an issue cannot be reported before the giver's attestation or 48 hours after commit |
| MUTINY_RECOVERY_OPTION_INVALID | 422 | no | the recovery option is not valid for this case |
| MUTINY_RECOVERY_ROLE_INVALID | 403 | no | the signer is not the counterparty who may respond to this option |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# 3-party cycle Alice->Bob (lamp), Bob->Carol (desk), Carol->Alice (chair); all handovers happen in person
mutiny.attestation.attest { "cycleId":"0192f432-…", "legId":"L0", "kind":"handed_over" }       # Alice's device; signed by Alice
mutiny.attestation.attest { "cycleId":"0192f432-…", "legId":"L0", "kind":"received" }          # Bob's device; signed by Bob  -> mutiny.leg.received
... after L1 and L2 are received in the viewing vault: mutiny.cycle.completed { "compensationSettled": true }
# 4-party: Dan drops after Alice's handed_over => RecoveryCase options: return_item (Bob returns Alice's item), compensation (Dan's leg paid by Dan 80.00 EUR), waive, dispute
mutiny.recovery.propose_option { "recoveryCaseId":"0192f450-…", "kind":"return_item", "legId":"L0", "expectedRevision":1 }
mutiny.recovery.respond { "recoveryCaseId":"0192f450-…", "optionId":"opt-1", "decision":"accept", "expectedRevision":2 }
# N-party (6): same rules; completion needs 6 receiver attestations; any issue_reported opens one case for the whole cycle.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-024-09.T01 | integration | PS-024-01.R01, PS-024-03.R01, PS-024-04.R03 | 3-party cycle with all handed_over and received attestations delivered | each vault emits leg.received per leg and completed after the third receipt |
| TEST-PS-024-09.T05 | integration | PS-024-03.R02, PS-024-04.R03 | Dan drops in 4-party cycle after Alice's handed_over | cycle partially_executed, one RecoveryCase opened, no cancellation, no reroute |
| TEST-PS-024-09.T08 | integration | PS-024-03.R03, PS-024-04.R01 | escalate case to dispute and resolve via commerce.dispute.resolved | outcome dispute_outcome and recovery.resolved emitted once |
| TEST-PS-024-09.T10 | contract | PS-024-04.R01, PS-024-04.R02, PS-024-09.R02 | all commands and events | statements and payloads validate against classrup.mutiny.handover_attestation/v1, recovery_case/v1, recovery_action/v1 and registry; sync states advance only when acknowledged |
| TEST-PS-024-09.T13 | integration | PS-024-06.R04, PS-024-04.R03 | compensation acknowledged after items received | completion occurs at acknowledgement, not before; offline attestations delivered later |

## Dependencies

Module depends on: F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
