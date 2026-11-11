# PS-015-04 — Commands, queries and events: Two-party barter

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M01 Two-party barter](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/two` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-015-04.R01** create, accept, counter, reject and withdraw are vault commands; each names the signed statements it produces, and ingest is a vault command that verifies only peers' classrup.mutiny.proposal_response/v1 withdrawals and produces none.
- **PS-015-04.R02** Every command writes its record, events and outbox entries in one IndexedDB transaction (EVT-8) and statements go to the sync outbox with states prepared, transport_acknowledged and peer_accepted.
- **PS-015-04.R03** The module consumes revision, consent, reservation, roster, block and inventory events only to re-evaluate the local verdict and never acts for another party.
- **PS-015-04.R04** Statement schemas and signer roles registered with the F11.S01.M01 registry (N2): classrup.mutiny.proposal_response/v1 signed by the head author (withdraw only, ingested here); consents and declines use classrup.comms.consent/v1 signed by a proposal party (ingest owner F08.S02.M02); reservations use classrup.bazaar.reservation/v1 signed by the item owner (ingest owner F02.S03.M02); revisions use classrup.mutiny.proposal_revision/v1 signed by its author (ingest owner F02.S01.M04). The module acts only on records the receiving vault's owner module accepted.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.proposal.create` | mutiny.proposal.create | { counterpartyId, giveItems[1..5], wantItems[1..5], compensation? { payerId, amount: Money }, acceptedImbalances?[{ actorId, maxAmount }], expiresInMs?, executionWindowMs?, note? ≤ 500 } — vault command; produces statements classrup.mutiny.proposal_revision/v1 (revision 1, F02.S01.M04), classrup.bazaar.reservation/v1 (proposer reservation, holder {type: cycle, id: proposalId}, via F02.S03.M02) and classrup.comms.consent/v1 (comms.consent.sign kind consent, subjectType mutiny_proposal, statementKey consent.mutiny.proposal.accept.v1, subjectRevision 1, subjectRevisionHash hex of the digest) | { proposalId, revisionNo: 1, revisionHash, status: open, syncState: local_committed \| prepared } | VALIDATION_FAILED, MUTINY_PROPOSAL_LEGS_INVALID, MUTINY_PROPOSAL_DEADLINE_INVALID, MUTINY_PROPOSAL_LIMIT, MUTINY_PROPOSAL_DUPLICATE, MUTINY_PROPOSAL_INFEASIBLE, MUTINY_PROPOSAL_RESERVATION_FAILED, BLOCKED_PARTY, RATE_LIMITED | mutiny.proposal.created | yes (Idempotency-Key) |
| `mutiny.proposal.accept` | mutiny.proposal.accept | { proposalId, revisionHash, revisionNo, expectedRevision } — vault command; produces statements classrup.bazaar.reservation/v1 (via F02.S03.M02) and classrup.comms.consent/v1 (comms.consent.sign, subjectType mutiny_proposal, statementKey consent.mutiny.proposal.accept.v1) for the principal; an imbalance is accepted only through an acceptedImbalances entry of the head snapshot, and the local verdict may complete acceptance | { proposalId, status: open \| accepted, localVerdict: accepted \| awaiting_peer, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, MUTINY_PROPOSAL_CONSENT_STALE, MUTINY_PROPOSAL_INFEASIBLE, MUTINY_PROPOSAL_RESERVATION_FAILED, MUTINY_PROPOSAL_ROLE | mutiny.proposal.accepted | yes (Idempotency-Key) |
| `mutiny.proposal.counter` | mutiny.proposal.counter | { proposalId, expectedRevision, giveItems[1..5], wantItems[1..5], compensation?, acceptedImbalances?, expiresInMs?, executionWindowMs? } — vault command; produces classrup.mutiny.proposal_revision/v1 (next number), classrup.bazaar.reservation/v1 (superseding the principal's earlier one) and classrup.comms.consent/v1 for the principal | { proposalId, revisionNo, revisionHash, status: open, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_PROPOSAL_REVISION_LIMIT, MUTINY_PROPOSAL_ROLE, MUTINY_PROPOSAL_LEGS_INVALID, MUTINY_PROPOSAL_INFEASIBLE, MUTINY_PROPOSAL_RESERVATION_FAILED |  | yes (Idempotency-Key) |
| `mutiny.proposal.reject` | mutiny.proposal.reject | { proposalId, expectedRevision, reasonCode? } — vault command; produces statement classrup.comms.consent/v1 kind decline (comms.consent.sign, subjectType mutiny_proposal, statementKey consent.mutiny.proposal.accept.v1 with its decline wording) signed by the principal | { proposalId, revision, status: rejected, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_PROPOSAL_ROLE, COMMS_CONSENT_STALE | mutiny.proposal.rejected | yes (Idempotency-Key) |
| `mutiny.proposal.withdraw` | mutiny.proposal.withdraw | { proposalId, expectedRevision } — vault command; produces statement classrup.mutiny.proposal_response/v1 decision withdraw signed by the principal | { proposalId, revision, status: withdrawn, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_PROPOSAL_ROLE | mutiny.proposal.withdrawn | yes (Idempotency-Key) |
| `mutiny.proposal.ingest` | mutiny.proposal.ingest | { envelope: classrup.mutiny.proposal_response/v1 (decision withdraw) signed by the head author, provenance } — vault command; the only envelope type this module ingests; produces no statement; envelopes from DIDs the principal blocked are dropped silently | { accepted: boolean, quarantineReason?, localVerdict? } | MUTINY_PROPOSAL_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED, NOT_FOUND | mutiny.proposal.withdrawn | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.proposal.get` | mutiny.proposal.read | { proposalId } | { proposal: TradeProposal, revisions: ProposalRevision[], feasibility?: FeasibilityReport, awaiting: me \| peer \| none } | NOT_FOUND |
| `mutiny.proposal.list_mine` | mutiny.proposal.read | { status?, role?: proposer\|counterparty, cursor?, limit ≤ 50 } | { items: TradeProposal[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.proposal.created` | P2 | { proposalId, proposerId, counterpartyId, revisionNo, revisionHash, expiresAt, origin } |
| `mutiny.proposal.accepted` | P2 | { proposalId, cycleId (equals proposalId), proposerId, counterpartyId, parties [{did, role: proposer\|counterparty}], revisionNo, revisionHash, hasCompensation, consentIds, reservationCids, lockIds } |
| `mutiny.proposal.rejected` | P2 | { proposalId, proposerId, counterpartyId, rejectedBy, reason, declineConsentId? } |
| `mutiny.proposal.expired` | P2 | { proposalId, proposerId, counterpartyId, reason: timeout\|clock_disagreement } |
| `mutiny.proposal.withdrawn` | P2 | { proposalId, proposerId, counterpartyId, withdrawnBy, reason, statementCid? } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.proposal.revised` | set head pointer and hash, void all consents, release and re-make own reservation if leg items changed, move open to draft |
| `mutiny.revision.forked` | freeze the proposal and release the principal's own reservation |
| `comms.consent.signed` | own statements only: record the principal's consent or decline (subjectType mutiny_proposal) on the head digest; a decline moves the proposal to rejected |
| `comms.consent.received` | peer consent or decline accepted by F08 for subjectType mutiny_proposal and this proposalId: record it, check subjectRevision equals headRevisionNo and the hash, and re-evaluate the verdict; a decline from the non-author party moves the proposal to rejected |
| `comms.consent.revoked` | mark the consent void with voidReason consent_revoked and re-evaluate the verdict; after acceptance the revocation is handled by F02.S03.M03 as a dropout of the cycle |
| `mutiny.cycle.locked` | record a verified reservation with holder {type: cycle, id: proposalId} (own or peer, by lockId and reservationCid) and re-evaluate the local verdict |
| `mutiny.cycle.unlocked` | mark that reservation invalid; withdraw an open proposal with reason item_unavailable only when the principal's own lock was unlocked with reason expired, item_lost or conflict; ignore reason superseded when a newer active own lock exists for the same subject, and ignore converted and released after a terminal state |
| `mutiny.lock.conflict_detected` | freeze a draft or open proposal named in subjectIds; F02.S03.M02 releases the principal's own reservation with releaseReason fork_frozen |
| `mutiny.party.left` | treat a party that left as rejecting or withdrawing, closing the proposal without a statement unless the principal is the leaver |
| `identity.block.added` | close open proposals with the blocked DID locally as rejected with reason blocked_locally, sending nothing |
| `bazaar.inventory.depleted` | if an own item of the proposal depleted, withdraw with reason item_unavailable |
| `privacy.deletion.completed` | pseudonymize the erased principal's DID in retained terminal proposals with the deletion pseudonym and purge non-evidence fields (note, syncStates); signatures of statements stay verifiable |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_PROPOSAL_LEGS_INVALID | 422 | no | legs, items or parties of the proposal are invalid |
| MUTINY_PROPOSAL_DEADLINE_INVALID | 422 | no | expiry is outside 1 h to 14 d |
| MUTINY_PROPOSAL_REVISION_LIMIT | 409 | no | the proposal already has 20 revisions |
| MUTINY_PROPOSAL_LIMIT | 409 | no | the principal already has the maximum number of open proposals and cycles |
| MUTINY_PROPOSAL_DUPLICATE | 409 | no | an open proposal for the same pair and items exists |
| MUTINY_PROPOSAL_CONSENT_STALE | 409 | no | the revision hash presented is not the current head |
| MUTINY_PROPOSAL_INFEASIBLE | 422 | no | the feasibility report is missing, stale or infeasible |
| MUTINY_PROPOSAL_RESERVATION_FAILED | 409 | no | the principal's own items could not be reserved all-or-nothing |
| MUTINY_PROPOSAL_STATEMENT_INVALID | 422 | no | a statement failed signature, signer role or claimed-time checks and was quarantined |
| MUTINY_PROPOSAL_ROLE | 403 | no | the principal is not the right party for this action on the head revision |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# 2-party: Alice (did:key:z6MkAlice) proposes guitar for Bob's bicycle, plus 5.00 EUR from Bob to Alice
mutiny.proposal.create  Idempotency-Key: 0192f410-0000-7000-8000-000000000001
{ "counterpartyId": "did:key:z6MkBob", "giveItems": [{"inventoryItemId":"0192f411-…","quantity":1}], "wantItems": [{"inventoryItemId":"0192f412-…","quantity":1}],
  "compensation": {"payerId":"did:key:z6MkBob","amount":{"amount":"500","currency":"EUR"}}, "expiresInMs": 259200000 }
-> 201 { "proposalId":"0192f413-…", "revisionNo":1, "revisionHash":"sha256-Zk8…", "status":"open", "syncState":"prepared" }
Bob's vault receives 3 envelopes, each ingested by its owner (revision by F02.S01.M04, Alice consent by F08.S02.M02, Alice reservation by F02.S03.M02), runs feasibility, then Bob signs:
mutiny.proposal.accept { "proposalId":"0192f413-…", "revisionHash":"sha256-Zk8…", "revisionNo": 1, "expectedRevision": 2 }
consent via comms.consent.sign { "subjectType":"mutiny_proposal", "subjectRef":"0192f413-…", "subjectRevision":1, "subjectRevisionHash":"<hex of the 32 bytes of sha256-Zk8…>", "statementKey":"consent.mutiny.proposal.accept.v1", "kind":"consent" }
-> 200 { "status":"accepted", "localVerdict":"accepted", "syncState":"prepared" }
Alice's vault becomes accepted only after it receives Bob's consent and reservation, and shows 'waiting for Bob's signature' until then.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-015-09.T07 | contract | PS-015-04.R01, PS-015-04.R02, PS-015-09.R02, PS-015-09.R03 | all commands | outputs, events and statements validate against registry schemas; syncState moves through prepared, transport_acknowledged, peer_accepted only as acknowledged |
| TEST-PS-015-09.T08 | integration | PS-015-04.R03, PS-015-06.R04 | revision, consent, reservation arrive out of order and duplicated | verdict re-evaluated after each, duplicates skipped, state converges |
| TEST-PS-015-09.T15 | e2e | PS-015-04.R02, PS-015-06.R04 | two mobile browsers propose and accept with 5.00 EUR compensation | UI shows prepared, relay received, acknowledged by peer truthfully; axe zero serious issues |
| TEST-PS-015-09.T19 | integration | PS-015-03.R01, PS-015-02.R02, PS-015-04.R04 | Bob revokes his consent through F08 before Alice's vault receives his reservation | consent void with consent_revoked; comms.consent.verify inside the accepting transaction returns revoked; Alice's vault never reaches accepted |
| TEST-PS-015-09.T20 | integration | PS-015-03.R03, PS-015-04.R01 | Alice withdraws; her signed withdrawal reaches Bob's vault | Bob's proposal moves to withdrawn, mutiny.proposal.withdrawn emitted with both party DIDs, Bob's own reservation released in the same transaction |
| TEST-PS-015-09.T21 | integration | PS-015-06.R03, PS-015-04.R03 | Bob counters (own lock superseded); a peer double promise names the proposal | counter does not withdraw the proposal; conflict_detected freezes it and own reservation is released with fork_frozen |
| TEST-PS-015-09.T24 | contract | PS-015-04.R04 | F11.S01.M01 registry lookup for each statement schema named here | registered signer role matches; consent uses subjectType mutiny_proposal and key consent.mutiny.proposal.accept.v1 with hex digest equal to the base64url-decoded contentHash |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S02.M05, F02.S03.M02, F01.S03.M01, F07.S01.M01, F07.S02.M02, F08.S02.M02, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
