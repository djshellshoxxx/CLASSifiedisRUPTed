# PS-015-04 — Commands, queries and events: Two-party barter

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M01 Two-party barter](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/two` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-015-04.R01** create, accept, counter, reject and withdraw are vault commands; each names the signed statements it produces, and ingest is a vault command that produces none.
- **PS-015-04.R02** Every command writes its record, events and outbox entries in one IndexedDB transaction (EVT-8) and statements go to the sync outbox with states prepared, transport_acknowledged and peer_accepted.
- **PS-015-04.R03** The module consumes revision, consent, reservation, roster, block and inventory events only to re-evaluate the local verdict and never acts for another party.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.proposal.create` | mutiny.proposal.create | { counterpartyId, giveItems[1..5], wantItems[1..5], compensation? { payerId, amount: Money }, expiresInMs?, note? ≤ 500 } — vault command; produces statements classrup.mutiny.proposal_revision/v1 (revision 1), classrup.comms.consent/v1 (proposer consent on the revision hash) and classrup.mutiny.cycle_lock/v1 (proposer reservation) | { proposalId, revisionNo: 1, revisionHash, status: open, syncState: local_committed \| prepared } | VALIDATION_FAILED, MUTINY_PROPOSAL_LEGS_INVALID, MUTINY_PROPOSAL_DEADLINE_INVALID, MUTINY_PROPOSAL_LIMIT, MUTINY_PROPOSAL_DUPLICATE, MUTINY_PROPOSAL_INFEASIBLE, MUTINY_PROPOSAL_RESERVATION_FAILED, BLOCKED_PARTY, RATE_LIMITED | mutiny.proposal.created | yes (Idempotency-Key) |
| `mutiny.proposal.accept` | mutiny.proposal.accept | { proposalId, revisionHash, acceptedImbalance? Money, expectedRevision } — vault command; produces statements classrup.comms.consent/v1 and classrup.mutiny.cycle_lock/v1 for the principal, and the local verdict may complete acceptance | { proposalId, status: open \| accepted, localVerdict: accepted \| awaiting_peer, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, MUTINY_PROPOSAL_CONSENT_STALE, MUTINY_PROPOSAL_INFEASIBLE, MUTINY_PROPOSAL_RESERVATION_FAILED, MUTINY_PROPOSAL_ROLE | mutiny.proposal.accepted | yes (Idempotency-Key) |
| `mutiny.proposal.counter` | mutiny.proposal.counter | { proposalId, expectedRevision, giveItems[1..5], wantItems[1..5], compensation?, expiresInMs? } — vault command; produces classrup.mutiny.proposal_revision/v1 (next number), classrup.comms.consent/v1 and classrup.mutiny.cycle_lock/v1 for the principal | { proposalId, revisionNo, revisionHash, status: open, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_PROPOSAL_REVISION_LIMIT, MUTINY_PROPOSAL_ROLE, MUTINY_PROPOSAL_LEGS_INVALID, MUTINY_PROPOSAL_INFEASIBLE, MUTINY_PROPOSAL_RESERVATION_FAILED |  | yes (Idempotency-Key) |
| `mutiny.proposal.reject` | mutiny.proposal.reject | { proposalId, expectedRevision, reasonCode? } — vault command; produces statement classrup.mutiny.proposal_response/v1 decision reject signed by the principal | { proposalId, revision, status: rejected, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_PROPOSAL_ROLE | mutiny.proposal.rejected | yes (Idempotency-Key) |
| `mutiny.proposal.withdraw` | mutiny.proposal.withdraw | { proposalId, expectedRevision } — vault command; produces statement classrup.mutiny.proposal_response/v1 decision withdraw signed by the principal | { proposalId, revision, status: withdrawn, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_PROPOSAL_ROLE | mutiny.proposal.withdrawn | yes (Idempotency-Key) |
| `mutiny.proposal.ingest` | mutiny.proposal.ingest | { envelope: classrup.mutiny.proposal_revision/v1 \| classrup.comms.consent/v1 \| classrup.mutiny.cycle_lock/v1 \| classrup.mutiny.proposal_response/v1, provenance } — vault command; produces no statement | { accepted: boolean, quarantineReason?, localVerdict? } | MUTINY_PROPOSAL_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED, NOT_FOUND | mutiny.proposal.accepted, mutiny.proposal.rejected, mutiny.proposal.expired | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.proposal.get` | mutiny.proposal.read | { proposalId } | { proposal: TradeProposal, revisions: ProposalRevision[], feasibility?: FeasibilityReport, awaiting: me \| peer \| none } | NOT_FOUND |
| `mutiny.proposal.list_mine` | mutiny.proposal.read | { status?, role?: proposer\|counterparty, cursor?, limit ≤ 50 } | { items: TradeProposal[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.proposal.created` | P2 | { proposalId, proposerId, counterpartyId, revisionNo, revisionHash, expiresAt, origin } |
| `mutiny.proposal.accepted` | P2 | { proposalId, cycleId, proposerId, counterpartyId, revisionHash, hasCompensation, consentStatementIds, reservationIds } |
| `mutiny.proposal.rejected` | P2 | { proposalId, rejectedBy, reason } |
| `mutiny.proposal.expired` | P2 | { proposalId, reason: timeout\|clock_disagreement } |
| `mutiny.proposal.withdrawn` | P2 | { proposalId, withdrawnBy, reason } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.proposal.revised` | set head pointer and hash, void all consents, release and re-make own reservation if leg items changed, move open to draft |
| `mutiny.revision.forked` | freeze the proposal and release the principal's own reservation |
| `comms.consent.signed` | verify a peer consent statement for this proposal and re-evaluate the local verdict |
| `mutiny.cycle.locked` | record a verified peer reservation and re-evaluate the local verdict |
| `mutiny.cycle.unlocked` | mark the reservation invalid; if it is the principal's own and the proposal is open, withdraw with reason item_unavailable |
| `mutiny.party.left` | treat a party that left as rejecting or withdrawing, closing the proposal without a statement unless the principal is the leaver |
| `identity.block.added` | close open proposals with the blocked DID locally as rejected with reason blocked_locally, sending nothing |
| `bazaar.inventory.depleted` | if an own item of the proposal depleted, withdraw with reason item_unavailable |

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
Bob's vault ingests 3 envelopes (revision, Alice consent, Alice reservation), runs feasibility, then Bob signs:
mutiny.proposal.accept { "proposalId":"0192f413-…", "revisionHash":"sha256-Zk8…", "expectedRevision": 2 }
-> 200 { "status":"accepted", "localVerdict":"accepted", "syncState":"prepared" }
Alice's vault becomes accepted only after it receives Bob's consent and reservation, and shows 'waiting for Bob's signature' until then.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-015-09.T07 | contract | PS-015-04.R01, PS-015-04.R02, PS-015-09.R02, PS-015-09.R03 | all commands | outputs, events and statements validate against registry schemas; syncState moves through prepared, transport_acknowledged, peer_accepted only as acknowledged |
| TEST-PS-015-09.T08 | integration | PS-015-04.R03, PS-015-06.R04 | revision, consent, reservation arrive out of order and duplicated | verdict re-evaluated after each, duplicates skipped, state converges |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S02.M05, F02.S03.M02, F01.S03.M01, F07.S01.M01, F07.S02.M02, F08.S02.M02, F12.S03.M04, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
