# PS-024-04 — Commands, queries and events: Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M04 Cycle execution and recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-024-04.R01** attest and the recovery commands propose_option, respond and escalate are vault commands that name the signed statements they produce; ingest commands verify other participants' statements and produce none.
- **PS-024-04.R02** Events are written in the same IndexedDB transaction as the records, and statements go to the sync outbox with states prepared, transport_acknowledged and peer_accepted.
- **PS-024-04.R03** Completion and partial execution are local verdicts emitted as events, not commands and not signed facts.
- **PS-024-04.R04** Statement schemas and signer roles registered with the F11.S01.M01 registry (N2): classrup.mutiny.handover_attestation/v1 signed by the leg's giver (handed_over, returned), receiver (received, issue_reported) or original giver (return_confirmed); classrup.mutiny.recovery_action/v1 signed by a participant, accept counted only from requiredSignerIds; this module is the single ingest owner of both and drops statements from DIDs the principal blocked silently (N7).
- **PS-024-04.R05** Completion and recovery events carry contextId, completionCid, parties [{did, role}] and legs [{legId, giverId, receiverId}] (N3), and every event carries the participant DIDs that notification routing needs (N4).
- **PS-024-04.R06** The module registers the F09.S02.M02 DisputeContextPort resolver for context type cycle (inverted registration; F09.S02.M02 never depends on F02): resolve({type: cycle, id: cycleId}) returns parties = the cycle's participantIds as [{did, role: participant}] and contextCid = the head revisionHash the cycle was committed on, read from F02.S03.M01, and returns unknown when the cycle is not stored in this vault or was never committed here and has no RecoveryCase; escalate always names contextRef {type: cycle, id: cycleId}, and dispute events are matched by that contextRef.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.attestation.attest` | mutiny.attestation.attest | { cycleId, legId, kind: handed_over\|received\|issue_reported\|returned\|return_confirmed, items?, issueCode?, note?, evidenceRefs? } — vault command; produces statement classrup.mutiny.handover_attestation/v1 signed by the principal | { attestationId, cid, cycleStatus, legStatus, syncState: local_committed \| prepared } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED, MUTINY_ATTESTATION_NOT_ALLOWED, MUTINY_ATTESTATION_ROLE_INVALID, MUTINY_ATTESTATION_ITEMS_MISMATCH, MUTINY_ATTESTATION_DUPLICATE, MUTINY_ISSUE_NOT_ALLOWED | mutiny.leg.handed_over, mutiny.leg.received, mutiny.cycle.completed, mutiny.cycle.partially_executed, mutiny.recovery.opened | yes (Idempotency-Key) |
| `mutiny.attestation.ingest` | mutiny.attestation.ingest | { envelope: classrup.mutiny.handover_attestation/v1, provenance } — vault command; produces no statement | { accepted: boolean, attestationId?, cycleStatus?, quarantineReason? } | MUTINY_ATTESTATION_STATEMENT_INVALID, MUTINY_ATTESTATION_ROLE_INVALID, MUTINY_ATTESTATION_DUPLICATE, MUTINY_ATTESTATION_NOT_ALLOWED, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED | mutiny.leg.handed_over, mutiny.leg.received, mutiny.cycle.completed, mutiny.cycle.partially_executed, mutiny.recovery.opened | yes (Idempotency-Key) |
| `mutiny.recovery.propose_option` | mutiny.recovery.propose_option | { recoveryCaseId, kind: return_item\|compensation\|waive\|dispute, legId?, compensation?: { payerId, payeeId, amount: Money }, lossBearerId? (waive), expectedRevision } — vault command; derives requiredSignerIds; produces statement classrup.mutiny.recovery_action/v1 (action propose, requiredSignerIds) signed by the principal; a compensation option proposes a CompensationLeg (subjectType recovery_case) through F02.S04.M01 | { recoveryCaseId, optionId, revision, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_RECOVERY_OPTION_INVALID |  | yes (Idempotency-Key) |
| `mutiny.recovery.respond` | mutiny.recovery.respond | { recoveryCaseId, optionId, decision: accept\|reject, expectedRevision } — vault command; produces statement classrup.mutiny.recovery_action/v1 (action accept or reject) signed by the principal; when the last requiredSignerId of a compensation option accepts, calls mutiny.compensation.activate (F02.S04.M01) in the same transaction | { recoveryCaseId, optionId, status, caseStatus, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_RECOVERY_ROLE_INVALID, MUTINY_RECOVERY_DISPOSITION_UNSIGNED | mutiny.recovery.resolved | yes (Idempotency-Key) |
| `mutiny.recovery.escalate` | mutiny.recovery.escalate | { recoveryCaseId, summary ≤ 1000 code points, expectedRevision } — vault command; calls commerce.dispute.open {contextRef {type: cycle, id: cycleId}, reason (issueCode not_received, not_as_described or damaged as damage; other for dropouts and timeouts), description: summary, respondentIds (default the other parties from the cycle resolver), evidence: the signed attestation and recovery action cids, idempotencyRef: recoveryCaseId}, which produces classrup.commerce.dispute/v1 signed by the principal | { recoveryCaseId, disputeCaseId, caseStatus: escalated, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE, COMMERCE_DISPUTE_CONTEXT_INVALID, COMMERCE_DISPUTE_DUPLICATE |  | yes (Idempotency-Key) |
| `mutiny.recovery.ingest` | mutiny.recovery.ingest | { envelope: classrup.mutiny.recovery_action/v1, provenance } — vault command; produces no statement | { accepted: boolean, recoveryCaseId?, quarantineReason? } | MUTINY_ATTESTATION_STATEMENT_INVALID, MUTINY_RECOVERY_ROLE_INVALID, MUTINY_RECOVERY_OPTION_INVALID, MUTINY_RECOVERY_DISPOSITION_UNSIGNED, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED | mutiny.recovery.resolved | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.attestation.list_for_cycle` | mutiny.attestation.read | { cycleId } | { items: HandoverAttestation[], legSummary: { legId, handedOver, received, issue }[] } | NOT_FOUND |
| `mutiny.recovery.get` | mutiny.recovery.read | { recoveryCaseId } | { case: RecoveryCase, cycleStatus, availableOptions: string[] } | NOT_FOUND |
| `mutiny.recovery.list_mine` | mutiny.recovery.read | { status?, cursor?, limit ≤ 50 } | { items: RecoveryCase[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.leg.handed_over` | P2 | { cycleId, legId, giverId, receiverId, participantIds, attestationId, attestationCid, direction } |
| `mutiny.leg.received` | P2 | { cycleId, legId, giverId, receiverId, participantIds, attestationId, attestationCid, inventoryItemIds, direction } |
| `mutiny.cycle.completed` | P2 | { cycleId, contextId (equals cycleId), contextType cycle, completionCid, receiptCids[], revisionHash, parties [{did, role: participant}], participantIds, legs [{legId, giverId, receiverId}] (giverId and receiverId are DIDs, ring order), completedAtLocal, compensationSettled } |
| `mutiny.cycle.partially_executed` | P2 | { cycleId, participantIds, trigger, handedOverLegIds, receivedLegIds, pendingLegIds, recoveryCaseId } |
| `mutiny.recovery.opened` | P2 | { recoveryCaseId, cycleId, participantIds, trigger, deadlineAt } |
| `mutiny.recovery.resolved` | P2 | { recoveryCaseId, cycleId, contextId (equals cycleId), participantIds, parties [{did, role}], legs [{legId, giverId, receiverId}], outcome agreed\|dispute_outcome\|unresolved, dispositions, reviewUnlock { unlocked: true, disputeFlag: boolean (true for dispute_outcome and unresolved), evidenceCids[] } } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.cycle.committed` | enable attestations for the cycle and record the local commit time used by the 48 h issue rule |
| `mutiny.cycle.participant_dropped` | when outcome is partially_executed, open a RecoveryCase and emit partially_executed; when cancelled, do nothing |
| `mutiny.cycle.cancelled` | stop accepting handed_over and received; later attestations open a late_attestation recovery case |
| `mutiny.compensation.settled` | mark the compensation leg settled and re-evaluate completion |
| `commerce.payment.disputed` | if the payment belongs to a compensation leg of an executing cycle, open or update a recovery case with a compensation dispute |
| `commerce.dispute.opened` | link disputeCaseId to the escalated recovery case when contextRef is {type: cycle, id: cycleId} of the case |
| `commerce.dispute.resolved` | for contextRef {type: cycle, id: cycleId} of this cycle: resolve an escalated case with outcome dispute_outcome and record dispositions that both parties of each leg acknowledged; resolution lapsed closes the case as unresolved |
| `commerce.dispute.withdrawn` | return the escalated recovery case whose disputeCaseId and contextRef {type: cycle, id: cycleId} match to open |
| `privacy.deletion.completed` | pseudonymize the erased DID in retained attestations and cases with the deletion pseudonym and drop notes and evidence references of the erased author; signed statements stay verifiable |

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
| MUTINY_RECOVERY_ROLE_INVALID | 403 | no | the signer is not one of the required signers who may respond to this option |
| MUTINY_RECOVERY_DISPOSITION_UNSIGNED | 409 | no | a leg disposition lacks the signed acceptance of that leg's giver and receiver or an acknowledged dispute outcome |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# 3-party cycle Alice->Bob (lamp), Bob->Carol (desk), Carol->Alice (chair); all handovers happen in person
mutiny.attestation.attest { "cycleId":"0192f432-…", "legId":"L0", "kind":"handed_over" }       # Alice's device; signed by Alice
mutiny.attestation.attest { "cycleId":"0192f432-…", "legId":"L0", "kind":"received" }          # Bob's device; signed by Bob  -> mutiny.leg.received
... after L1 and L2 are received in the viewing vault: mutiny.cycle.completed { "contextId": "0192f432-…", "completionCid": "sha256-Cc1…", "receiptCids": ["sha256-R0…","sha256-R1…","sha256-R2…"],
    "parties": [{"did":"did:key:z6MkAlice","role":"participant"}, …], "legs": [{"legId":"L0","giverId":"did:key:z6MkAlice","receiverId":"did:key:z6MkBob"}, …], "compensationSettled": true }
# completionCid = cid(JCS({cycleId, revisionHash, receipts: sorted receipt cids, settlements: []})), recomputable by every participant
# 4-party: Dan drops after Alice's handed_over => RecoveryCase options: return_item (Bob returns Alice's item), compensation (Dan's leg paid by Dan 80.00 EUR), waive, dispute
mutiny.recovery.propose_option { "recoveryCaseId":"0192f450-…", "kind":"return_item", "legId":"L0", "expectedRevision":1 }   # requiredSignerIds = [Alice (giver of L0), Bob (receiver of L0)]
mutiny.recovery.respond { "recoveryCaseId":"0192f450-…", "optionId":"opt-1", "decision":"accept", "expectedRevision":2 }   # Bob; accepted once Alice also signed accept
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
| TEST-PS-024-09.T24 | contract | PS-024-04.R04, PS-024-04.R05, PS-024-01.R05 | completion and recovery events against the registry | completed carries contextId, completionCid recomputed independently from the receipt cids, parties and legs; opened, partially_executed and resolved carry participantIds; registry signer roles match |
| TEST-PS-024-09.T25 | integration | PS-024-03.R03, PS-024-04.R05 | escalated case: dispute withdrawn, then re-escalated and lapsed; separate open case without activity for 30 days | escalated -> open on commerce.dispute.withdrawn; closed_unresolved on lapsed; both resolved events carry reviewUnlock with disputeFlag true |
| TEST-PS-024-09.T27 | contract | PS-024-04.R06, PS-024-03.R03 | F09.S02.M02 DisputeContextPort conformance for type cycle on C4 (committed), an unknown cycle id and a proposed cycle without RecoveryCase; then escalate C4's case twice | resolve returns the four participants with role participant and contextCid equal to the committed revisionHash; unknown for the other two; commerce.dispute.open is called with contextRef {type: cycle, id: C4}, reason not_received, evidence cids and idempotencyRef recoveryCaseId, and the repeat returns the same case; commerce.dispute.resolved for that contextRef resolves the case |

## Dependencies

Module depends on: F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F15.S02.M03, F10.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
