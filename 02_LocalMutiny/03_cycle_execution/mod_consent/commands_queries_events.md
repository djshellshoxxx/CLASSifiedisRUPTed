# PS-021-04 — Commands, queries and events: Cycle consent

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M01 Cycle consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/consent` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-021-04.R01** propose, consent and decline are vault commands that each name the signed statements they produce; this module ingests no envelope type and reacts only to the events of each statement type's single ingest owner (F08.S02.M02 consents, declines and revocations; F02.S03.M02 reservations; F02.S01.M04 revisions; F02.S03.M03 withdrawals).
- **PS-021-04.R02** Commit is never a command; it is the local verdict emitted as mutiny.cycle.committed in the transaction that records the final piece of evidence.
- **PS-021-04.R03** Statements go to the sync outbox with states prepared, transport_acknowledged and peer_accepted, and the UI shows no more certainty than the state reached.
- **PS-021-04.R04** Events produced here drive local consumers only; nothing leaves the device except the signed statements.
- **PS-021-04.R05** Statement schemas and signer roles registered with the F11.S01.M01 registry (N2): consents and declines use classrup.comms.consent/v1 (subjectType mutiny_cycle, key consent.mutiny.cycle.commit.v1) signed by a cycle participant, ingest owner F08.S02.M02; reservations use classrup.bazaar.reservation/v1 signed by the item owner, ingest owner F02.S03.M02; revisions use classrup.mutiny.proposal_revision/v1 signed by the coordinator, ingest owner F02.S01.M04; classrup.mutiny.cycle/v1 and classrup.mutiny.cycle_consent/v1 are local records and are never sent. Statements from DIDs the principal blocked are dropped silently by their owners (N7).
- **PS-021-04.R06** Every event payload carries the participant DIDs (participantIds or parties) that notification routing needs to resolve recipients (N4).
- **PS-021-04.R07** mutiny.cycle.committed carries legs [{legId, giverId, receiverId}] in ring order, giverId and receiverId being DIDs as in mutiny.cycle.completed, together with parties [{did, role}] and revisionHash, which consumers use as contextCid, so F07.S03.M01 issues review tickets only to leg-connected counterparties.
- **PS-021-04.R08** The module registers the F08.S02.M02 SubjectCanonicalizerPort for subjectType mutiny_cycle (inverted registration; F08.S02.M02 never depends on F02): canonicalBytes(cycleId, rev) returns F02.S01.M04 canonicalBytes of the cycle's revision chain (subjectType cycle, or trade_proposal for origin trade_proposal); currentRevision(cycleId) returns {revisionNo: headRevisionNo, revisionHash: headRevisionHash}; partyRole(cycleId, did) returns participant for a DID in participantIds and none otherwise; isCommitted(cycleId) is true once this vault's verdict reached committed (committedLocallyAt set). It reads comms.consent.signed and comms.consent.received with the N13 field names subjectType, subjectRef, subjectRevision, subjectRevisionHash (ID-3 cid), statementKey, statementLocale, kind and aliasOf, and a received record with aliasOf is attached to the kept consent it names and never counted twice.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.cycle.propose` | mutiny.cycle.propose | { suggestionId, consentDeadlineMs? (default 259200000), executionWindowMs? (default 1209600000), settlementCurrency?, confirmKeyLinked? } — vault command; produces statements classrup.mutiny.proposal_revision/v1 (revision 1, via F02.S01.M04), classrup.bazaar.reservation/v1 (coordinator reservation, holder {type: cycle, id: cycleId}, via F02.S03.M02) and classrup.comms.consent/v1 (comms.consent.sign kind consent, subjectType mutiny_cycle, statementKey consent.mutiny.cycle.commit.v1, subjectRevision 1, subjectRevisionHash = the revision contentHash cid, statementLocale of the shown wording) | { cycleId, revisionNo: 1, revisionHash, participantIds, consentDeadline, syncState: local_committed \| prepared } | VALIDATION_FAILED, MUTINY_CYCLE_SUGGESTION_UNUSABLE, MUTINY_CYCLE_INFEASIBLE, MUTINY_CYCLE_DEADLINE_INVALID, MUTINY_CYCLE_LIMIT, MUTINY_CYCLE_RESERVATION_FAILED, MUTINY_RING_KEY_LINKED, MUTINY_PARTICIPANT_OVERLOADED, BLOCKED_PARTY, RATE_LIMITED | mutiny.cycle.proposed | yes (Idempotency-Key) |
| `mutiny.cycle.consent` | mutiny.cycle.consent | { cycleId, revisionNo, revisionHash, expectedRevision } — vault command; produces classrup.bazaar.reservation/v1 (own reservation through F02.S03.M02, if the principal is a giver) and classrup.comms.consent/v1 (comms.consent.sign kind consent, subjectType mutiny_cycle, statementKey consent.mutiny.cycle.commit.v1, subjectRevision headRevisionNo, subjectRevisionHash = headRevisionHash, statementLocale of the shown wording) signed by the principal; an imbalance is accepted only through an acceptedImbalances entry of the head snapshot | { cycleId, consentId, localVerdict: awaiting_others \| committed, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, MUTINY_CONSENT_STALE_REVISION, MUTINY_CONSENT_LATE, MUTINY_CYCLE_INFEASIBLE, MUTINY_CYCLE_RESERVATION_FAILED, MUTINY_CYCLE_FROZEN, MUTINY_PARTICIPANT_OVERLOADED, COMMS_CONSENT_STALE | mutiny.cycle.consent_recorded, mutiny.cycle.committed | yes (Idempotency-Key) |
| `mutiny.cycle.decline` | mutiny.cycle.decline | { cycleId, expectedRevision, reasonCode? } — vault command; produces statement classrup.comms.consent/v1 kind decline (comms.consent.sign, subjectType mutiny_cycle, statementKey consent.mutiny.cycle.commit.v1 with its decline wording) signed by the principal, and releases the principal's reservation through LockPort.releaseForSubject in the same transaction | { cycleId, revision, status: declined, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN, COMMS_CONSENT_STALE | mutiny.cycle.declined | yes (Idempotency-Key) |
| `mutiny.cycle.evaluate` | mutiny.cycle.evaluate | { cycleId, trigger: revision\|consent\|decline\|revocation\|reservation\|clock\|import } — internal vault command run inside the transaction of each consumed owner event; reads the records accepted by F08.S02.M02, F02.S03.M02 and F02.S01.M04, calls comms.consent.verify, ingests no envelope and produces no statement | { cycleId, status, localVerdict: awaiting_others \| committed \| frozen \| declined, missing: { code, actorId? }[] } | NOT_FOUND, MUTINY_CONSENT_STATEMENT_INVALID, MUTINY_CONSENT_LATE, MUTINY_CONSENT_STALE_REVISION, MUTINY_CONSENT_EQUIVOCATION | mutiny.cycle.proposed, mutiny.cycle.consent_recorded, mutiny.cycle.committed, mutiny.cycle.declined | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.cycle.get` | mutiny.cycle.read | { cycleId } | { cycle: Cycle, consents: CycleConsent[], locks: CycleLock[], feasibility?: FeasibilityReport, trust: Cycle.trust, awaiting: { actorId, kind: consent\|reservation }[] } | NOT_FOUND |
| `mutiny.cycle.list_mine` | mutiny.cycle.read | { status?, cursor?, limit ≤ 50 } | { items: Cycle[], nextCursor? } |  |
| `mutiny.cycle.explain_verdict` | mutiny.cycle.read | { cycleId } | { committable: boolean, missing: { code, actorId? }[], evaluatedAt, clockBasis: local } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.cycle.proposed` | P2 | { cycleId, origin, suggestionId?, coordinatorId, participantIds, parties [{did, role: coordinator\|participant}], length, revisionNo, revisionHash, consentDeadline } |
| `mutiny.cycle.consent_recorded` | P2 | { cycleId, participantId, participantIds, consentId, kind, revisionNo, revisionHash, direction, status, voidReason? } |
| `mutiny.cycle.committed` | P2 | { cycleId, revisionNo, revisionHash (contextCid for consumers), participantIds, parties [{did, role}], legs [{legId, giverId, receiverId}] (DIDs, ring order), executionDeadline, sourceType, sourceId? } |
| `mutiny.cycle.declined` | P2 | { cycleId, participantId (decliner), participantIds, afterOwnConsent, consentId, cycleKey? } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.proposal.accepted` | open a Cycle with origin trade_proposal and id equal to the proposal id; import both mutiny_proposal consents and reservations by reference, re-verify them (V17) and commit, or freeze when verification fails |
| `mutiny.proposal.revised` | for cycle subjects accepted by F02.S01.M04: revision 1 from a peer creates the Cycle in opening and moves it to proposed; later revisions set the new head, void every CycleConsent on older hashes and require the coordinator reservation to be superseded |
| `mutiny.cycle.locked` | record that a giver's reservation (lockId, reservationCid) accepted by F02.S03.M02 is present and re-evaluate the commit verdict |
| `mutiny.cycle.unlocked` | re-evaluate the verdict; a reservation that expired or was released before commit blocks the commit; ignore reason superseded when a newer active lock of the same giver exists |
| `comms.consent.signed` | own statements only: record the principal's consent or decline for subjectType mutiny_cycle and this cycleId; a decline moves the cycle to declined |
| `comms.consent.received` | peer consent or decline accepted by F08 for subjectType mutiny_cycle and subjectRef this cycleId: read consentId, signerDid, subjectRevision, subjectRevisionHash (ID-3 cid), statementKey, statementLocale, kind and aliasOf; check V06, V07, V08 and V14, store a CycleConsent (a record with aliasOf is attached to the kept consent as aliasIds and not counted again) and re-evaluate the verdict; a decline moves a proposed cycle to declined |
| `comms.consent.revoked` | before commit mark the consent void with voidReason consent_revoked and re-evaluate the verdict; after local commit the revocation is handled by F02.S03.M03 as a dropout |
| `mutiny.revision.forked` | freeze the cycle |
| `mutiny.lock.conflict_detected` | freeze the cycles named in subjectIds |
| `mutiny.cycle.cancelled` | move opening, proposed or committed cycles to cancelled with the dropout's close reason |
| `mutiny.leg.handed_over` | move committed to executing |
| `mutiny.leg.received` | move committed to executing |
| `mutiny.cycle.completed` | move executing to completed |
| `mutiny.cycle.partially_executed` | move executing to partially_executed |
| `identity.reputation.recomputed` | refresh completedTrades in the trust panel of non-terminal cycles containing that DID |
| `privacy.deletion.completed` | pseudonymize the erased principal's DID in retained terminal cycles and consents with the deletion pseudonym and purge non-evidence fields (trust panel, syncStates); signed statements stay verifiable |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_CYCLE_SUGGESTION_UNUSABLE | 409 | no | the suggestion is missing, expired, already used, not verified locally or key-linked without confirmation |
| MUTINY_CYCLE_INFEASIBLE | 422 | no | feasibility is missing, stale or has a failing check |
| MUTINY_CYCLE_DEADLINE_INVALID | 422 | no | consent deadline or execution window out of range |
| MUTINY_CYCLE_LIMIT | 409 | no | the principal has the maximum number of open cycles and proposals, or too many open cycles from identities with no history |
| MUTINY_CYCLE_RESERVATION_FAILED | 409 | no | the principal's own items could not be reserved |
| MUTINY_CONSENT_STALE_REVISION | 409 | no | the consent names a revision number or hash that is not the head, or comms.consent.verify did not return valid |
| MUTINY_CONSENT_STATEMENT_INVALID | 422 | no | the consent was not accepted by F08 or failed signer, subject, subject type or statement-key checks |
| MUTINY_CONSENT_LATE | 410 | no | the consent or the local clock is past the consent deadline |
| MUTINY_CONSENT_EQUIVOCATION | 409 | no | a participant signed a different digest for the head revision number; the cycle is frozen |
| MUTINY_PARTICIPANT_OVERLOADED | 409 | no | the principal already has the maximum number of other open cycles allowed by the length profile |
| MUTINY_CYCLE_FROZEN | 409 | no | the cycle is frozen or terminal and accepts no further action |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# Local verdict evaluation (identical rule for every cycle length):
#   commit iff status = proposed AND localNow < consentDeadline
#     AND for every participant p: CycleConsent(p) with revisionNo = headRevisionNo, revisionHash = headRevisionHash,
#         receivedAtLocal, signedAtClaim, relayReceiptAt <= consentDeadline AND comms.consent.verify(...) = valid in this transaction
#     AND for every giver g: active unexpired CycleLock(g, headHash) with expiresAt >= consentDeadline + executionWindowMs
#     AND FeasibilityReport fresh (<= 10 min) and not infeasible AND no fork, equivocation or conflicting promise flag.
#
# 2-party (origin trade_proposal): Alice and Bob consented on mutiny_proposal digest H1; the cycle opens and commits in each vault that re-verifies both consents + 2 reservations.
# 3-party: Alice (coordinator) proposes at T0; Bob signs T0+2h; Carol signs T0+30h; deadline T0+72h => each vault commits when the last of 3 consents and 3 reservations is verified there.
# 4-party: Alice, Bob, Carol signed; Dan's consent received at Alice's vault T0+72h05m => late at Alice's vault: no commit, cycle expires there;
#          Dan's own vault may show 'waiting', which is truthful: nobody is bound, and Alice's reservation is released at the deadline.
# N-party (8): all 8 consents and 8 reservations are required; 7 of 8 never commits.
mutiny.cycle.propose  Idempotency-Key: 0192f430-0000-7000-8000-000000000001
{ "suggestionId": "0192f431-…", "consentDeadlineMs": 259200000 }
-> 201 { "cycleId": "0192f432-…", "revisionNo": 1, "revisionHash": "sha256-Zk8…", "participantIds": ["did:key:z6MkAlice","did:key:z6MkBob","did:key:z6MkCarol"], "syncState": "prepared" }
mutiny.cycle.consent { "cycleId": "0192f432-…", "revisionNo": 1, "revisionHash": "sha256-Zk8…", "expectedRevision": 2 }   # on Bob's device
-> 200 { "consentId": "0192f433-…", "localVerdict": "awaiting_others", "syncState": "prepared" }
consent via comms.consent.sign (F08.S02.M02) on Bob's device:
{ "subjectType":"mutiny_cycle", "subjectRef":"0192f432-…", "subjectRevision":1, "subjectRevisionHash":"sha256-Zk8…", "statementLocale":"en",
  "statementKey":"consent.mutiny.cycle.commit.v1", "kind":"consent", "readConfirmed":true }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-021-09.T01 | integration | PS-021-01.R01, PS-021-03.R01, PS-021-04.R03 | 3-party happy path across three vaults | each vault commits after verifying 3 consents and 3 reservations; committed event carries executionDeadline and parties |
| TEST-PS-021-09.T05 | integration | PS-021-03.R02, PS-021-04.R02, PS-021-01.R03 | coordinator revises after two consents | all consents void, reservations superseded, only the coordinator can revise, participant change refused |
| TEST-PS-021-09.T10 | contract | PS-021-04.R01, PS-021-04.R04, PS-021-09.R02, PS-021-09.R04 | all commands and evaluate | outputs and events validate against classrup.mutiny.cycle/v1, cycle_consent/v1 and the registry; no cycle envelope is ingested or sent; sync states advance only when acknowledged |
| TEST-PS-021-09.T23 | contract | PS-021-04.R05, PS-021-02.R02 | F11.S01.M01 registry lookup and comms.consent.sign payload | registered signer roles match; consent uses subjectType mutiny_cycle, key consent.mutiny.cycle.commit.v1, subjectRevision equal to the head number and subjectRevisionHash equal to the head contentHash cid (a hex-encoded digest is not counted); declines are kind decline |
| TEST-PS-021-09.T25 | unit | PS-021-02.R04, PS-021-04.R06 | principal with 2 other open cycles consents to a 4-party cycle; with 1 other open cycle | MUTINY_PARTICIPANT_OVERLOADED only in the principal's own vault and no count in any statement or event; second consent allowed; declined event carries participantIds |
| TEST-PS-021-09.T28 | contract | PS-021-04.R08, PS-021-02.R02 | F08 shared SubjectCanonicalizerPort conformance suite against the mutiny_cycle registration for C3 and C2 (origin trade_proposal); comms.consent.received for Bob's consent then a duplicate whose aliasOf names it | canonicalBytes equals F02.S01.M04 canonicalBytes and its ID-3 cid equals headRevisionHash for both; currentRevision returns the head; partyRole returns participant for Alice, Bob and Carol and none for Dan; isCommitted false while proposed and true after the local commit; statementLocale stored; the alias is attached as aliasIds and Bob counts once |
| TEST-PS-021-09.T29 | contract | PS-021-04.R07, PS-021-04.R06 | C4 commits at Alice's vault | mutiny.cycle.committed carries legs [{legId, giverId, receiverId}] A to B, B to C, C to D, D to A in ring order with DIDs, parties and revisionHash, and validates against the F07.S03.M01 consumer expectation |

## Dependencies

Module depends on: F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F07.S03.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
