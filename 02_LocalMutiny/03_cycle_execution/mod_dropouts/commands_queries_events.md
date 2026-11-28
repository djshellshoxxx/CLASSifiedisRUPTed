# PS-022-04 — Commands, queries and events: Cycle dropouts

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M03 Cycle dropouts](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/dropouts` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-022-04.R01** withdraw is a vault command that produces the signed statement classrup.mutiny.cycle_withdrawal/v1; ingest verifies peers' notices and produces none; evaluate is a vault-local sweep that produces a signed withdrawal only when the principal itself must leave.
- **PS-022-04.R02** Events are written in the same IndexedDB transaction as the records, and statements go to the sync outbox with states prepared, transport_acknowledged and peer_accepted.
- **PS-022-04.R03** The module exposes coarse reasons only to other participants and keeps private reasons local.
- **PS-022-04.R04** Statement schemas and signer roles registered with the F11.S01.M01 registry (N2): classrup.mutiny.cycle_withdrawal/v1 signed by the withdrawing participant, ingest owner this module; declines and revocations use classrup.comms.consent/v1 (ingest owner F08.S02.M02) and arrive as comms.consent.received and comms.consent.revoked; statements from DIDs the principal blocked are dropped silently (N7).
- **PS-022-04.R05** Every event payload carries the participant DIDs that notification routing needs to resolve the remaining participants (N4).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.dropout.withdraw` | mutiny.dropout.withdraw | { cycleId, expectedRevision, reasonCode? } — vault command; produces statement classrup.mutiny.cycle_withdrawal/v1 {cycleId, revisionHash, publicReason} signed by the principal; calls LockPort.releaseForSubject (F02.S03.M02) in the same transaction when the outcome is cancelled | { dropoutId, phase, outcome, cycleStatus, syncState: local_committed \| prepared } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN, MUTINY_DROPOUT_PHASE_CONFLICT | mutiny.cycle.participant_dropped, mutiny.cycle.cancelled | yes (Idempotency-Key) |
| `mutiny.dropout.ingest` | mutiny.dropout.ingest | { envelope: classrup.mutiny.cycle_withdrawal/v1 signed by the withdrawing participant, provenance } — vault command; the only envelope type this module ingests; produces no statement; calls LockPort.releaseForSubject in the same transaction when the outcome is cancelled | { accepted: boolean, dropoutId?, phase?, outcome?, quarantineReason? } | MUTINY_DROPOUT_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED, NOT_FOUND | mutiny.cycle.participant_dropped, mutiny.cycle.cancelled | yes (Idempotency-Key) |
| `mutiny.dropout.evaluate` | mutiny.dropout.evaluate | { cycleId? } — vault-local sweep over non-terminal cycles, also run on vault open for orphan reconciliation (own active locks of terminal cycles are released); produces a signed withdrawal only if the principal's own item or reservation was lost or a local block applies; calls LockPort.releaseForSubject in the same transaction as each cancellation | { evaluated: int, dropouts: { cycleId, participantId, publicReason, outcome }[] } | MUTINY_DROPOUT_NOT_DUE, DEPENDENCY_UNAVAILABLE | mutiny.cycle.participant_dropped, mutiny.cycle.cancelled | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.dropout.list_for_cycle` | mutiny.dropout.read | { cycleId } | { items: DropoutRecord[] — privateReason omitted for peer records } | NOT_FOUND |
| `mutiny.dropout.get` | mutiny.dropout.read | { dropoutId } | { dropout: DropoutRecord } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.cycle.participant_dropped` | P2 | { cycleId, participantId, participantIds (all participants), remainingParticipantIds, publicReason, phase, outcome, evidenceBasis, handoverEvidenceCount, afterConsent } |
| `mutiny.cycle.cancelled` | P2 | { cycleId, participantIds, reason, droppedParticipantIds, releasedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.cycle.proposed` | register the consent deadline timer for the cycle |
| `mutiny.cycle.committed` | register the execution deadline timer for the cycle |
| `mutiny.cycle.declined` | record a before_commit dropout record with public reason withdrew for the decliner; the cycle itself was already declined by F02.S03.M01 |
| `comms.consent.received` | a decline (kind decline, subjectType mutiny_cycle) accepted by F08 for a committed or executing cycle is recorded as a dropout of the decliner with basis signed_by_participant and handled by phase |
| `comms.consent.revoked` | a revocation of a counted mutiny_cycle consent accepted by F08 after this vault committed is recorded as a dropout with public reason withdrew and basis signed_by_participant: before handover the cycle is cancelled and own reservations released in the same transaction, after handover it goes to recovery; before commit F02.S03.M01 voids the consent instead |
| `privacy.deletion.completed` | pseudonymize the erased DID in retained dropout records with the deletion pseudonym; privateReason of own records is purged; signed statements stay verifiable |
| `mutiny.cycle.unlocked` | if the reservation of an active cycle expired or was lost, record a lock_lost dropout for its giver |
| `mutiny.leg.handed_over` | update the evidence count used for phase decisions and stop the cancellation path for this cycle |
| `mutiny.leg.received` | update the evidence count used for phase decisions and stop the cancellation path for this cycle |
| `identity.block.added` | if the blocked DID shares a non-terminal cycle with the principal, withdraw the principal with public reason unavailable and private reason blocked_locally |
| `bazaar.listing.unpublished` | if an own item of an active cycle was unpublished or removed, evaluate item_lost and withdraw the principal |
| `bazaar.listing.expired` | if an own item of an active cycle expired as a listing, evaluate item_lost; the hold normally keeps the listing alive so this is an anomaly |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_DROPOUT_STATEMENT_INVALID | 422 | no | a withdrawal or decline statement failed signature, signer or claimed-time checks |
| MUTINY_DROPOUT_PHASE_CONFLICT | 409 | yes | handover evidence changed while recording; retry evaluates the phase again |
| MUTINY_REROUTE_FORBIDDEN | 422 | no | a request tried to change or substitute cycle participants |
| MUTINY_DROPOUT_NOT_DUE | 409 | no | the timeout deadline has not been reached on the local clock |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# 3-party, Bob withdraws on day 2 before any handover (committed_no_handover)
mutiny.dropout.withdraw { "cycleId":"0192f432-…", "expectedRevision":5 }
-> { "dropoutId":"0192f440-…", "phase":"committed_no_handover", "outcome":"cancelled", "cycleStatus":"cancelled", "syncState":"prepared" }
Alice's and Carol's vaults verify Bob's signed withdrawal, cancel, release their reservations and show 'Bob withdrew - nobody was substituted'.
# 4-party, Dan withdraws after Alice's giver attestation (after_handover)
-> { "phase":"after_handover", "outcome":"partially_executed", "cycleStatus":"executing" }  then F02.S03.M04 opens the RecoveryCase and emits mutiny.cycle.partially_executed
# N-party (6), silence: at consentDeadline on each participant's clock, two missing consents => dropout records basis local_clock, cycle cancelled, no signature produced for the silent people
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-022-09.T01 | integration | PS-022-01.R01, PS-022-03.R01, PS-022-04.R02 | Bob withdraws in committed 3-party cycle before any handover | cancelled in all three vaults, reservations released, exactly one cancelled event per vault |
| TEST-PS-022-09.T06 | integration | PS-022-03.R01, PS-022-04.R03 | 6-party cycle with two silent participants at deadline on local clocks | cycle cancelled with dropout records basis local_clock; no signature produced for the silent ones |
| TEST-PS-022-09.T08 | contract | PS-022-04.R01, PS-022-04.R02, PS-022-09.R02, PS-022-09.R03 | commands, events and statements | outputs validate against classrup.mutiny.dropout_record/v1, cycle_withdrawal/v1 and registry |
| TEST-PS-022-09.T10 | abuse | PS-022-07.R01, PS-022-04.R03 | local block of a participant mid-cycle | principal withdrawn with public reason unavailable; no statement or event reveals the block |
| TEST-PS-022-09.T20 | contract | PS-022-04.R04, PS-022-04.R05 | registry lookup for classrup.mutiny.cycle_withdrawal/v1; payloads of participant_dropped and cancelled | signer role is the withdrawing participant; payloads carry participantIds, remainingParticipantIds and afterConsent |

## Dependencies

Module depends on: F02.S03.M01, F02.S03.M02, F02.S03.M04, F02.S01.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
