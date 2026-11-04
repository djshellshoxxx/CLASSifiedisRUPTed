# PS-021-04 — Commands, queries and events: Cycle consent

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M01 Cycle consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/consent` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-021-04.R01** propose, consent and decline are vault commands that each name the signed statements they produce, and ingest is a vault command that verifies statements from other participants and produces none.
- **PS-021-04.R02** Commit is never a command; it is the local verdict emitted as mutiny.cycle.committed in the transaction that records the final piece of evidence.
- **PS-021-04.R03** Statements go to the sync outbox with states prepared, transport_acknowledged and peer_accepted, and the UI shows no more certainty than the state reached.
- **PS-021-04.R04** Events produced here drive local consumers only; nothing leaves the device except the signed statements.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.cycle.propose` | mutiny.cycle.propose | { suggestionId, consentDeadlineMs? (default 259200000), executionWindowMs? (default 1209600000), settlementCurrency? } — vault command; produces statements classrup.mutiny.proposal_revision/v1 (revision 1), classrup.mutiny.cycle_lock/v1 (coordinator reservation) and classrup.comms.consent/v1 (coordinator consent) | { cycleId, revisionNo: 1, revisionHash, participantIds, consentDeadline, syncState: local_committed \| prepared } | VALIDATION_FAILED, MUTINY_CYCLE_SUGGESTION_UNUSABLE, MUTINY_CYCLE_INFEASIBLE, MUTINY_CYCLE_DEADLINE_INVALID, MUTINY_CYCLE_LIMIT, MUTINY_CYCLE_RESERVATION_FAILED, BLOCKED_PARTY, RATE_LIMITED | mutiny.cycle.proposed | yes (Idempotency-Key) |
| `mutiny.cycle.consent` | mutiny.cycle.consent | { cycleId, revisionHash, acceptedImbalance?, expectedRevision } — vault command; produces statements classrup.mutiny.cycle_lock/v1 (own reservation, if the principal is a giver) and classrup.comms.consent/v1 (consent on revisionHash) signed by the principal | { cycleId, consentId, statementId, localVerdict: awaiting_others \| committed, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, MUTINY_CONSENT_STALE_REVISION, MUTINY_CONSENT_LATE, MUTINY_CYCLE_INFEASIBLE, MUTINY_CYCLE_RESERVATION_FAILED, MUTINY_CYCLE_FROZEN | mutiny.cycle.consent_recorded, mutiny.cycle.committed | yes (Idempotency-Key) |
| `mutiny.cycle.decline` | mutiny.cycle.decline | { cycleId, expectedRevision, reasonCode? } — vault command; produces statement classrup.mutiny.cycle_decline/v1 signed by the principal and releases the principal's reservation | { cycleId, revision, status: declined, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN | mutiny.cycle.declined | yes (Idempotency-Key) |
| `mutiny.cycle.ingest` | mutiny.cycle.ingest | { envelope: classrup.mutiny.proposal_revision/v1 \| classrup.comms.consent/v1 \| classrup.mutiny.cycle_lock/v1 \| classrup.mutiny.cycle_decline/v1, provenance } — vault command; produces no statement | { accepted: boolean, quarantineReason?, localVerdict? } | MUTINY_CONSENT_STATEMENT_INVALID, MUTINY_CONSENT_LATE, MUTINY_CONSENT_STALE_REVISION, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED | mutiny.cycle.proposed, mutiny.cycle.consent_recorded, mutiny.cycle.committed, mutiny.cycle.declined | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.cycle.get` | mutiny.cycle.read | { cycleId } | { cycle: Cycle, consents: CycleConsent[], locks: CycleLock[], feasibility?: FeasibilityReport, awaiting: { actorId, kind: consent\|reservation }[] } | NOT_FOUND |
| `mutiny.cycle.list_mine` | mutiny.cycle.read | { status?, cursor?, limit ≤ 50 } | { items: Cycle[], nextCursor? } |  |
| `mutiny.cycle.explain_verdict` | mutiny.cycle.read | { cycleId } | { committable: boolean, missing: { code, actorId? }[], evaluatedAt, clockBasis: local } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.cycle.proposed` | P2 | { cycleId, origin, suggestionId?, coordinatorId, participantIds, length, revisionNo, revisionHash, consentDeadline } |
| `mutiny.cycle.consent_recorded` | P2 | { cycleId, participantId, revisionNo, revisionHash, direction, status } |
| `mutiny.cycle.committed` | P2 | { cycleId, revisionNo, revisionHash, participantIds, executionDeadline, sourceType, sourceId? } |
| `mutiny.cycle.declined` | P2 | { cycleId, participantId, afterOwnConsent, cycleKey? } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.proposal.accepted` | open a Cycle with origin trade_proposal, id equal to the proposal id, import the two consents and reservations by reference, re-verify and commit |
| `mutiny.proposal.revised` | for cycle subjects set the new head, void every CycleConsent on older hashes, and require the coordinator reservation to be superseded |
| `mutiny.cycle.locked` | record that a giver's reservation is present and re-evaluate the commit verdict |
| `mutiny.cycle.unlocked` | re-evaluate the verdict; a reservation that expired or was released before commit blocks the commit |
| `comms.consent.signed` | verify a peer consent statement for a cycle in this vault, store a CycleConsent and re-evaluate the verdict |
| `mutiny.revision.forked` | freeze the cycle |
| `mutiny.lock.conflict_detected` | freeze the cycles named in the conflict |
| `mutiny.cycle.cancelled` | move proposed or committed cycles to cancelled with the dropout's close reason |
| `mutiny.leg.handed_over` | move committed to executing |
| `mutiny.leg.received` | move committed to executing |
| `mutiny.cycle.completed` | move executing to completed |
| `mutiny.cycle.partially_executed` | move executing to partially_executed |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_CYCLE_SUGGESTION_UNUSABLE | 409 | no | the suggestion is missing, expired, already used or not verified locally |
| MUTINY_CYCLE_INFEASIBLE | 422 | no | feasibility is missing, stale or has a failing check |
| MUTINY_CYCLE_DEADLINE_INVALID | 422 | no | consent deadline or execution window out of range |
| MUTINY_CYCLE_LIMIT | 409 | no | the principal has the maximum number of open cycles and proposals |
| MUTINY_CYCLE_RESERVATION_FAILED | 409 | no | the principal's own items could not be reserved |
| MUTINY_CONSENT_STALE_REVISION | 409 | no | the consent names a hash that is not the head revision |
| MUTINY_CONSENT_STATEMENT_INVALID | 422 | no | the consent statement failed signature, signer, key, subject or statement-key checks |
| MUTINY_CONSENT_LATE | 410 | no | the consent or the local clock is past the consent deadline |
| MUTINY_CYCLE_FROZEN | 409 | no | the cycle is frozen or terminal and accepts no further action |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# Local verdict evaluation (identical rule for every cycle length):
#   commit iff status = proposed AND localNow <= consentDeadline
#     AND for every participant p: valid CycleConsent(p, headHash) with signedAtClaim, receivedAtLocal, relayReceiptAt <= consentDeadline
#     AND for every giver g: active unexpired CycleLock(g, headHash) with expiresAt >= consentDeadline + executionWindowMs
#     AND FeasibilityReport fresh (<= 10 min) and not infeasible AND no fork or conflicting promise flag.
#
# 2-party (origin trade_proposal): Alice and Bob consent on hash H1; cycle opens already committed in each vault that holds both consents + 2 reservations.
# 3-party: Alice (coordinator) proposes at T0; Bob signs T0+2h; Carol signs T0+30h; deadline T0+72h => Alice's, Bob's and Carol's vaults commit when the last of 3 consents and 3 reservations is verified there.
# 4-party: Alice, Bob, Carol signed; Dan's consent signedAtClaim T0+71h59m but received at Alice's vault T0+72h05m => late at Alice's vault: no commit, cycle expires there;
#          Dan's own vault may show 'waiting', which is truthful: nobody is bound, and Alice's reservation is released at the deadline.
# N-party (8): all 8 consents and 8 reservations are required; 7 of 8 never commits.
mutiny.cycle.propose  Idempotency-Key: 0192f430-0000-7000-8000-000000000001
{ "suggestionId": "0192f431-…", "consentDeadlineMs": 259200000 }
-> 201 { "cycleId": "0192f432-…", "revisionNo": 1, "revisionHash": "sha256-Zk8…", "participantIds": ["did:key:z6MkAlice","did:key:z6MkBob","did:key:z6MkCarol"], "syncState": "prepared" }
mutiny.cycle.consent { "cycleId": "0192f432-…", "revisionHash": "sha256-Zk8…", "expectedRevision": 2 }   # on Bob's device
-> 200 { "consentId": "0192f433-…", "localVerdict": "awaiting_others", "syncState": "prepared" }
Consent statement (F08.S02.M02) signed by Bob: { "signer":"did:key:z6MkBob", "subject":{"type":"cycle","id":"0192f432-…"}, "revisionHash":"sha256-Zk8…", "statementKey":"mutiny.cycle.consent.v1", "sig":"…" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-021-09.T01 | integration | PS-021-01.R01, PS-021-03.R01, PS-021-04.R03 | 3-party happy path across three vaults | each vault commits after verifying 3 consents and 3 reservations; committed event carries executionDeadline |
| TEST-PS-021-09.T05 | integration | PS-021-03.R02, PS-021-04.R02, PS-021-01.R03 | coordinator revises after two consents | all consents void, reservations superseded, only the coordinator can revise, participant change refused |
| TEST-PS-021-09.T10 | contract | PS-021-04.R01, PS-021-04.R04, PS-021-09.R02, PS-021-09.R04 | all commands and ingest | outputs, events and statements validate against classrup.mutiny.cycle/v1, cycle_consent/v1, cycle_decline/v1, and registry; sync states advance only when acknowledged |

## Dependencies

Module depends on: F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
